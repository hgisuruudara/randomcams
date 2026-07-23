import jwt from 'jsonwebtoken';

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');
  return secret;
}

export interface AuthTokenPayload {
  userId: string;
  // Must match the user's current tokenVersion in the DB or the token is
  // rejected (see auth/middleware.ts and signaling/socketServer.ts) even
  // though the signature is valid. This is what makes password-reset and
  // "log out everywhere" actually invalidate outstanding sessions instead of
  // waiting for natural JWT expiry.
  tokenVersion: number;
}

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: '30d' });
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  return jwt.verify(token, getSecret()) as AuthTokenPayload;
}
