import Redis from 'ioredis';
import { VerifiedGender } from '@randomcams/shared';

export interface QueueEntry {
  userId: string;
  socketId: string;
  gender: VerifiedGender;
  seekingGenders: VerifiedGender[];
}

const GENDERS: VerifiedGender[] = ['male', 'female'];

function queueKey(gender: VerifiedGender): string {
  return `queue:waiting:${gender}`;
}

// Redis-backed FIFO matching queue. Only ever holds entries for verified users
// (enforced by the caller in signaling/socketServer.ts) — verifiedGender here
// comes from KYC, not self-report.
export class MatchingQueue {
  constructor(private redis: Redis) {}

  /**
   * Tries to find a compatible waiting partner for `entry`. If one exists,
   * it is atomically removed from its queue and returned. Otherwise `entry`
   * is pushed onto its own queue and null is returned.
   */
  async enqueueOrMatch(entry: QueueEntry): Promise<QueueEntry | null> {
    for (const candidateGender of entry.seekingGenders) {
      const key = queueKey(candidateGender);
      const raw = await this.redis.lrange(key, 0, -1);

      for (const item of raw) {
        const candidate: QueueEntry = JSON.parse(item);
        if (candidate.userId === entry.userId) continue;
        if (!candidate.seekingGenders.includes(entry.gender)) continue;

        const removed = await this.redis.lrem(key, 1, item);
        if (removed > 0) {
          return candidate;
        }
        // Someone else grabbed it between LRANGE and LREM; keep scanning.
      }
    }

    await this.redis.rpush(queueKey(entry.gender), JSON.stringify(entry));
    return null;
  }

  async removeUser(userId: string): Promise<void> {
    for (const gender of GENDERS) {
      const key = queueKey(gender);
      const raw = await this.redis.lrange(key, 0, -1);
      for (const item of raw) {
        const candidate: QueueEntry = JSON.parse(item);
        if (candidate.userId === userId) {
          await this.redis.lrem(key, 1, item);
        }
      }
    }
  }
}
