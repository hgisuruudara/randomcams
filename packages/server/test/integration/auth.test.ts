import { randomUUID } from 'crypto';
import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/db';
import { cleanupUsers } from '../helpers';

const app = createApp();
const createdUserIds: string[] = [];

afterAll(() => cleanupUsers(createdUserIds));

describe('POST /auth/signup', () => {
  it('rejects an invalid email', async () => {
    const res = await request(app)
      .post('/auth/signup')
      .send({ email: 'not-an-email', password: 'password123', displayName: 'X' });
    expect(res.status).toBe(400);
  });

  it('rejects a short password', async () => {
    const res = await request(app)
      .post('/auth/signup')
      .send({ email: `${randomUUID()}@test.randomcams.local`, password: 'short', displayName: 'X' });
    expect(res.status).toBe(400);
  });

  it('rejects signup without accepting terms', async () => {
    const res = await request(app)
      .post('/auth/signup')
      .send({ email: `${randomUUID()}@test.randomcams.local`, password: 'password123', displayName: 'X' });
    expect(res.status).toBe(400);
  });

  it('creates an account and normalizes the email', async () => {
    const rawEmail = `  Test-${randomUUID()}@Test.RandomCams.Local  `;
    const res = await request(app)
      .post('/auth/signup')
      .send({ email: rawEmail, password: 'password123', displayName: 'Signup Test', acceptedTerms: true });

    expect(res.status).toBe(201);
    expect(res.body.userId).toBeTruthy();
    expect(res.body.token).toBeTruthy();
    createdUserIds.push(res.body.userId);

    const user = await prisma.user.findUnique({ where: { id: res.body.userId } });
    expect(user?.email).toBe(rawEmail.trim().toLowerCase());
    expect(user?.verificationStatus).toBe('UNVERIFIED');
    expect(user?.tosAcceptedAt).toBeTruthy();
    expect(user?.tosVersion).toBeTruthy();
  });

  it('rejects a duplicate email', async () => {
    const email = `${randomUUID()}@test.randomcams.local`;
    const first = await request(app)
      .post('/auth/signup')
      .send({ email, password: 'password123', displayName: 'First', acceptedTerms: true });
    createdUserIds.push(first.body.userId);

    const second = await request(app)
      .post('/auth/signup')
      .send({ email, password: 'password123', displayName: 'Second', acceptedTerms: true });
    expect(second.status).toBe(409);
  });
});

describe('POST /auth/login', () => {
  it('logs in with correct credentials', async () => {
    const email = `${randomUUID()}@test.randomcams.local`;
    const signup = await request(app)
      .post('/auth/signup')
      .send({ email, password: 'password123', displayName: 'Login Test', acceptedTerms: true });
    createdUserIds.push(signup.body.userId);

    const login = await request(app).post('/auth/login').send({ email, password: 'password123' });
    expect(login.status).toBe(200);
    expect(login.body.token).toBeTruthy();
  });

  it('rejects the wrong password', async () => {
    const email = `${randomUUID()}@test.randomcams.local`;
    const signup = await request(app)
      .post('/auth/signup')
      .send({ email, password: 'password123', displayName: 'Wrong Password Test', acceptedTerms: true });
    createdUserIds.push(signup.body.userId);

    const login = await request(app).post('/auth/login').send({ email, password: 'wrong-password' });
    expect(login.status).toBe(401);
  });

  it('rejects a banned account even with the correct password', async () => {
    const email = `${randomUUID()}@test.randomcams.local`;
    const signup = await request(app)
      .post('/auth/signup')
      .send({ email, password: 'password123', displayName: 'Banned Test', acceptedTerms: true });
    createdUserIds.push(signup.body.userId);
    await prisma.user.update({ where: { id: signup.body.userId }, data: { banned: true } });

    const login = await request(app).post('/auth/login').send({ email, password: 'password123' });
    expect(login.status).toBe(403);
  });
});

describe('POST /auth/google', () => {
  it('rejects a bogus id token', async () => {
    const res = await request(app).post('/auth/google').send({ idToken: 'not-a-real-token' });
    expect(res.status).toBe(401);
  });
});
