import request from 'supertest';
import { afterAll, afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app';
import { cleanupUsers, createTestUser } from '../helpers';

const app = createApp();
const createdUserIds: string[] = [];
const ORIGINAL_ENV = { ...process.env };

afterAll(() => cleanupUsers(createdUserIds));
afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe('GET /webrtc/turn-credentials', () => {
  it('requires auth', async () => {
    expect((await request(app).get('/webrtc/turn-credentials')).status).toBe(401);
  });

  it('returns 404 when TURN is not configured on this deployment', async () => {
    delete process.env.TURN_SECRET;
    delete process.env.TURN_URLS;
    delete process.env.TURN_URL;
    const { user, token } = await createTestUser();
    createdUserIds.push(user.id);

    const res = await request(app).get('/webrtc/turn-credentials').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('mints per-user, time-limited credentials when TURN is configured', async () => {
    process.env.TURN_SECRET = 'test-secret';
    process.env.TURN_URLS = 'turn:example.com:3478';
    const { user, token } = await createTestUser();
    createdUserIds.push(user.id);

    const res = await request(app).get('/webrtc/turn-credentials').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.urls).toEqual(['turn:example.com:3478']);
    expect(res.body.username.endsWith(`:${user.id}`)).toBe(true);
    expect(typeof res.body.credential).toBe('string');
    expect(typeof res.body.ttlSeconds).toBe('number');
  });
});
