import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// SECURITY: CORS must not reflect an arbitrary Origin while allowing credentials —
// that lets any website make authenticated requests to our API from a signed-in
// user's browser. Only origins we explicitly trust get Access-Control-Allow-Origin.
// Configure via ALLOWED_ORIGINS (comma-separated) in the environment; sensible
// local-dev defaults are included so `next dev` keeps working out of the box.
const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:8081",
  "http://127.0.0.1:3000",
];

function getAllowedOrigins(): string[] {
  const fromEnv = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  return fromEnv.length > 0 ? fromEnv : DEFAULT_ALLOWED_ORIGINS;
}

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = getAllowedOrigins();
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version, x-admin-bootstrap-secret",
  };
  // No Origin header at all means this isn't a browser cross-origin request
  // (native app, server-to-server, curl) — nothing to reflect, nothing to block.
  if (origin && allowed.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Credentials"] = "true";
    headers["Vary"] = "Origin";
  }
  return headers;
}

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);

  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers });
  }

  const response = NextResponse.next();
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  return response;
}

// Only run middleware on API routes
export const config = {
  matcher: "/api/:path*",
};
