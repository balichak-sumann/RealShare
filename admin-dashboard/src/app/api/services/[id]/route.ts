import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/require-admin';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;
    const { id } = await context.params;
    const body = await request.json();
    const { status } = body;
    const validStatuses = ['New', 'In Review', 'Assigned', 'Completed', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    const updated = await prisma.serviceInquiry.update({ where: { id }, data: { status } });
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Failed to update service inquiry:', error);
    return NextResponse.json({ error: error.message || 'Failed to update service inquiry' }, { status: 500 });
  }
}
