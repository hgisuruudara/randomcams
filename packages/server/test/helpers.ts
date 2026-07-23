import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { Gender, VerificationStatus } from '@prisma/client';
import { prisma } from '../src/db';
import { signAuthToken } from '../src/auth/jwt';

export async function createTestUser(overrides: { displayName?: string; password?: string } = {}) {
  const email = `test-${randomUUID()}@test.randomcams.local`;
  const password = overrides.password ?? 'password123';
  const passwordHash = await bcrypt.hash(password, 4); // low cost factor - tests don't need real security
  const user = await prisma.user.create({
    data: { email, passwordHash, displayName: overrides.displayName ?? 'Test User' },
  });
  return { user, email, password, token: signAuthToken({ userId: user.id }) };
}

export async function markVerified(userId: string, gender: Gender, birthdate = new Date('2000-01-01')) {
  return prisma.user.update({
    where: { id: userId },
    data: { verificationStatus: VerificationStatus.VERIFIED, verifiedGender: gender, verifiedBirthdate: birthdate },
  });
}

export async function createTestSession(userAId: string, userBId: string) {
  return prisma.chatSession.create({ data: { userAId, userBId } });
}

/** Deletes everything owned by the given user ids, in FK-safe order. Call from an afterAll. */
export async function cleanupUsers(userIds: string[]) {
  if (userIds.length === 0) return;
  await prisma.moderationReport.deleteMany({
    where: { OR: [{ reporterId: { in: userIds } }, { reportedUserId: { in: userIds } }] },
  });
  await prisma.chatSession.deleteMany({
    where: { OR: [{ userAId: { in: userIds } }, { userBId: { in: userIds } }] },
  });
  await prisma.verificationRecord.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
}
