// Singleton Socket.io client for real-time chat delivery.
//
// Mirrors the REST call pattern used throughout the app (see
// `conversations/[id].tsx`, `conversations/index.tsx`): a fresh Firebase ID
// token is fetched from `auth.currentUser` right before it's needed, rather
// than cached, because ID tokens expire hourly. Socket.io's `auth` option
// accepts a function for exactly this reason -- it's invoked again on every
// (re)connect attempt, so a stale token from the first connect never gets
// reused on a later reconnect.
//
// This module holds one shared connection. Screens should call `getSocket()`
// and add/remove their own listeners on it (`socket.on(...)` / `socket.off`
// on unmount) rather than creating additional connections -- multiple
// `io(...)` calls to the same server would open multiple redundant sockets,
// each independently authenticated and joined to the same `user:{uid}` room.
import { io, Socket } from 'socket.io-client';
import { auth } from '@/lib/firebase';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(API_URL, {
      autoConnect: true,
      auth: async (cb) => {
        const token = await auth.currentUser?.getIdToken();
        cb({ token });
      },
    });
  }
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
