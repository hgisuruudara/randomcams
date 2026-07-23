import { randomUUID } from 'crypto';
import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/db';
import { setMailer, Mailer } from '../../src/mailer';
import { cleanupUsers, createTestUser } from '../helpers';

const app = createApp();
const createdUserIds: string[] = [];

afterAll(() => cleanupUsers(createdUserIds));

let sentEmails: { to: string; subject: string; body: string }[] = [];
class CapturingMailer implements Mailer {
  async send(to: string, subject: string, body: string) {
    sentEmails.push({ to, subject, body });
  }
}
beforeEach(() => {
  sentEmails = [];
  setMailer(new CapturingMailer());
});

function extractToken(body: string): string {
  const match = body.match(/token=([a-f0-9]+)/);
  if (!match) throw new Error(`no token found in email body: ${body}`);
  return match[1];
}

describe('token revocation', () => {
  it("rejects a request made with a banned account's token", async () => {
    const { user, token } = await createTestUser();
    createdUserIds.push(user.id);
    await prisma.user.update({ where: { id: user.id }, data: { banned: true } });

    const res = await request(app).get('/verification/status').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('logout-everywhere invalidates the token used to call it', async () => {
    const { user, token } = await createTestUser();
    createdUserIds.push(user.id);

    const logout = await request(app).post('/auth/logout-everywhere').set('Authorization', `Bearer ${token}`);
    expect(logout.status).toBe(200);

    const after = await request(app).get('/verification/status').set('Authorization', `Bearer ${token}`);
    expect(after.status).toBe(401);
  });
});

describe('password reset', () => {
  it('always responds ok regardless of whether the email exists (no enumeration)', async () => {
    const res = await request(app)
      .post('/auth/request-password-reset')
      .send({ email: 'definitely-not-a-real-account@test.randomcams.local' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(sentEmails).toHaveLength(0);
  });

  it('rejects an invalid or already-used reset token', async () => {
    const res = await request(app)
      .post('/auth/reset-password')
      .send({ token: 'not-a-real-token', newPassword: 'newpassword123' });
    expect(res.status).toBe(400);
  });

  it('resets the password, logs the old session out, and the new password works', async () => {
    const { user, token, email } = await createTestUser();
    createdUserIds.push(user.id);

    const requestRes = await request(app).post('/auth/request-password-reset').send({ email });
    expect(requestRes.status).toBe(200);
    expect(sentEmails).toHaveLength(1);
    const resetToken = extractToken(sentEmails[0].body);

    const resetRes = await request(app)
      .post('/auth/reset-password')
      .send({ token: resetToken, newPassword: 'brandnewpassword123' });
    expect(resetRes.status).toBe(200);
    expect(resetRes.body.token).toBeTruthy();

    // Old session is dead.
    const oldTokenCheck = await request(app).get('/verification/status').set('Authorization', `Bearer ${token}`);
    expect(oldTokenCheck.status).toBe(401);

    // New password works; old one doesn't.
    const loginNew = await request(app).post('/auth/login').send({ email, password: 'brandnewpassword123' });
    expect(loginNew.status).toBe(200);
    const loginOld = await request(app).post('/auth/login').send({ email, password: 'password123' });
    expect(loginOld.status).toBe(401);

    // The reset token itself is single-use.
    const reuse = await request(app)
      .post('/auth/reset-password')
      .send({ token: resetToken, newPassword: 'anotherpassword123' });
    expect(reuse.status).toBe(400);
  });
});

describe('email verification', () => {
  it('rejects an invalid verification token', async () => {
    const res = await request(app).post('/auth/verify-email').send({ token: 'not-a-real-token' });
    expect(res.status).toBe(400);
  });

  it('a real signup sends a verification email whose token actually verifies the account', async () => {
    const email = `${randomUUID()}@test.randomcams.local`;
    const signup = await request(app)
      .post('/auth/signup')
      .send({ email, password: 'password123', displayName: 'Verify Me', acceptedTerms: true });
    createdUserIds.push(signup.body.userId);

    expect(sentEmails).toHaveLength(1);
    expect(sentEmails[0].to).toBe(email);
    const verifyToken = extractToken(sentEmails[0].body);

    const verifyRes = await request(app).post('/auth/verify-email').send({ token: verifyToken });
    expect(verifyRes.status).toBe(200);

    const dbUser = await prisma.user.findUnique({ where: { id: signup.body.userId } });
    expect(dbUser?.emailVerifiedAt).toBeTruthy();
    expect(dbUser?.emailVerificationTokenHash).toBeNull();

    // Not gating app usage: verificationStatus (the KYC gate) is untouched.
    expect(dbUser?.verificationStatus).toBe('UNVERIFIED');
  });
});
