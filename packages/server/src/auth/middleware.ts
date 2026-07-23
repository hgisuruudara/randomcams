import { timingSafeEqual } from 'crypto';
import { RequestHandler } from 'express';
import { verifyAuthToken } from './jwt';
import { prisma } from '../db';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

// Queries the DB on every call rather than trusting the JWT signature alone.
// That costs a query per request, but it's what makes a ban or a password
// reset take effect immediately instead of waiting out a 30-day token
// expiry - see tokenVersion on the JWT payload and the User model.
export const requireAuth: RequestHandler = (req, res, next) => {
  void (async () => {
    const header = req.header('authorization');
    const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;
    if (!token) {
      res.status(401).json({ error: 'missing bearer token' });
      return;
    }

    let payload;
    try {
      payload = verifyAuthToken(token);
    } catch {
      res.status(401).json({ error: 'invalid or expired token' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      res.status(401).json({ error: 'invalid or expired token' });
      return;
    }
    if (user.tokenVersion !== payload.tokenVersion) {
      res.status(401).json({ error: 'session has been revoked, please log in again' });
      return;
    }
    if (user.banned) {
      res.status(403).json({ error: 'account suspended' });
      return;
    }

    req.userId = user.id;
    next();
  })();
};

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

// Stopgap only: a single shared secret, not per-admin accounts, audit trail,
// or role-based access. Fine for a handful of trusted staff during early
// development; replace with real staff auth before this is reachable from
// anywhere but a trusted operator.
export const requireAdmin: RequestHandler = (req, res, next) => {
  const configured = process.env.ADMIN_TOKEN;
  const provided = req.header('x-admin-token');

  if (!configured) {
    res.status(503).json({ error: 'admin access is not configured' });
    return;
  }
  if (!provided || !safeEqual(provided, configured)) {
    res.status(401).json({ error: 'invalid admin token' });
    return;
  }
  next();
};
