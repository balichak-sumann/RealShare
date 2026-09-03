import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/require-admin';

/**
 * GET /api/notifications/feed — returns notifications visible to the
 * authenticated user, filtered by their role (or 'all'). This is the
 * user-facing endpoint; the admin-only /api/notifications stays separate.
 */
export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    const role = auth.role ?? 'investor';

    // A notification is visible to a user if its audience is 'all' or matches
    // the user's role (mapped: investor→investors, agent→agents, builder→builders).
    const audienceMap: Record<string, string> = {
      investor: 'investors',
      agent: 'agents',
      builder: 'builders',
      admin: 'all', // admins see everything
      employee: 'all',
    };

    const targetAudience = audienceMap[role] ?? 'investors';
    const whereClause =
      role === 'admin' || role === 'employee'
        ? {} // admins/employees see all notifications
        : { audience: { in: ['all', targetAudience] } };

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
      take: 50,
    });

    return NextResponse.json(notifications);
  } catch (error: any) {
    console.error('Failed to fetch notification feed:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}
