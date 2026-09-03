import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import prisma from '@/lib/prisma';

type AuthResult =
  | { ok: true; uid: string; role: string | null }
  | { ok: false; response: NextResponse };

/** Verifies the request's Bearer token. Does not require any particular role. */
export async function requireAuth(request: Request): Promise<AuthResult> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  const token = authHeader.split('Bearer ')[1];
  try {
    const decoded = await auth.verifyIdToken(token);
    const profile = await prisma.profile.findUnique({ where: { id: decoded.uid }, select: { role: true } });
    return { ok: true, uid: decoded.uid, role: profile?.role ?? null };
  } catch (e) {
    return { ok: false, response: NextResponse.json({ error: 'Invalid token' }, { status: 401 }) };
  }
}

/** Verifies the request's Bearer token AND that the caller's profile role is 'admin'. */
export async function requireAdmin(request: Request): Promise<AuthResult> {
  const result = await requireAuth(request);
  if (!result.ok) return result;
  if (result.role !== 'admin') {
    return { ok: false, response: NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 }) };
  }
  return result;
}
