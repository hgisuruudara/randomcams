import { createHmac } from 'crypto';
import { afterEach, describe, expect, it } from 'vitest';
import { generateTurnCredentials } from '../../src/webrtc/turnCredentials';

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe('generateTurnCredentials', () => {
  it('returns null when TURN is not configured', () => {
    delete process.env.TURN_SECRET;
    delete process.env.TURN_URLS;
    delete process.env.TURN_URL;
    expect(generateTurnCredentials('user-1')).toBeNull();
  });

  it('returns null when only the secret is set, without a URL', () => {
    process.env.TURN_SECRET = 'shh';
    delete process.env.TURN_URLS;
    delete process.env.TURN_URL;
    expect(generateTurnCredentials('user-1')).toBeNull();
  });

  it('produces a username/credential pair coturn would accept', () => {
    process.env.TURN_SECRET = 'test-secret';
    process.env.TURN_URLS = 'turn:example.com:3478';
    process.env.TURN_CREDENTIAL_TTL_SECONDS = '3600';

    const creds = generateTurnCredentials('user-42');
    expect(creds).not.toBeNull();
    expect(creds!.urls).toEqual(['turn:example.com:3478']);
    expect(creds!.ttlSeconds).toBe(3600);

    const [expiryStr, label] = creds!.username.split(':');
    expect(label).toBe('user-42');
    expect(Number(expiryStr)).toBeGreaterThan(Date.now() / 1000);

    const expectedCredential = createHmac('sha1', 'test-secret').update(creds!.username).digest('base64');
    expect(creds!.credential).toBe(expectedCredential);
  });

  it('splits comma-separated TURN_URLS into multiple entries', () => {
    process.env.TURN_SECRET = 'test-secret';
    process.env.TURN_URLS = 'turn:example.com:3478?transport=udp, turn:example.com:3478?transport=tcp';

    const creds = generateTurnCredentials('user-1');
    expect(creds!.urls).toEqual(['turn:example.com:3478?transport=udp', 'turn:example.com:3478?transport=tcp']);
  });

  it('falls back to TURN_URL for backward compatibility', () => {
    process.env.TURN_SECRET = 'test-secret';
    delete process.env.TURN_URLS;
    process.env.TURN_URL = 'turn:example.com:3478';

    const creds = generateTurnCredentials('user-1');
    expect(creds!.urls).toEqual(['turn:example.com:3478']);
  });

  it('defaults the TTL to 6 hours when unset', () => {
    process.env.TURN_SECRET = 'test-secret';
    process.env.TURN_URLS = 'turn:example.com:3478';
    delete process.env.TURN_CREDENTIAL_TTL_SECONDS;

    const creds = generateTurnCredentials('user-1');
    expect(creds!.ttlSeconds).toBe(6 * 60 * 60);
  });
});
