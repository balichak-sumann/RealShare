import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/require-admin';
import { sendExpoPushTickets } from '@/lib/push';

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

    // Deliver to expo push tokens where we have them. A failed push send
    // still doesn't fail the whole request (the log record is created either
    // way), but we now track the real per-token outcome instead of just
    // assuming every send succeeded.
    const recipients = await prisma.profile.findMany({
      where: {
        expo_push_token: { not: null },
        ...(targetAudience !== 'all'
          ? { role: targetAudience === 'investors' ? 'investor' : targetAudience === 'agents' ? 'agent' : 'builder' }
          : {}),
      },
      select: { expo_push_token: true },
    });

    let pushSent = 0;
    let pushFailed = 0;
    if (recipients.length > 0) {
      // Expo's push API returns { data: [{ status: 'ok' | 'error', ... }, ...] }
      // with one ticket per submitted token, in order -- that's the real
      // per-recipient success/failure signal, not just the HTTP status.
      const tickets = await sendExpoPushTickets(
        recipients.map((r) => ({
          to: r.expo_push_token as string,
          title,
          body: message,
        }))
      );
      for (const ticket of tickets) {
        if (ticket?.status === 'ok') pushSent++;
        else pushFailed++;
      }
      // Any recipient that didn't get a ticket back at all (malformed
      // response, or the whole call failed) counts as failed too.
      const unaccounted = recipients.length - tickets.length;
      if (unaccounted > 0) pushFailed += unaccounted;
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

    return NextResponse.json({
      success: true,
      notification,
      // Real delivery outcome for this send -- not persisted (the schema has
      // no column for it), so it's only available for the send that just
      // happened, not for notifications re-fetched later via GET.
      push: { sent: pushSent, failed: pushFailed, eligible: recipients.length, targeted: recipientsCount },
    });
  } catch (error: any) {
    console.error('Failed to send notification:', error);
    return NextResponse.json({ error: error.message || 'Failed to send notification' }, { status: 500 });
  }
}
