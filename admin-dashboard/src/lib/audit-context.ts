import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID } from 'crypto';

/**
 * Per-request context for the audit trail.
 *
 * The audit writer runs deep in the call stack — often inside the Prisma
 * extension, far from the route handler — so it cannot be passed the actor as
 * an argument. AsyncLocalStorage carries it implicitly for the lifetime of the
 * request instead.
 *
 * Populated once inside requireAuth(), which nearly every protected route
 * already calls, so routes need no changes to become attributable. Routes that
 * authenticate by other means can call captureRequestContext() directly.
 */
export interface AuditContext {
  /** Firebase uid of the acting user, if authenticated. */
  uid?: string | null;
  email?: string | null;
  name?: string | null;
  role?: string | null;
  department?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  requestId: string;
  method?: string | null;
  path?: string | null;
  /**
   * Suppresses automatic capture for mechanical writes that would drown the
   * trail — e.g. the property view counter, which updates a row on every page
   * view. Only ever set for operations that carry no forensic meaning.
   */
  suppressAudit?: boolean;
}

const storage = new AsyncLocalStorage<AuditContext>();

/** Reads the caller's real IP, preferring the proxy headers Render sets. */
function clientIp(request: Request): string | null {
  const h = request.headers;
  const forwarded = h.get('x-forwarded-for');
  if (forwarded) {
    // Left-most entry is the original client; the rest are proxies.
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  return (
    h.get('x-real-ip')?.slice(0, 64) ||
    h.get('cf-connecting-ip')?.slice(0, 64) ||
    null
  );
}

/**
 * Starts (or replaces) the audit context for the current request.
 *
 * Uses enterWith rather than run() so it can be called from inside an existing
 * handler without having to wrap every route's body.
 */
export function captureRequestContext(
  request: Request,
  actor?: Partial<Pick<AuditContext, 'uid' | 'email' | 'name' | 'role' | 'department'>>
): AuditContext {
  const existing = storage.getStore();
  let url: URL | null = null;
  try {
    url = new URL(request.url);
  } catch {
    url = null;
  }

  const ctx: AuditContext = {
    requestId: existing?.requestId ?? randomUUID(),
    ip: existing?.ip ?? clientIp(request),
    userAgent: existing?.userAgent ?? request.headers.get('user-agent')?.slice(0, 1000) ?? null,
    method: request.method ?? null,
    path: url ? `${url.pathname}${url.search}`.slice(0, 512) : null,
    uid: actor?.uid ?? existing?.uid ?? null,
    email: actor?.email ?? existing?.email ?? null,
    name: actor?.name ?? existing?.name ?? null,
    role: actor?.role ?? existing?.role ?? null,
    department: actor?.department ?? existing?.department ?? null,
  };

  storage.enterWith(ctx);
  return ctx;
}

/** Fills in the actor once the token has been verified, keeping request metadata. */
export function setAuditActor(
  actor: Partial<Pick<AuditContext, 'uid' | 'email' | 'name' | 'role' | 'department'>>
): void {
  const existing = storage.getStore();
  if (!existing) {
    storage.enterWith({ requestId: randomUUID(), ...actor });
    return;
  }
  Object.assign(existing, actor);
}

export function getAuditContext(): AuditContext | undefined {
  return storage.getStore();
}

/** Explicit scoping, for background jobs and cron that have no Request. */
export function runWithAuditContext<T>(ctx: Partial<AuditContext>, fn: () => T): T {
  return storage.run({ requestId: randomUUID(), ...ctx }, fn);
}

/**
 * Runs `fn` with automatic audit capture turned off.
 *
 * Use only for mechanical, high-volume writes with no forensic value (view
 * counters, last-seen timestamps). Anything a person could later be asked to
 * account for must stay audited.
 */
export async function withoutAudit<T>(fn: () => Promise<T>): Promise<T> {
  const existing = storage.getStore();
  if (!existing) {
    return storage.run({ requestId: randomUUID(), suppressAudit: true }, fn);
  }
  const previous = existing.suppressAudit;
  existing.suppressAudit = true;
  try {
    return await fn();
  } finally {
    existing.suppressAudit = previous;
  }
}
