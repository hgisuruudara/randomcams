import { timingSafeEqual } from 'crypto';
import { RequestHandler } from 'express';
import { verifyAuthToken } from './jwt';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export const requireAuth: RequestHandler = (req, res, next) => {
  const header = req.header('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;
  if (!token) {
    res.status(401).json({ error: 'missing bearer token' });
    return;
  }

  try {
    const { userId } = verifyAuthToken(token);
    req.userId = userId;
    next();
  } catch {
    res.status(401).json({ error: 'invalid or expired token' });
  }
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
