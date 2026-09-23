import { randomUUID } from 'crypto';
import prisma from './prisma';
import { getAuditContext } from './audit-context';

/**
 * Forensic audit writer.
 *
 * Two properties make these records usable as evidence:
 *
 * 1. TAMPER EVIDENCE. Every row stores a SHA-256 over its own contents plus the
 *    previous row's hash, so editing or deleting any row breaks the chain from
 *    that point on. The hash is computed IN SQL, never in JavaScript, because
 *    Postgres renders jsonb as `{"a": 1}` while JSON.stringify produces
 *    `{"a":1}` — hashing the same row on the two sides would disagree and every
 *    verification would report false tampering. Keeping it in SQL means writes
 *    and verification always canonicalise identically.
 *
 *    The hash deliberately covers the actor SNAPSHOT (email/name/role) and not
 *    employee_id: that column is a foreign key which legitimately becomes NULL
 *    when a person is deleted, so hashing it would make every one of their rows
 *    fail verification the moment the account was removed.
 *
 * 2. NO SILENT GAPS. The chain is built under a transaction-scoped advisory
 *    lock so two concurrent writes cannot read the same predecessor and fork it.
 *    A failed write throws by default (see AUDIT_FAIL_OPEN) rather than being
 *    swallowed, so an action that could not be recorded does not quietly
 *    succeed.
 */

/** Arbitrary constant; only needs to be stable and unique to this lock. */
const AUDIT_CHAIN_LOCK = 4021371;

export type AuditOutcome = 'success' | 'denied' | 'failure';

export interface AuditEntry {
  action: string;
  entityType: string;
  entityId: string;
  outcome?: AuditOutcome;
  before?: unknown;
  after?: unknown;
  details?: Record<string, any>;
  /** Overrides the actor from request context (background jobs, impersonation). */
  actor?: {
    uid?: string | null;
    email?: string | null;
    name?: string | null;
    role?: string | null;
    department?: string | null;
  };
}

/**
 * Values that must never be copied into the audit trail.
 *
 * The previous implementation passed the whole changed-fields object straight
 * through, so editing a user wrote their full bank account number and IFSC into
 * `details` in plaintext, kept indefinitely.
 */
/**
 * Identifiers: keeping the last four digits is standard practice and lets an
 * investigator tell one account from another without exposing the number.
 */
const PARTIAL_REDACT_PATTERNS = [
  /account_number/i,
  /bank_ifsc/i,
  /^ifsc$/i,
  /card[_-]?number/i,
];

/**
 * Credentials: no part of these may survive. Revealing even a tail of a
 * password or key narrows a brute-force search, so these are erased entirely
 * and not even their length is kept.
 */
const FULL_REDACT_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /^otp$/i,
  /api[_-]?key/i,
  /authorization/i,
  /private[_-]?key/i,
  /\bcvv\b/i,
  /credential/i,
  /session[_-]?id/i,
];

type Redaction = 'none' | 'partial' | 'full';

function redactionFor(key: string): Redaction {
  if (FULL_REDACT_PATTERNS.some((re) => re.test(key))) return 'full';
  if (PARTIAL_REDACT_PATTERNS.some((re) => re.test(key))) return 'partial';
  return 'none';
}

function maskValue(value: unknown, mode: Redaction): unknown {
  if (value === null || value === undefined) return value;
  if (mode === 'full') return '[redacted]';
  const s = String(value);
  if (s.length <= 4) return '[redacted]';
  return `[redacted:${s.length} chars, ends ${s.slice(-4)}]`;
}

export function redact(input: unknown, depth = 0): unknown {
  if (depth > 8 || input === null || input === undefined) return input;
  if (Array.isArray(input)) return input.map((v) => redact(v, depth + 1));
  if (typeof input !== 'object') return input;

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    const mode = redactionFor(k);
    out[k] = mode === 'none' ? redact(v, depth + 1) : maskValue(v, mode);
  }
  return out;
}

function toJsonParam(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  try {
    return JSON.stringify(redact(value));
  } catch {
    return JSON.stringify({ _unserialisable: true });
  }
}

