import { createHmac } from 'crypto';

// Standard coturn REST API credential scheme (the same one used by
// TURN_SECRET/`use-auth-secret` mode): username is "<expiry-unix-ts>:<label>",
// password is base64(HMAC-SHA1(secret, username)). coturn recomputes the same
// HMAC to validate, and rejects once the timestamp has passed - so a leaked
// credential (visible in any browser's WebRTC internals) stops working after
// TURN_CREDENTIAL_TTL_SECONDS instead of granting standing access to the relay.
const DEFAULT_TTL_SECONDS = 6 * 60 * 60;

export interface TurnCredentials {
  urls: string[];
  username: string;
  credential: string;
  ttlSeconds: number;
}

export function generateTurnCredentials(userId: string): TurnCredentials | null {
  const secret = process.env.TURN_SECRET;
  const urlsRaw = process.env.TURN_URLS ?? process.env.TURN_URL;
  if (!secret || !urlsRaw) return null;

  const ttlSeconds = Number(process.env.TURN_CREDENTIAL_TTL_SECONDS) || DEFAULT_TTL_SECONDS;
  const expiry = Math.floor(Date.now() / 1000) + ttlSeconds;
  // The label only needs to be unique-ish for logging on the TURN server side;
  // it isn't a secret and isn't trusted for authorization on its own.
  const username = `${expiry}:${userId}`;
  const credential = createHmac('sha1', secret).update(username).digest('base64');

  return {
    urls: urlsRaw.split(',').map((u) => u.trim()).filter(Boolean),
    username,
    credential,
    ttlSeconds,
  };
}
