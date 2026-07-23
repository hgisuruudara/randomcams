import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import Redis from 'ioredis';
import { verificationRouter } from './verification/routes';
import { moderationAdminRouter } from './moderation/adminRoutes';
import { createSocketServer } from './signaling/socketServer';

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173' }));

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/verification', verificationRouter());
app.use('/admin/moderation', moderationAdminRouter());

const httpServer = createServer(app);
const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379');
createSocketServer(httpServer, redis);

const port = Number(process.env.PORT ?? 4000);
httpServer.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`server listening on :${port}`);
});
