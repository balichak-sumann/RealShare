import type { PrismaClient } from '@prisma/client';
import { getAuditContext } from './audit-context';

/**
 * Automatic audit capture for every data mutation.
 *
 * Adding a logging call to each route was never going to hold: there are 74
 * write endpoints, only a handful were covered, and any route added later would
 * silently escape the trail. This intercepts writes at the Prisma layer instead,
 * so coverage is a property of the data access path rather than of whether
 * someone remembered.
 *
 * What it records: the model, the operation, the affected id(s), the row's
 * state BEFORE the change (read back before the write) and AFTER it.
 *
 * Deliberate limits, so the guarantees are not overstated:
 *  - AuditLog itself is never intercepted, or writing an entry would trigger
 *    another entry forever.
 *  - Raw queries ($queryRaw/$executeRaw) are not model operations and are not
 *    seen here. The audit writer itself uses raw SQL, which is also why it
 *    cannot recurse.
 *  - The entry is written outside the caller's transaction. If a surrounding
 *    transaction rolls back after the write, the entry remains — an over-record
 *    rather than a gap, which is the safer direction for an audit trail.
 *  - A failure to record here is logged loudly but does NOT throw: the data
 *    change has already been committed by that point, so throwing would report
 *    a failure that did not happen without being able to undo anything.
 *    Explicit recordAudit() calls still fail closed.
 */

const WRITE_OPERATIONS = new Set([
  'create',
  'createMany',
  'update',
  'updateMany',
  'upsert',
  'delete',
  'deleteMany',
]);

/** Reading more than this before a bulk write costs more than it tells us. */
const MAX_BEFORE_ROWS = 25;

function delegateName(model: string): string {
  return model.charAt(0).toLowerCase() + model.slice(1);
}

function idsOf(rows: any): string[] {
  if (!rows) return [];
  const list = Array.isArray(rows) ? rows : [rows];
  return list
    .map((r) => (r && typeof r === 'object' && 'id' in r ? String(r.id) : null))
    .filter((v): v is string => !!v);
}

/** Signature of the audit writer, injected so the extension can be tested
 *  without a database and without importing the writer at module load (which
 *  would create a cycle: prisma -> extension -> audit -> prisma). */
export type AuditRecorder = (entry: {
  action: string;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  details?: Record<string, any>;
}) => Promise<void>;

export function createAuditExtension(base: PrismaClient, recorder?: AuditRecorder) {
  return {
    name: 'forensic-audit',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }: any) {
          if (!model || model === 'AuditLog' || !WRITE_OPERATIONS.has(operation)) {
            return query(args);
          }

          const ctx = getAuditContext();
          if (ctx?.suppressAudit) return query(args);

          const delegate = (base as any)[delegateName(model)];

          // Capture prior state while it still exists. Uses the unextended
          // client so this read is not itself intercepted.
          let before: any = undefined;
          if (delegate?.findMany && args?.where && operation !== 'create' && operation !== 'createMany') {
            try {
              const rows = await delegate.findMany({ where: args.where, take: MAX_BEFORE_ROWS });
              before = Array.isArray(rows) && rows.length === 1 ? rows[0] : rows;
            } catch {
              // A where clause the delegate cannot replay (nested relation
              // filters) should never block the actual operation.
              before = undefined;
            }
          }

          const result = await query(args);

          try {
            const record: AuditRecorder =
              recorder ?? ((entry) => import('./audit').then((m) => m.recordAudit(entry as any)));

            const affected = idsOf(result).length ? idsOf(result) : idsOf(before);
            const entityId =
              affected.length === 1
                ? affected[0]
                : affected.length > 1
                  ? `${affected.length} records`
                  : String(args?.where?.id ?? 'unknown');

            const isBulk = operation === 'createMany' || operation === 'updateMany' || operation === 'deleteMany';

            await record({
              action: `${operation.toUpperCase()}_${model.toUpperCase()}`,
              entityType: model,
              entityId,
              before,
              after: operation === 'delete' || operation === 'deleteMany' ? null : result,
              details: {
                operation,
                model,
                ...(isBulk ? { affectedIds: affected, count: (result as any)?.count } : {}),
                ...(affected.length > 1 && !isBulk ? { affectedIds: affected } : {}),
              },
            });
          } catch (err) {
            // The write already happened; surface it loudly rather than
            // pretending the operation failed.
            console.error('[Audit] automatic capture FAILED — data changed but was not recorded', {
              model,
              operation,
              error: err instanceof Error ? err.message : String(err),
            });
          }

          return result;
        },
      },
    },
  };
}
