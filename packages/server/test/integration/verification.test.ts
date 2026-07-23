import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/db';
import { cleanupUsers, createTestUser } from '../helpers';

const app = createApp();
const createdUserIds: string[] = [];

afterAll(() => cleanupUsers(createdUserIds));

function extractProviderReference(redirectUrl: string): string {
  const match = redirectUrl.match(/mock-kyc\/([^?]+)/);
  if (!match) throw new Error(`could not extract providerReference from ${redirectUrl}`);
  return match[1];
}

describe('verification flow', () => {
  it('requires auth on /status and /start', async () => {
    expect((await request(app).get('/verification/status')).status).toBe(401);
    expect((await request(app).post('/verification/start')).status).toBe(401);
  });

  it('the redirectUrl from /start is actually reachable (regression: was missing the /verification prefix)', async () => {
    const { user, token } = await createTestUser();
    createdUserIds.push(user.id);

    const start = await request(app).post('/verification/start').set('Authorization', `Bearer ${token}`);
    const path = new URL(start.body.redirectUrl).pathname;
    const page = await request(app).get(path);
    expect(page.status).toBe(200);
    expect(page.text).toContain('Mock identity verification');
  });

  it('verifies an adult and sets their verified gender from the mock KYC result', async () => {
    const { user, token } = await createTestUser();
    createdUserIds.push(user.id);

    const start = await request(app).post('/verification/start').set('Authorization', `Bearer ${token}`);
    expect(start.status).toBe(200);
    const providerReference = extractProviderReference(start.body.redirectUrl);

    const webhook = await request(app)
      .post('/verification/webhook')
      .set('Content-Type', 'application/json')
      .send(
        JSON.stringify({
          providerReference,
          status: 'verified',
          extractedGender: 'FEMALE',
          extractedBirthdate: '2000-01-01',
        })
      );
    expect(webhook.status).toBe(200);
    expect(webhook.body.status).toBe('VERIFIED');

    const status = await request(app).get('/verification/status').set('Authorization', `Bearer ${token}`);
    expect(status.body.verificationStatus).toBe('VERIFIED');

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    expect(dbUser?.verifiedGender).toBe('FEMALE');
  });

  it('rejects verification even when the vendor says "verified" if the birthdate implies a minor', async () => {
    // This is the defense-in-depth check: a vendor bug or bad ID scan must
    // not be the only thing standing between a minor and this app.
    const { user, token } = await createTestUser();
    createdUserIds.push(user.id);

    const start = await request(app).post('/verification/start').set('Authorization', `Bearer ${token}`);
    const providerReference = extractProviderReference(start.body.redirectUrl);

    const webhook = await request(app)
      .post('/verification/webhook')
      .set('Content-Type', 'application/json')
      .send(
        JSON.stringify({
          providerReference,
          status: 'verified',
          extractedGender: 'FEMALE',
          extractedBirthdate: '2015-01-01',
        })
      );
    expect(webhook.body.status).toBe('REJECTED');

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    expect(dbUser?.verificationStatus).toBe('REJECTED');
    expect(dbUser?.verifiedGender).toBeNull();
  });
});
