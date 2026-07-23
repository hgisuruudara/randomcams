import express, { Router } from 'express';
import bcrypt from 'bcryptjs';
import { CURRENT_TOS_VERSION } from '@randomcams/shared';
import { prisma } from '../db';
import { signAuthToken } from './jwt';
import { verifyGoogleIdToken } from './google';
import { createAuthRateLimiter } from './rateLimit';
import { requireAuth } from './middleware';
import { generateToken, hashToken } from './tokens';
import { getMailer } from '../mailer';

const MIN_PASSWORD_LENGTH = 8;
const MAX_DISPLAY_NAME_LENGTH = 60;
// Deliberately simple (structural sanity check, not full RFC 5322
// compliance) — the real check that an address is reachable is the account
// being usable at all, not a stricter regex.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function sendVerificationEmail(userId: string, email: string) {
  const token = generateToken();
  await prisma.user.update({
    where: { id: userId },
    data: {
      emailVerificationTokenHash: hashToken(token),
      emailVerificationExpiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
    },
  });
  const link = `${CLIENT_ORIGIN}/verify-email?token=${token}`;
  await getMailer().send(email, 'Verify your email', `Confirm your email address: ${link}`);
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

    await sendVerificationEmail(user.id, user.email).catch(() => undefined);

    const token = signAuthToken({ userId: user.id, tokenVersion: user.tokenVersion });
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

    const token = signAuthToken({ userId: user.id, tokenVersion: user.tokenVersion });
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
            // Google already verified this address to sign the user in.
            emailVerifiedAt: new Date(),
          },
        });
      }
    }

    if (user.banned) {
      return res.status(403).json({ error: 'account suspended' });
    }

    const token = signAuthToken({ userId: user.id, tokenVersion: user.tokenVersion });
    res.json({ userId: user.id, token });
  });

  // Informational/security hygiene only - does not gate app usage. See the
  // comment on User.emailVerifiedAt in schema.prisma.
  router.post('/verify-email', express.json(), async (req, res) => {
    const { token } = req.body as { token?: string };
    if (!token) return res.status(400).json({ error: 'token is required' });

    const user = await prisma.user.findFirst({ where: { emailVerificationTokenHash: hashToken(token) } });
    if (!user || !user.emailVerificationExpiresAt || user.emailVerificationExpiresAt < new Date()) {
      return res.status(400).json({ error: 'invalid or expired verification link' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date(), emailVerificationTokenHash: null, emailVerificationExpiresAt: null },
    });
    res.json({ ok: true });
  });

  // Always responds the same way regardless of whether the email exists,
  // so this endpoint can't be used to enumerate registered accounts.
  router.post('/request-password-reset', express.json(), async (req, res) => {
    const email = typeof req.body.email === 'string' ? normalizeEmail(req.body.email) : undefined;
    if (!email) return res.status(400).json({ error: 'email is required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const token = generateToken();
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetTokenHash: hashToken(token),
          passwordResetExpiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
        },
      });
      const link = `${CLIENT_ORIGIN}/reset-password?token=${token}`;
      await getMailer()
        .send(email, 'Reset your password', `Reset your password: ${link}\nThis link expires in 1 hour.`)
        .catch(() => undefined);
    }

    res.json({ ok: true });
  });

  router.post('/reset-password', express.json(), async (req, res) => {
    const { token, newPassword } = req.body as { token?: string; newPassword?: string };
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'token and newPassword are required' });
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ error: `newPassword must be at least ${MIN_PASSWORD_LENGTH} characters` });
    }

    const user = await prisma.user.findFirst({ where: { passwordResetTokenHash: hashToken(token) } });
    if (!user || !user.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date()) {
      return res.status(400).json({ error: 'invalid or expired reset link' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
        // Invalidate every outstanding session - if someone else had access
        // to the account, a password reset should actually lock them out,
        // not just the person doing the reset.
        tokenVersion: { increment: 1 },
      },
    });

    const newToken = signAuthToken({ userId: updated.id, tokenVersion: updated.tokenVersion });
    res.json({ userId: updated.id, token: newToken });
  });

  // Bumps tokenVersion, which invalidates every JWT issued before this call
  // - including the one used to authenticate this very request. That's
  // intentional: "log out everywhere" means everywhere.
  router.post('/logout-everywhere', requireAuth, async (req, res) => {
    await prisma.user.update({ where: { id: req.userId! }, data: { tokenVersion: { increment: 1 } } });
    res.json({ ok: true });
  });

  return router;
}
