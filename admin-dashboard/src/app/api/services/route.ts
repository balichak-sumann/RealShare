import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/require-admin';

// GET: admin-only list of service inquiries.
// (There is currently no user-facing intake flow that creates these —
// this endpoint only lists/reads what exists; a mobile submission form is
// tracked separately as future work, same as the rest of the Home
// Services product surface.)
export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;
    const inquiries = await prisma.serviceInquiry.findMany({ orderBy: { created_at: 'desc' } });
    return NextResponse.json(inquiries);
  } catch (error: any) {
    console.error('Failed to fetch service inquiries:', error);
    return NextResponse.json({ error: 'Failed to fetch service inquiries' }, { status: 500 });
  }
}
