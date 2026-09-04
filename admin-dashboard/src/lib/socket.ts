"use client";
// Singleton Socket.io client for real-time chat delivery.
//
// One connection is shared across every page/component in the app -- pages
// should call getSocket() to get it and just add/remove their own
// `new_message` listeners on it, not open their own connection. This keeps
// reconnect/backoff state in one place and avoids a fresh handshake (and a
// fresh Firebase token fetch) every time a component mounts.
//
// `auth` is passed as a function rather than a static object so that a
// FRESH Firebase ID token is fetched on every connect and reconnect
// attempt -- ID tokens expire hourly, and socket.io can reconnect long
// after the token used at first connect has gone stale.
import { io, Socket } from "socket.io-client";
import { auth } from "@/lib/firebase";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket) return socket;

  // No host given -- socket.io-client defaults to same-origin, which is
  // correct here since server.js serves both the Next.js app/API and the
  // Socket.io server on the same http.Server.
  socket = io({
    autoConnect: true,
    auth: (cb: (data: { token: string }) => void) => {
      const user = auth.currentUser;
      if (!user) {
        // No signed-in user yet (e.g. socket created before auth state
        // settles). Send an empty token -- the server rejects it and the
        // connection errors out; socket.io's own retry/backoff will try
        // again shortly, by which point auth.currentUser is usually set.
        cb({ token: "" });
        return;
      }
      user
        .getIdToken()
        .then((token) => cb({ token }))
        .catch(() => cb({ token: "" }));
    },
  });

  return socket;
}

// Explicitly tears down the shared connection. Not wired into every
// consumer automatically -- call it where it's a clean fit (e.g. on
// logout) so a signed-out browser tab doesn't keep sitting in its old
// `user:{uid}` room.
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
