import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/require-admin';

// PATCH: admin-only. Updates status and/or assignment (assigned_to = a
// profile id, or null/empty to unassign) on a service inquiry.
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;
    const { id } = await context.params;
    const body = await request.json();
    const { status, assigned_to } = body;

    const data: any = {};
    if (status !== undefined) {
      const validStatuses = ['New', 'In Review', 'Assigned', 'Completed', 'Cancelled'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      data.status = status;
    }
    if (assigned_to !== undefined) {
      data.assigned_to = assigned_to || null;
    }
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    const updated = await prisma.serviceInquiry.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Failed to update service inquiry:', error);
    return NextResponse.json({ error: error.message || 'Failed to update service inquiry' }, { status: 500 });
  }
}