/**
 * Appends one entry to the chain.
 *
 * Throws if the entry cannot be written, unless AUDIT_FAIL_OPEN=true. Failing
 * closed is deliberate: a trail with unexplained holes is worse than an action
 * that refuses to complete, because a gap is indistinguishable from a deletion.
 * Set AUDIT_FAIL_OPEN=true only if availability must win over completeness.
 */
export async function recordAudit(entry: AuditEntry): Promise<void> {
  const ctx = getAuditContext();
  const actor = entry.actor ?? {};

  const id = randomUUID();
  const createdAt = new Date();

  const employeeId = actor.uid ?? ctx?.uid ?? null;
  const actorEmail = actor.email ?? ctx?.email ?? null;
  const actorName = actor.name ?? ctx?.name ?? null;
  const actorRole = actor.role ?? ctx?.role ?? null;
  const actorDept = actor.department ?? ctx?.department ?? null;

  try {
    await prisma.$transaction(async (tx) => {
      // Serialise chain appends: without this, two concurrent writes can read
      // the same previous hash and produce two rows claiming the same parent.
      await tx.$executeRawUnsafe('SELECT pg_advisory_xact_lock($1)', AUDIT_CHAIN_LOCK);

      await tx.$executeRawUnsafe(
        `
        WITH prev AS (
          SELECT hash AS h FROM audit_logs ORDER BY seq DESC LIMIT 1
        ),
        base AS (
          SELECT nextval('audit_logs_seq_seq') AS seq, (SELECT h FROM prev) AS prev_h
        )
        INSERT INTO audit_logs (
          id, seq, employee_id, actor_email, actor_name, actor_role, actor_dept,
          action, entity_type, entity_id, outcome,
          "before", "after", details,
          ip_address, user_agent, request_id, http_method, path,
          prev_hash, hash, created_at
        )
        SELECT
          $1, base.seq, $2, $3::text, $4::text, $5::text, $6,
          $7::text, $8::text, $9::text, $10::text,
          $11::jsonb, $12::jsonb, $13::jsonb,
          $14, $15, $16, $17, $18,
          base.prev_h,
          encode(sha256(convert_to(
            COALESCE(base.prev_h, '')
            || '|' || base.seq::TEXT
            || '|' || COALESCE($3::text, '')
            || '|' || COALESCE($4::text, '')
            || '|' || COALESCE($5::text, '')
            || '|' || $7::text
            || '|' || $8::text
            || '|' || $9::text
            || '|' || $10::text
            || '|' || COALESCE($11::jsonb::TEXT, '')
            || '|' || COALESCE($12::jsonb::TEXT, '')
            || '|' || COALESCE($13::jsonb::TEXT, '')
            || '|' || to_char($19::timestamptz AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
          , 'UTF8')), 'hex'),
          $19::timestamptz
        FROM base
        `,
        id,
        employeeId,
        actorEmail,
        actorName,
        actorRole,
        actorDept,
        entry.action,
        entry.entityType,
        entry.entityId,
        entry.outcome ?? 'success',
        toJsonParam(entry.before),
        toJsonParam(entry.after),
        toJsonParam(entry.details),
        ctx?.ip ?? null,
        ctx?.userAgent ?? null,
        ctx?.requestId ?? null,
        ctx?.method ?? null,
        ctx?.path ?? null,
        createdAt
      );
    });
  } catch (err) {
    console.error('[Audit] FAILED to record action', {
      action: entry.action,
      entity: `${entry.entityType}:${entry.entityId}`,
      actor: employeeId,
      error: err instanceof Error ? err.message : String(err),
    });
    if (process.env.AUDIT_FAIL_OPEN !== 'true') throw err;
  }
}

/**
 * Backwards-compatible wrapper for the original call signature, so the existing
 * call sites keep working while gaining actor snapshot, request context and the
 * hash chain automatically.
 */
export async function logAdminAction(
  employeeId: string,
  action: string,
  entityType: string,
  entityId: string,
  details?: Record<string, any>
): Promise<void> {
  await recordAudit({
    action,
    entityType,
    entityId,
    details,
    actor: { uid: employeeId },
  });
}
