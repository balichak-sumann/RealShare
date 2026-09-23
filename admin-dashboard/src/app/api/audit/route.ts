import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/require-admin';
import { recordAudit } from '@/lib/audit';

/**
 * Superadmin-only read of the audit trail.
 *
 * Deliberately superadmin rather than admin: the trail records what admins and
 * employees did, so a plain admin must not be able to read the record of their
 * own actions.
 *
 * Queries are built as parameterised raw SQL rather than through the Prisma
 * client, for the same reason the writer is: the audit columns are managed by a
 * hand-written migration, so the code must not depend on the generated client
 * being in step with them.
 *
 * Supports: actor / action / entity / outcome / date filters, keyset pagination
 * by seq, and CSV export for handing evidence to someone else.
 */
export async function GET(request: Request) {
  const authCheck = await requireSuperAdmin(request);
  if (!authCheck.ok) return authCheck.response;

  try {
    const { searchParams } = new URL(request.url);

    const rawLimit = parseInt(searchParams.get('limit') || '100', 10);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 500) : 100;
    const format = searchParams.get('format');
    const isCsv = format === 'csv';

    const conditions: string[] = [];
    const params: any[] = [];
    const add = (sql: string, value: any) => {
      params.push(value);
      conditions.push(sql.replace('?', `$${params.length}`));
    };

    // Matches either the email or the display name against one bound value.
    const actor = searchParams.get('actor');
    if (actor) {
      params.push(`%${actor}%`);
      const n = params.length;
      conditions.push(`(a.actor_email ILIKE $${n} OR a.actor_name ILIKE $${n})`);
    }

    const action = searchParams.get('action');
    if (action) add('a.action ILIKE ?', `%${action}%`);

    const entityType = searchParams.get('entityType');
    if (entityType) add('a.entity_type = ?', entityType);

    const entityId = searchParams.get('entityId');
    if (entityId) add('a.entity_id = ?', entityId);

    const outcome = searchParams.get('outcome');
    if (outcome) add('a.outcome = ?', outcome);

    const from = searchParams.get('from');
    if (from) add('a.created_at >= ?::timestamptz', from);

    const to = searchParams.get('to');
    if (to) add('a.created_at <= ?::timestamptz', to);

    // Keyset pagination: rows are returned newest first, so "next page" means
    // everything below the last seq seen. Stable even as new rows arrive.
    const cursor = searchParams.get('cursor');
    if (cursor && /^\d+$/.test(cursor)) add('a.seq < ?::bigint', cursor);

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(isCsv ? 5000 : limit + 1); // +1 tells us whether more remain
    const limitParam = `$${params.length}`;

    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT a.seq, a.id, p.id as employee_id, a.actor_email, a.actor_name, a.actor_role, a.actor_dept,
              a.action, a.entity_type, a.entity_id, a.outcome,
              a."before", a."after", a.details,
              a.ip_address, a.user_agent, a.request_id, a.http_method, a.path,
              a.created_at
       FROM audit_logs a
       LEFT JOIN profiles p ON a.employee_id = p.id
       ${where}
       ORDER BY a.seq DESC
       LIMIT ${limitParam}`,
      ...params
    );

    const hasMore = !isCsv && rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const logs = page.map((r) => ({ ...r, seq: Number(r.seq) }));

    // Reading the trail is itself a sensitive access and belongs in the trail.
    await recordAudit({
      action: isCsv ? 'AUDIT_LOG_EXPORTED' : 'AUDIT_LOG_VIEWED',
      entityType: 'AuditLog',
      entityId: 'list',
      details: {
        returned: logs.length,
        filters: Object.fromEntries(searchParams.entries()),
      },
    });

    if (isCsv) {
      const columns = [
        'seq', 'created_at', 'actor_name', 'actor_email', 'actor_role',
        'action', 'outcome', 'entity_type', 'entity_id', 'ip_address', 'request_id',
      ];
      const escape = (v: any) => {
        if (v === null || v === undefined) return '';
        const s = String(v instanceof Date ? v.toISOString() : v);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      };
      const csv = [
        columns.join(','),
        ...logs.map((r) => columns.map((c) => escape((r as any)[c])).join(',')),
      ].join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="audit-log-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      logs,
      nextCursor: hasMore ? logs[logs.length - 1]?.seq ?? null : null,
    });
  } catch (error: any) {
    console.error('Audit Log GET Error:', error.message);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
