// server.js — Custom entry point for GoDaddy cPanel's Phusion Passenger
// This file bridges GoDaddy's Node.js hosting environment with Next.js

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = false; // Always run in production mode on GoDaddy
const hostname = '0.0.0.0';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  })
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> RealShare server ready on http://${hostname}:${port}`);
    });
});
