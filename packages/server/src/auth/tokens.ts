import { createHash, randomBytes } from 'crypto';

// Random tokens (email verification, password reset) are stored only as a
// hash, the same principle as passwords - if the DB leaks, the tokens
// shouldn't be directly usable from it.
export function generateToken(): string {
  return randomBytes(32).toString('hex');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
