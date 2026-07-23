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
