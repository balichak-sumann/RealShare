import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/require-admin';

// PATCH: staff-only status/assignment updates.
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;
    if (auth.role !== 'admin' && auth.role !== 'employee') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { status, assigned_to } = body;
    const data: any = {};
    if (status) data.status = status;
    if (assigned_to !== undefined) data.assigned_to = assigned_to;
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    const updated = await prisma.supportTicket.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Failed to update ticket:', error);
    return NextResponse.json({ error: error.message || 'Failed to update ticket' }, { status: 500 });
  }
}
