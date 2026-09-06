import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/require-admin';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const { id } = await context.params;
    const body = await request.json();

    const dataToUpdate: any = {};
    if (body.is_active !== undefined) dataToUpdate.is_active = Boolean(body.is_active);
    if (body.title !== undefined) dataToUpdate.title = body.title;
    if (body.body !== undefined) dataToUpdate.body = body.body;
    if (body.audience !== undefined) dataToUpdate.audience = body.audience;
    if (body.repeat_type !== undefined) dataToUpdate.repeat_type = body.repeat_type;
    if (body.repeat_time !== undefined) dataToUpdate.repeat_time = body.repeat_time;
    if (body.next_send_at !== undefined) dataToUpdate.next_send_at = new Date(body.next_send_at);

    const updated = await prisma.scheduledNotification.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, scheduledNotification: updated });
  } catch (error: any) {
    console.error('Failed to update scheduled notification:', error);
    return NextResponse.json({ error: error.message || 'Failed to update scheduled notification' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const { id } = await context.params;

    await prisma.scheduledNotification.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Scheduled notification deleted' });
  } catch (error: any) {
    console.error('Failed to delete scheduled notification:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete scheduled notification' }, { status: 500 });
  }
}
