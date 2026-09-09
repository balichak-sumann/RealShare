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
    if (body.notes !== undefined) {
      data.notes = body.notes;
    }
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    let updated: any;
    if ((prisma as any).serviceInquiry) {
      updated = await (prisma as any).serviceInquiry.update({ where: { id }, data });
    } else {
      const setClauses: string[] = [];
      const values: any[] = [];
      let idx = 1;
      for (const [key, val] of Object.entries(data)) {
        setClauses.push(`${key} = $${idx++}`);
        values.push(val);
      }
      values.push(id);
      const query = `UPDATE service_inquiries SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`;
      const rows = await prisma.$queryRawUnsafe<any[]>(query, ...values);
      updated = rows[0];
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Failed to update service inquiry:', error);
    return NextResponse.json({ error: error.message || 'Failed to update service inquiry' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;
    const { id } = await context.params;

    if ((prisma as any).serviceInquiry) {
      await (prisma as any).serviceInquiry.delete({ where: { id } });
    } else {
      await prisma.$executeRaw`DELETE FROM service_inquiries WHERE id = ${id}`;
    }
    return NextResponse.json({ success: true, message: 'Inquiry deleted successfully' });
  } catch (error: any) {
    console.error('Failed to delete service inquiry:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete service inquiry' }, { status: 500 });
  }
}
