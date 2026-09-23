import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/require-admin';
import { recordAudit } from '@/lib/audit';

/**
 * Re-derives the hash chain and reports the first point at which the stored
 * trail stops agreeing with itself.
 *
 * The recomputation uses the same SQL expression as the writer, so any
 * disagreement means the row changed after it was written, rather than the two
 * sides serialising JSON differently.
 *
 * Findings:
 *   ALTERED    the row's contents no longer produce its stored hash
 *   GAP        seq is not contiguous — row(s) were deleted
 *   CHAIN_BREAK the stored prev_hash does not match the actual predecessor
 */
export async function GET(request: Request) {
  const authCheck = await requireSuperAdmin(request);
  if (!authCheck.ok) return authCheck.response;

  try {
    const rows = await prisma.$queryRawUnsafe<
      Array<{
        seq: bigint;
        id: string;
        action: string;
        created_at: Date;
        actor_email: string | null;
        status: string;
      }>
    >(`
      WITH ordered AS (
        SELECT *,
               LAG(hash) OVER (ORDER BY seq) AS expected_prev,
               LAG(seq)  OVER (ORDER BY seq) AS prior_seq
        FROM audit_logs
      ),
      recomputed AS (
        SELECT seq, id, action, created_at, actor_email, hash AS stored_hash,
               prev_hash, expected_prev, prior_seq,
          encode(sha256(convert_to(
            COALESCE(expected_prev, '')
            || '|' || seq::TEXT
            || '|' || COALESCE(actor_email, '')
            || '|' || COALESCE(actor_name, '')
            || '|' || COALESCE(actor_role, '')
            || '|' || action || '|' || entity_type || '|' || entity_id || '|' || outcome
            || '|' || COALESCE("before"::TEXT, '')
            || '|' || COALESCE("after"::TEXT, '')
            || '|' || COALESCE(details::TEXT, '')
            || '|' || to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
          , 'UTF8')), 'hex') AS recomputed_hash
        FROM ordered
      )
      SELECT seq, id, action, created_at, actor_email,
        CASE
          WHEN prior_seq IS NOT NULL AND seq <> prior_seq + 1 THEN 'GAP'
          WHEN recomputed_hash <> stored_hash THEN 'ALTERED'
          WHEN prev_hash IS DISTINCT FROM expected_prev THEN 'CHAIN_BREAK'
          ELSE 'ok'
        END AS status
      FROM recomputed
      ORDER BY seq
    `);

    const problems = rows
      .filter((r) => r.status !== 'ok')
      .map((r) => ({
        seq: Number(r.seq),
        id: r.id,
        action: r.action,
        actor: r.actor_email,
        at: r.created_at,
        status: r.status,
      }));

    // Verifying the trail is itself an event worth recording.
    await recordAudit({
      action: 'AUDIT_CHAIN_VERIFIED',
      entityType: 'AuditLog',
      entityId: 'chain',
      outcome: problems.length === 0 ? 'success' : 'failure',
      details: { checked: rows.length, problems: problems.length },
    });

    return NextResponse.json({
      success: true,
      intact: problems.length === 0,
      checked: rows.length,
      problems,
    });
  } catch (error: any) {
    console.error('Audit verify error:', error.message);
    return NextResponse.json({ success: false, error: 'Verification failed' }, { status: 500 });
  }
}
