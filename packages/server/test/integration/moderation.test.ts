import { Gender } from '@prisma/client';
import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/db';
import { createReport } from '../../src/moderation/reports';
import { cleanupUsers, createTestSession, createTestUser, markVerified } from '../helpers';

const app = createApp();
const createdUserIds: string[] = [];

afterAll(() => cleanupUsers(createdUserIds));

async function setUpMatchedPair() {
  const alice = await createTestUser({ displayName: 'Alice' });
  const bob = await createTestUser({ displayName: 'Bob' });
  createdUserIds.push(alice.user.id, bob.user.id);
  await markVerified(alice.user.id, Gender.FEMALE);
  await markVerified(bob.user.id, Gender.MALE);
  const session = await createTestSession(alice.user.id, bob.user.id);
  return { alice, bob, session };
}

describe('moderation reports', () => {
  it('a normal report lands in PENDING_REVIEW without banning anyone', async () => {
    const { alice, bob, session } = await setUpMatchedPair();

    const report = await createReport(alice.user.id, {
      sessionId: session.id,
      reportedUserId: bob.user.id,
      reason: 'nudity_or_sexual_content_without_consent',
    });

    expect(report.status).toBe('PENDING_REVIEW');
    const dbBob = await prisma.user.findUnique({ where: { id: bob.user.id } });
    expect(dbBob?.banned).toBe(false);
  });

  it('a suspected_minor report immediately suspends the reported account', async () => {
    const { alice, bob, session } = await setUpMatchedPair();

    const report = await createReport(alice.user.id, {
      sessionId: session.id,
      reportedUserId: bob.user.id,
      reason: 'suspected_minor',
    });

    expect(report.status).toBe('ESCALATED_AUTOMATIC');
    const dbBob = await prisma.user.findUnique({ where: { id: bob.user.id } });
    expect(dbBob?.banned).toBe(true);
  });
});

describe('admin moderation API', () => {
  it('rejects requests without a valid admin token', async () => {
    expect((await request(app).get('/admin/moderation/reports')).status).toBe(401);
    expect(
      (await request(app).get('/admin/moderation/reports').set('x-admin-token', 'wrong')).status
    ).toBe(401);
  });

  it('never leaks passwordHash in the reports listing', async () => {
    const { alice, bob, session } = await setUpMatchedPair();
    await createReport(alice.user.id, {
      sessionId: session.id,
      reportedUserId: bob.user.id,
      reason: 'harassment',
    });

    const res = await request(app)
      .get('/admin/moderation/reports?status=PENDING_REVIEW')
      .set('x-admin-token', process.env.ADMIN_TOKEN!);

    expect(res.status).toBe(200);
    const found = res.body.find((r: { reportedUser: { id: string } }) => r.reportedUser.id === bob.user.id);
    expect(found).toBeTruthy();
    expect(found.reportedUser.passwordHash).toBeUndefined();
    expect(found.reporter.passwordHash).toBeUndefined();
  });

  it('taking action on a report bans the reported user', async () => {
    const { alice, bob, session } = await setUpMatchedPair();
    const report = await createReport(alice.user.id, {
      sessionId: session.id,
      reportedUserId: bob.user.id,
      reason: 'harassment',
    });

    const resolve = await request(app)
      .post(`/admin/moderation/reports/${report.id}/resolve`)
      .set('x-admin-token', process.env.ADMIN_TOKEN!)
      .send({ action: 'ACTION_TAKEN', reviewerLabel: 'test-reviewer' });
    expect(resolve.status).toBe(200);

    const dbBob = await prisma.user.findUnique({ where: { id: bob.user.id } });
    expect(dbBob?.banned).toBe(true);
  });

  it('dismissing a report does not ban anyone', async () => {
    const { alice, bob, session } = await setUpMatchedPair();
    const report = await createReport(alice.user.id, {
      sessionId: session.id,
      reportedUserId: bob.user.id,
      reason: 'other',
    });

    const resolve = await request(app)
      .post(`/admin/moderation/reports/${report.id}/resolve`)
      .set('x-admin-token', process.env.ADMIN_TOKEN!)
      .send({ action: 'DISMISSED' });
    expect(resolve.status).toBe(200);

    const dbBob = await prisma.user.findUnique({ where: { id: bob.user.id } });
    expect(dbBob?.banned).toBe(false);
  });
});
