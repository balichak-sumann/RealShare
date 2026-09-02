import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/firebase-admin';

// GET /api/agents/notifications — Fetch real notifications for the agent
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const agentId = decodedToken.uid;

    const notifications: any[] = [];

    // 1. Recently approved/rejected listings
    const recentListings = await prisma.property.findMany({
      where: {
        posted_by: agentId,
        approval_status: { in: ['approved', 'rejected'] },
      },
      orderBy: { updated_at: 'desc' },
      take: 10,
    });

    recentListings.forEach(listing => {
      if (listing.approval_status === 'approved') {
        notifications.push({
          id: `listing-approved-${listing.id}`,
          type: 'listing_approved',
          icon: '✅',
          iconBg: 'rgba(16, 185, 129, 0.1)',
          title: 'Listing Approved!',
          message: `Your listing "${listing.title}" has been approved and is now live on the platform.`,
          time: listing.updated_at,
        });
      } else if (listing.approval_status === 'rejected') {
        notifications.push({
          id: `listing-rejected-${listing.id}`,
          type: 'listing_rejected',
          icon: '❌',
          iconBg: 'rgba(239, 68, 68, 0.1)',
          title: 'Listing Rejected',
          message: `Your listing "${listing.title}" was not approved.${listing.rejection_notes ? ` Reason: ${listing.rejection_notes}` : ''}`,
          time: listing.updated_at,
        });
      }
    });

    // 2. Recent commissions
    const recentCommissions = await prisma.agentCommission.findMany({
      where: { agent_id: agentId },
      include: { property: true },
      orderBy: { created_at: 'desc' },
      take: 5,
    });

    recentCommissions.forEach(comm => {
      if (comm.status === 'paid') {
        notifications.push({
          id: `comm-paid-${comm.id}`,
          type: 'commission_paid',
          icon: '🎉',
          iconBg: 'rgba(16, 185, 129, 0.1)',
          title: 'Commission Earned!',
          message: `You earned ₹${Number(comm.commission_amount).toLocaleString('en-IN')} from ${comm.property?.title || 'a property'}.`,
          time: comm.paid_at || comm.created_at,
        });
      } else {
        notifications.push({
          id: `comm-pending-${comm.id}`,
          type: 'commission_pending',
          icon: '💰',
          iconBg: 'rgba(212, 175, 55, 0.1)',
          title: 'Commission Pending',
          message: `₹${Number(comm.commission_amount).toLocaleString('en-IN')} commission pending for ${comm.property?.title || 'a property'}.`,
          time: comm.created_at,
        });
      }
    });

    // 3. New clients added
    const recentClients = await prisma.agentClient.findMany({
      where: { agent_id: agentId },
      orderBy: { created_at: 'desc' },
      take: 5,
    });

    recentClients.forEach(client => {
      notifications.push({
        id: `client-${client.id}`,
        type: 'new_client',
        icon: '👥',
        iconBg: 'rgba(59, 130, 246, 0.1)',
        title: 'New Client Added',
        message: `${client.client_name} was added to your client pipeline.`,
        time: client.created_at,
      });
    });

    // Sort all notifications by time (newest first)
    notifications.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    return NextResponse.json(notifications.slice(0, 20));
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
