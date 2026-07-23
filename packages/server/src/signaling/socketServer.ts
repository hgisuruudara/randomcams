import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import Redis from 'ioredis';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  PublicUser,
} from '@randomcams/shared';
import { prisma } from '../db';
import { MatchingQueue } from '../matching/queue';
import { toSharedGender } from '../matching/genderMap';
import { createReport } from '../moderation/reports';
import { verifyAuthToken } from '../auth/jwt';

interface SocketState {
  userId: string;
}

interface SessionState {
  sessionId: string;
  socketIds: [string, string];
}

export function createSocketServer(httpServer: HttpServer, redis: Redis) {
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: { origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173' },
  });

  const queue = new MatchingQueue(redis);
  const socketState = new Map<string, SocketState>();
  // socketId -> sessionId, so relay handlers know where to send offer/answer/ICE
  const socketToSession = new Map<string, string>();
  const lastReportAt = new Map<string, number>();
  const REPORT_COOLDOWN_MS = 5000;

  io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
    void (async () => {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) {
        socket.emit('errorMessage', { message: 'authentication required' });
        socket.disconnect(true);
        return;
      }

      let userId: string;
      let tokenVersion: number;
      try {
        const payload = verifyAuthToken(token);
        userId = payload.userId;
        tokenVersion = payload.tokenVersion;
      } catch {
        socket.emit('errorMessage', { message: 'invalid or expired token' });
        socket.disconnect(true);
        return;
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || user.banned) {
        socket.emit('errorMessage', { message: 'account unavailable' });
        socket.disconnect(true);
        return;
      }
      if (user.tokenVersion !== tokenVersion) {
        socket.emit('errorMessage', { message: 'session has been revoked, please log in again' });
        socket.disconnect(true);
        return;
      }
      if (user.verificationStatus !== 'VERIFIED' || !user.verifiedGender) {
        socket.emit('verificationRequired');
        socket.disconnect(true);
        return;
      }

      socketState.set(socket.id, { userId: user.id });

      socket.on('joinQueue', (preferences) => {
        void (async () => {
          const seeking = preferences.seekingGenders;
          if (!seeking || seeking.length === 0 || seeking.some((g) => g !== 'male' && g !== 'female')) {
            socket.emit('errorMessage', { message: 'invalid preferences' });
            return;
          }

          const match = await queue.enqueueOrMatch({
            userId: user.id,
            socketId: socket.id,
            gender: toSharedGender(user.verifiedGender!),
            seekingGenders: seeking,
          });

          if (!match) {
            socket.emit('waitingForMatch');
            return;
          }

          const peerSocket = io.sockets.sockets.get(match.socketId);
          if (!peerSocket) {
            // Peer disconnected between being queued and being matched; put
            // this user back in queue.
            await queue.enqueueOrMatch({
              userId: user.id,
              socketId: socket.id,
              gender: toSharedGender(user.verifiedGender!),
              seekingGenders: seeking,
            });
            socket.emit('waitingForMatch');
            return;
          }

          const peerUser = await prisma.user.findUnique({ where: { id: match.userId } });
          if (!peerUser || peerUser.banned || peerUser.verificationStatus !== 'VERIFIED') {
            socket.emit('waitingForMatch');
            return;
          }

          const session = await prisma.chatSession.create({
            data: { userAId: user.id, userBId: peerUser.id },
          });

          socket.join(session.id);
          peerSocket.join(session.id);
          socketToSession.set(socket.id, session.id);
          socketToSession.set(peerSocket.id, session.id);

          const selfPublic: PublicUser = {
            id: user.id,
            displayName: user.displayName,
            verificationStatus: 'verified',
            verifiedGender: toSharedGender(user.verifiedGender!),
          };
          const peerPublic: PublicUser = {
            id: peerUser.id,
            displayName: peerUser.displayName,
            verificationStatus: 'verified',
            verifiedGender: toSharedGender(peerUser.verifiedGender!),
          };

          // The user who was already waiting sends the offer.
          socket.emit('matched', { sessionId: session.id, peer: peerPublic, initiator: false });
          peerSocket.emit('matched', { sessionId: session.id, peer: selfPublic, initiator: true });
        })();
      });

      socket.on('leaveQueue', () => {
        void queue.removeUser(user.id);
      });

      socket.on('offer', ({ sessionId, sdp }) => {
        if (socketToSession.get(socket.id) !== sessionId) return;
        socket.to(sessionId).emit('offer', { sessionId, sdp });
      });

      socket.on('answer', ({ sessionId, sdp }) => {
        if (socketToSession.get(socket.id) !== sessionId) return;
        socket.to(sessionId).emit('answer', { sessionId, sdp });
      });

      socket.on('iceCandidate', ({ sessionId, candidate }) => {
        if (socketToSession.get(socket.id) !== sessionId) return;
        socket.to(sessionId).emit('iceCandidate', { sessionId, candidate });
      });

      socket.on('leaveSession', ({ sessionId }) => {
        void endSession(sessionId, socket.id);
      });

      socket.on('report', ({ sessionId, reportedUserId, reason, note }) => {
        void (async () => {
          if (socketToSession.get(socket.id) !== sessionId) {
            socket.emit('errorMessage', { message: 'you are not part of that session' });
            return;
          }

          const last = lastReportAt.get(user.id) ?? 0;
          if (Date.now() - last < REPORT_COOLDOWN_MS) {
            socket.emit('errorMessage', { message: 'please wait before submitting another report' });
            return;
          }

          const session = await prisma.chatSession.findUnique({ where: { id: sessionId } });
          const peerId = session?.userAId === user.id ? session.userBId : session?.userAId;
          if (!session || peerId !== reportedUserId) {
            socket.emit('errorMessage', { message: 'reportedUserId does not match this session' });
            return;
          }

          lastReportAt.set(user.id, Date.now());
          const report = await createReport(user.id, { sessionId, reportedUserId, reason, note });
          socket.emit('reportAcknowledged', { reportId: report.id });
        })();
      });

      socket.on('disconnect', () => {
        void queue.removeUser(user.id);
        const sessionId = socketToSession.get(socket.id);
        if (sessionId) void endSession(sessionId, socket.id);
        socketState.delete(socket.id);
      });
    })();
  });

  async function endSession(sessionId: string, leavingSocketId: string) {
    for (const [socketId, sid] of socketToSession.entries()) {
      if (sid !== sessionId) continue;
      socketToSession.delete(socketId);
      if (socketId !== leavingSocketId) {
        io.sockets.sockets.get(socketId)?.emit('peerLeft', { sessionId });
      }
    }
    await prisma.chatSession
      .update({ where: { id: sessionId }, data: { endedAt: new Date() } })
      .catch(() => undefined);
  }

  return io;
}
