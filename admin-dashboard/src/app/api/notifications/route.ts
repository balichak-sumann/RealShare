import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/require-admin';

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const notifications = await prisma.notification.findMany({
      orderBy: { created_at: 'desc' },
      take: 100,
    });
    return NextResponse.json(notifications);
  } catch (error: any) {
    console.error('Failed to fetch notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const { title, message, audience } = body;
    if (!title || !message) {
      return NextResponse.json({ error: 'title and message are required' }, { status: 400 });
    }
    const validAudiences = ['all', 'investors', 'agents', 'builders'];
    const targetAudience = validAudiences.includes(audience) ? audience : 'all';

    // Recipient count reflects who this notification actually targets, based on
    // real profile rows — not a fabricated figure.
    const recipientsCount = targetAudience === 'all'
      ? await prisma.profile.count()
      : await prisma.profile.count({
          where: { role: targetAudience === 'investors' ? 'investor' : targetAudience === 'agents' ? 'agent' : 'builder' }
        });

    // Deliver to expo push tokens where we have them. Best-effort — a failed
    // push send doesn't fail the request, since the log record itself is the
    // source of truth for what was "sent".
    const recipients = await prisma.profile.findMany({
      where: {
        expo_push_token: { not: null },
        ...(targetAudience !== 'all'
          ? { role: targetAudience === 'investors' ? 'investor' : targetAudience === 'agents' ? 'agent' : 'builder' }
          : {}),
      },
      select: { expo_push_token: true },
    });

    if (recipients.length > 0) {
      try {
        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(
            recipients.map((r) => ({
              to: r.expo_push_token,
              title,
              body: message,
            }))
          ),
        });
      } catch (e) {
        console.error('Push delivery failed (notification still logged):', e);
      }
    }

    const notification = await prisma.notification.create({
      data: {
        title,
        body: message,
        audience: targetAudience,
        sent_by: auth.uid,
        recipients_count: recipientsCount,
      },
    });

    return NextResponse.json({ success: true, notification });
  } catch (error: any) {
    console.error('Failed to send notification:', error);
    return NextResponse.json({ error: error.message || 'Failed to send notification' }, { status: 500 });
  }
}
