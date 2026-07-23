import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from '@randomcams/shared';

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:4000';

export function connectSocket(token: string): Socket<ServerToClientEvents, ClientToServerEvents> {
  return io(SERVER_URL, {
    auth: { token },
    autoConnect: true,
  });
}
