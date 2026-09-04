// server.js — custom Node entry point for admin-dashboard.
//
// Next.js's own `next start` can't hold a WebSocket server, so real-time
// chat delivery needs a raw http.Server we control, with Socket.io attached
// to it alongside Next's own request handler. This file is that server.
// It's plain JavaScript (not TypeScript) because it runs directly via
// `node server.js`, outside Next's build/compile pipeline.
//
// Originally written for GoDaddy cPanel's Phusion Passenger hosting (that
// deployment path was abandoned — GoDaddy's shared plans don't support
// Node.js at all); kept and generalized here because Render's hosting runs
// a normal long-lived Node process, which is exactly what a socket server
// needs. `npm start` now runs this file (see package.json) so Render picks
// it up with no dashboard changes.

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Minimal, standalone Firebase Admin init for verifying socket handshake
// tokens. Deliberately duplicated (rather than imported) from
// src/lib/firebase-admin.ts: that file is TypeScript compiled as part of
// the Next.js app, and this file runs as plain Node before/alongside that
// build. Same env vars, same "fail closed if unconfigured" posture.
function getSocketAuth() {
  try {
    if (getApps().length === 0) {
      if (process.env.FIREBASE_PRIVATE_KEY && !process.env.FIREBASE_PRIVATE_KEY.includes('YOUR_LONG_KEY_HERE')) {
        initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          }),
        });
      }
    }
  } catch (err) {
    console.error('[socket] Firebase Admin init failed:', err);
  }
  return getApps().length > 0 ? getAuth() : null;
}

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  const io = new Server(httpServer, {
    // Same-origin in production (the app and API share one host on
    // Render); CORS is only relevant for local dev against a different
    // Metro/web-dev origin, so keep it permissive there and same-origin
    // (default, no cors option) in production.
    cors: dev ? { origin: '*' } : undefined,
  });

  const firebaseAuth = getSocketAuth();

  // Every socket must present a valid Firebase ID token on connect -- the
  // same identity check every REST call already goes through. A socket
  // only ever gets to know it's "me" -- it's never told which conversation
  // rooms exist or who's in them; the REST layer decides who to notify.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth && socket.handshake.auth.token;
      if (!token || typeof token !== 'string') {
        return next(new Error('unauthorized'));
      }
      if (!firebaseAuth) {
        return next(new Error('server auth not configured'));
      }
      const decoded = await firebaseAuth.verifyIdToken(token);
      socket.data.uid = decoded.uid;
      next();
    } catch (err) {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    // Each user only ever joins their own room. There is no "join this
    // conversation" event -- that would require the socket layer to
    // re-implement the participant/oversight checks that already live in
    // the REST routes. Instead, the REST route (which already knows and
    // has verified the participants) emits directly to `user:{id}` rooms.
    socket.join(`user:${socket.data.uid}`);

    socket.on('disconnect', () => {
      // socket.io handles room cleanup automatically on disconnect.
    });
  });

  // Exposed so Next.js API routes (running in this same process) can emit
  // events without needing their own socket.io server instance. Guarded
  // with `global.__socketio` (not a plain module export) because Next's
  // dev-mode hot reload can re-evaluate route modules without restarting
  // this outer server -- a global survives that, a module-level singleton
  // built inside the route file would not.
  global.__socketio = io;

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> RealShare server (with real-time chat) ready on http://${hostname}:${port}`);
    });
});
