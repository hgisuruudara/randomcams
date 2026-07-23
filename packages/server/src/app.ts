import express, { Express } from 'express';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { authRouter } from './auth/routes';
import { verificationRouter } from './verification/routes';
import { moderationAdminRouter } from './moderation/adminRoutes';
import { logger } from './logger';

// Builds the Express app without binding a port, so tests can drive it
// directly with supertest instead of spinning up a real HTTP listener.
export function createApp(): Express {
  const app = express();
  app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173' }));
  app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/health' } }));

  app.get('/health', (_req, res) => res.json({ ok: true }));
  app.use('/auth', authRouter());
  app.use('/verification', verificationRouter());
  app.use('/admin/moderation', moderationAdminRouter());

  return app;
}
