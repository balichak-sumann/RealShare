import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import prisma from '@/lib/prisma';
import { captureRequestContext } from '@/lib/audit-context';
import { recordAudit } from '@/lib/audit';

type AuthResult =
  | { ok: true; uid: string; role: string | null }
  | { ok: false; response: NextResponse };

/** Verifies the request's Bearer token. Does not require any particular role. */
export async function requireAuth(request: Request): Promise<AuthResult> {
  // Establish the audit context for this request before anything else, so even
  // a rejected request is attributable to an IP and user agent.
  captureRequestContext(request);

  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  const token = authHeader.split('Bearer ')[1];
  try {
    const decoded = await auth.verifyIdToken(token);
    const profile = await prisma.profile.findUnique({
      where: { id: decoded.uid },
      select: { role: true, email: true, full_name: true, employee_department: true },
    });
    // Attach the actor so every audit entry written later in this request —
    // including ones raised deep inside the Prisma layer — is attributable
    // without any route having to pass it along.
    captureRequestContext(request, {
      uid: decoded.uid,
      email: profile?.email ?? decoded.email ?? null,
      name: profile?.full_name ?? null,
      role: profile?.role ?? null,
      department: profile?.employee_department ?? null,
    });
    return { ok: true, uid: decoded.uid, role: profile?.role ?? null };
  } catch (e) {
    // A rejected token is itself forensically interesting: repeated failures
    // from one IP are how credential-stuffing shows up.
    await recordAudit({
      action: 'AUTH_TOKEN_REJECTED',
      entityType: 'Auth',
      entityId: 'unknown',
      outcome: 'failure',
      details: { reason: e instanceof Error ? e.message : 'invalid token' },
    }).catch(() => {});
    return { ok: false, response: NextResponse.json({ error: 'Invalid token' }, { status: 401 }) };
  }
}

/** Verifies the request's Bearer token AND that the caller's profile role is 'admin', 'employee', or 'superadmin'. */
export async function requireAdmin(request: Request): Promise<AuthResult> {
  const result = await requireAuth(request);
  if (!result.ok) return result;
  if (result.role !== 'admin' && result.role !== 'employee' && result.role !== 'superadmin') {
    await recordAudit({
      action: 'ACCESS_DENIED',
      entityType: 'Auth',
      entityId: result.uid,
      outcome: 'denied',
      details: { required: 'admin|employee|superadmin', actual: result.role },
    }).catch(() => {});
    return { ok: false, response: NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 }) };
  }
  return result;
}

/** Verifies the request's Bearer token AND that the caller's profile role is strictly 'superadmin'. */
export async function requireSuperAdmin(request: Request): Promise<AuthResult> {
  const result = await requireAuth(request);
  if (!result.ok) return result;
  if (result.role !== 'superadmin') {
    await recordAudit({
      action: 'ACCESS_DENIED',
      entityType: 'Auth',
      entityId: result.uid,
      outcome: 'denied',
      details: { required: 'superadmin', actual: result.role },
    }).catch(() => {});
    return { ok: false, response: NextResponse.json({ error: 'Forbidden: Superadmin access required' }, { status: 403 }) };
  }
  return result;
}
