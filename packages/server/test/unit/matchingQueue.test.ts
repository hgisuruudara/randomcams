import RedisMock from 'ioredis-mock';
import { beforeEach, describe, expect, it } from 'vitest';
import { MatchingQueue, QueueEntry } from '../../src/matching/queue';

function entry(overrides: Partial<QueueEntry>): QueueEntry {
  return {
    userId: 'user-1',
    socketId: 'socket-1',
    gender: 'male',
    seekingGenders: ['female'],
    ...overrides,
  };
}

describe('MatchingQueue', () => {
  let queue: MatchingQueue;

  beforeEach(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const redis = new RedisMock() as any;
    // ioredis-mock shares its in-memory dataset across instances by default,
    // so without this, state from a previous test leaks in here.
    await redis.flushall();
    queue = new MatchingQueue(redis);
  });

  it('returns null and waits when no compatible partner exists yet', async () => {
    const result = await queue.enqueueOrMatch(
      entry({ userId: 'alice', gender: 'female', seekingGenders: ['male'] })
    );
    expect(result).toBeNull();
  });

  it('matches two mutually-compatible waiting users', async () => {
    await queue.enqueueOrMatch(entry({ userId: 'alice', gender: 'female', seekingGenders: ['male'] }));

    const match = await queue.enqueueOrMatch(
      entry({ userId: 'bob', gender: 'male', seekingGenders: ['female'] })
    );

    expect(match?.userId).toBe('alice');
  });

  it('does not match two users who are not mutually interested in each other', async () => {
    // Both men seeking women - should never match each other.
    await queue.enqueueOrMatch(entry({ userId: 'carl', gender: 'male', seekingGenders: ['female'] }));

    const match = await queue.enqueueOrMatch(
      entry({ userId: 'dan', gender: 'male', seekingGenders: ['female'] })
    );

    expect(match).toBeNull();
  });

  it('does not match a removed user', async () => {
    await queue.enqueueOrMatch(entry({ userId: 'alice', gender: 'female', seekingGenders: ['male'] }));
    await queue.removeUser('alice');

    const match = await queue.enqueueOrMatch(
      entry({ userId: 'bob', gender: 'male', seekingGenders: ['female'] })
    );

    expect(match).toBeNull();
  });

  it('only matches once - a third compatible user does not get double-matched', async () => {
    await queue.enqueueOrMatch(entry({ userId: 'alice', gender: 'female', seekingGenders: ['male'] }));
    const first = await queue.enqueueOrMatch(
      entry({ userId: 'bob', gender: 'male', seekingGenders: ['female'] })
    );
    expect(first?.userId).toBe('alice');

    // Alice and Bob are now both matched and should no longer be in the
    // queue, so a fresh compatible user should just wait.
    const second = await queue.enqueueOrMatch(
      entry({ userId: 'carol', gender: 'female', seekingGenders: ['male'] })
    );
    expect(second).toBeNull();
  });
});
