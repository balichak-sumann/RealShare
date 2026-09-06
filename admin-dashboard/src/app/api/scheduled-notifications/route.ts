import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/require-admin';

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const scheduled = await prisma.scheduledNotification.findMany({
      orderBy: { created_at: 'desc' },
    });
    return NextResponse.json(scheduled);
  } catch (error: any) {
    console.error('Failed to fetch scheduled notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch scheduled notifications' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const { title, message, audience, repeat_type, repeat_time, repeat_day, start_date } = body;

    if (!title || !message) {
      return NextResponse.json({ error: 'title and message are required' }, { status: 400 });
    }

    const validAudiences = ['all', 'investors', 'agents', 'builders'];
    const targetAudience = validAudiences.includes(audience) ? audience : 'all';
    const validRepeats = ['once', 'daily', 'weekly', 'monthly'];
    const repeatType = validRepeats.includes(repeat_type) ? repeat_type : 'once';

    // Calculate next_send_at
    let nextSendAt: Date;
    const now = new Date();

    if (start_date) {
      nextSendAt = new Date(start_date);
    } else {
      nextSendAt = new Date();
      if (repeat_time) {
        const [hours, minutes] = repeat_time.split(':').map(Number);
        nextSendAt.setHours(hours || 0, minutes || 0, 0, 0);
        // If the calculated time for today is already in the past, move to tomorrow
        if (nextSendAt.getTime() <= now.getTime()) {
          nextSendAt.setDate(nextSendAt.getDate() + 1);
        }
      } else {
        nextSendAt.setMinutes(nextSendAt.getMinutes() + 1); // 1 minute from now
      }
    }

    const scheduled = await prisma.scheduledNotification.create({
      data: {
        title,
        body: message,
        audience: targetAudience,
        repeat_type: repeatType,
        repeat_time: repeat_time || null,
        repeat_day: repeat_day !== undefined ? Number(repeat_day) : null,
        next_send_at: nextSendAt,
        is_active: true,
        created_by: auth.uid,
      },
    });

    return NextResponse.json({ success: true, scheduledNotification: scheduled });
  } catch (error: any) {
    console.error('Failed to create scheduled notification:', error);
    return NextResponse.json({ error: error.message || 'Failed to create scheduled notification' }, { status: 500 });
  }
}
