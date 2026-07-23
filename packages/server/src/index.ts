import 'dotenv/config';
import { createServer } from 'http';
import Redis from 'ioredis';
import { createApp } from './app';
import { createSocketServer } from './signaling/socketServer';
import { logger } from './logger';

const app = createApp();
const httpServer = createServer(app);
const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379');
createSocketServer(httpServer, redis);

const port = Number(process.env.PORT ?? 4000);
httpServer.listen(port, () => {
  logger.info({ port }, 'server listening');
});
