import express, { Router } from 'express';
import bcrypt from 'bcryptjs';
import { CURRENT_TOS_VERSION } from '@randomcams/shared';
import { prisma } from '../db';
import { signAuthToken } from './jwt';
import { verifyGoogleIdToken } from './google';
import { createAuthRateLimiter } from './rateLimit';

const MIN_PASSWORD_LENGTH = 8;
const MAX_DISPLAY_NAME_LENGTH = 60;
// Deliberately simple (structural sanity check, not full RFC 5322
// compliance) — the real check that an address is reachable is the account
// being usable at all, not a stricter regex.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function authRouter(): Router {
  const router = Router();
  router.use(createAuthRateLimiter());

  router.post('/signup', express.json(), async (req, res) => {
    const { password, displayName, acceptedTerms } = req.body as {
      password?: string;
      displayName?: string;
      acceptedTerms?: boolean;
    };
    const email = typeof req.body.email === 'string' ? normalizeEmail(req.body.email) : undefined;

    if (!email || !password || !displayName) {
      return res.status(400).json({ error: 'email, password, and displayName are required' });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'invalid email address' });
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ error: `password must be at least ${MIN_PASSWORD_LENGTH} characters` });
    }
    if (displayName.trim().length === 0 || displayName.length > MAX_DISPLAY_NAME_LENGTH) {
      return res.status(400).json({ error: `displayName must be 1-${MAX_DISPLAY_NAME_LENGTH} characters` });
    }
    if (acceptedTerms !== true) {
      return res.status(400).json({ error: 'you must accept the Terms of Service and Privacy Policy' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'an account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName: displayName.trim(),
        tosAcceptedAt: new Date(),
        tosVersion: CURRENT_TOS_VERSION,
      },
    });

    const token = signAuthToken({ userId: user.id });
    res.status(201).json({ userId: user.id, token });
  });

  router.post('/login', express.json(), async (req, res) => {
    const { password } = req.body as { password?: string };
    const email = typeof req.body.email === 'string' ? normalizeEmail(req.body.email) : undefined;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      // Same message whether the account doesn't exist or was created via
      // Google and has no password, so we don't leak which case it is.
      return res.status(401).json({ error: 'invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'invalid email or password' });
    }
    if (user.banned) {
      return res.status(403).json({ error: 'account suspended' });
    }

    const token = signAuthToken({ userId: user.id });
    res.json({ userId: user.id, token });
  });

  // Authentication only — this does not touch verifiedGender/verifiedBirthdate.
  // Every account, however it signed up, still has to clear the KYC flow in
  // ../verification before it can be matched.
  router.post('/google', express.json(), async (req, res) => {
    const { idToken, acceptedTerms } = req.body as { idToken?: string; acceptedTerms?: boolean };
    if (!idToken) {
      return res.status(400).json({ error: 'idToken is required' });
    }

    let identity;
    try {
      identity = await verifyGoogleIdToken(idToken);
    } catch {
      return res.status(401).json({ error: 'invalid Google token' });
    }

    let user = await prisma.user.findUnique({ where: { googleId: identity.googleId } });
    if (!user) {
      const existingByEmail = await prisma.user.findUnique({ where: { email: identity.email } });
      if (existingByEmail) {
        // Link to an existing password account with the same email (Google
        // already proved ownership of that email address) - they already
        // accepted terms when that account was created.
        user = await prisma.user.update({
          where: { id: existingByEmail.id },
          data: { googleId: identity.googleId },
        });
      } else {
        if (acceptedTerms !== true) {
          return res.status(400).json({ error: 'you must accept the Terms of Service and Privacy Policy' });
        }
        user = await prisma.user.create({
          data: {
            email: identity.email,
            googleId: identity.googleId,
            displayName: identity.displayName,
            tosAcceptedAt: new Date(),
            tosVersion: CURRENT_TOS_VERSION,
          },
        });
      }
    }

    if (user.banned) {
      return res.status(403).json({ error: 'account suspended' });
    }

    const token = signAuthToken({ userId: user.id });
    res.json({ userId: user.id, token });
  });

  return router;
}
