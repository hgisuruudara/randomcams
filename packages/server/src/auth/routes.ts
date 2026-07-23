import express, { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db';
import { signAuthToken } from './jwt';
import { verifyGoogleIdToken } from './google';

const MIN_PASSWORD_LENGTH = 8;

export function authRouter(): Router {
  const router = Router();

  router.post('/signup', express.json(), async (req, res) => {
    const { email, password, displayName } = req.body as {
      email?: string;
      password?: string;
      displayName?: string;
    };

    if (!email || !password || !displayName) {
      return res.status(400).json({ error: 'email, password, and displayName are required' });
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ error: `password must be at least ${MIN_PASSWORD_LENGTH} characters` });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'an account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, passwordHash, displayName },
    });

    const token = signAuthToken({ userId: user.id });
    res.status(201).json({ userId: user.id, token });
  });

  router.post('/login', express.json(), async (req, res) => {
    const { email, password } = req.body as { email?: string; password?: string };
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
    const { idToken } = req.body as { idToken?: string };
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
      // Link to an existing password account with the same email (Google
      // already proved ownership of that email address), otherwise create
      // a fresh account.
      const existingByEmail = await prisma.user.findUnique({ where: { email: identity.email } });
      user = existingByEmail
        ? await prisma.user.update({
            where: { id: existingByEmail.id },
            data: { googleId: identity.googleId },
          })
        : await prisma.user.create({
            data: {
              email: identity.email,
              googleId: identity.googleId,
              displayName: identity.displayName,
            },
          });
    }

    if (user.banned) {
      return res.status(403).json({ error: 'account suspended' });
    }

    const token = signAuthToken({ userId: user.id });
    res.json({ userId: user.id, token });
  });

  return router;
}
