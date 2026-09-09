import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendExpoPushTickets } from '@/lib/push';

export async function GET(request: Request) {
  return handleCron(request);
}

export async function POST(request: Request) {
  return handleCron(request);
}

async function handleCron(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret') || request.headers.get('x-cron-secret');
    const expectedSecret = process.env.CRON_SECRET || 'realshare_cron_secret';

    if (secret && secret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized cron trigger' }, { status: 401 });
    }

    const now = new Date();

    // Fetch all active due scheduled notifications
    const dueNotifications = await prisma.scheduledNotification.findMany({
      where: {
        is_active: true,
        next_send_at: {
          lte: now,
        },
      },
    });

    const results = [];

    for (const scheduled of dueNotifications) {
      const targetAudience = scheduled.audience || 'all';

      // 1. Calculate recipients count
      const recipientsCount = targetAudience === 'all'
        ? await prisma.profile.count()
        : await prisma.profile.count({
            where: { role: targetAudience === 'investors' ? 'investor' : targetAudience === 'agents' ? 'agent' : 'builder' }
          });

      // 2. Find expo tokens for delivery
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
        const tickets = await sendExpoPushTickets(
          recipients.map((r) => ({
            to: r.expo_push_token as string,
            title: scheduled.title,
            body: scheduled.body,
          }))
        );
        for (const ticket of tickets) {
          if (ticket?.status === 'ok') pushSent++;
          else pushFailed++;
        }
        const unaccounted = recipients.length - tickets.length;
        if (unaccounted > 0) pushFailed += unaccounted;
      }

      // 3. Log to notifications table
      const createdLog = await prisma.notification.create({
        data: {
          title: scheduled.title,
          body: scheduled.body,
          audience: targetAudience,
          sent_by: scheduled.created_by,
          recipients_count: recipientsCount,
        },
      });

      // 4. Advance next_send_at or deactivate if 'once'
      let nextSendAt = new Date(scheduled.next_send_at);
      let isActive = true;

      if (scheduled.repeat_type === 'once') {
        isActive = false;
      } else if (scheduled.repeat_type === 'daily') {
        nextSendAt.setDate(nextSendAt.getDate() + 1);
        // Ensure next_send_at is in the future
        while (nextSendAt.getTime() <= now.getTime()) {
          nextSendAt.setDate(nextSendAt.getDate() + 1);
        }
      } else if (scheduled.repeat_type === 'weekly') {
        nextSendAt.setDate(nextSendAt.getDate() + 7);
        while (nextSendAt.getTime() <= now.getTime()) {
          nextSendAt.setDate(nextSendAt.getDate() + 7);
        }
      } else if (scheduled.repeat_type === 'monthly') {
        nextSendAt.setMonth(nextSendAt.getMonth() + 1);
        while (nextSendAt.getTime() <= now.getTime()) {
          nextSendAt.setMonth(nextSendAt.getMonth() + 1);
        }
      }

      await prisma.scheduledNotification.update({
        where: { id: scheduled.id },
        data: {
          last_sent_at: now,
          send_count: { increment: 1 },
          next_send_at: nextSendAt,
          is_active: isActive,
        },
      });

      results.push({
        id: scheduled.id,
        title: scheduled.title,
        recipientsCount,
        pushSent,
        pushFailed,
        isActive,
        nextSendAt,
      });
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error: any) {
    console.error('Error executing notifications cron:', error);
    return NextResponse.json({ error: error.message || 'Cron execution failed' }, { status: 500 });
  }
}
