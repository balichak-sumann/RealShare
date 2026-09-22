import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const TRANSACTION_TYPE_ACTION_LABELS: Record<string, string> = {
  wallet_topup: 'topped up wallet',
  property_booking: 'booked fractions in',
  subscription_purchase: 'purchased subscription',
  commission_payout: 'received commission payout',
  withdrawal: 'withdrew funds',
};

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    await auth.verifyIdToken(token);

    // Fetch up to 50 of each activity type
    const [
      recentTransactions,
      recentKycDocs,
      recentBuyers,
      recentAgents,
      recentBuilders,
      recentTickets,
      recentServiceInquiries,
      recentProperties
    ] = await Promise.all([
      prisma.transaction.findMany({
        take: 50,
        orderBy: { created_at: 'desc' },
        include: { profile: true, property: true }
      }),
      prisma.kycDocument.findMany({
        take: 50,
        orderBy: { created_at: 'desc' },
        include: { profile: true }
      }),
      prisma.profile.findMany({
        where: { role: 'buyer' },
        take: 50,
        orderBy: { created_at: 'desc' }
      }),
      prisma.profile.findMany({
        where: { role: 'agent' },
        take: 50,
        orderBy: { created_at: 'desc' }
      }),
      prisma.profile.findMany({
        where: { role: 'builder' },
        take: 50,
        orderBy: { created_at: 'desc' }
      }),
      prisma.supportTicket.findMany({
        take: 50,
        orderBy: { created_at: 'desc' },
        include: { profile: true }
      }),
      prisma.serviceInquiry.findMany({
        take: 50,
        orderBy: { created_at: 'desc' },
        include: { profile: true }
      }),
      prisma.property.findMany({
        take: 50,
        orderBy: { created_at: 'desc' },
        include: { builder_profile: true, agent_profile: true }
      })
    ]);

    const activityItems: Array<{
      id: string;
      type: 'transaction' | 'kyc' | 'signup' | 'property' | 'support' | 'inquiry';
      user: string;
      action: string;
      target: string;
      amount: number | null;
      status: string;
      time: Date | string;
    }> = [];

    // Add Transactions
    for (const t of recentTransactions) {
      activityItems.push({
        id: `txn-${t.id}`,
        type: 'transaction',
        user: t.profile?.full_name || t.profile?.email?.split('@')[0] || 'Buyer',
        action: TRANSACTION_TYPE_ACTION_LABELS[t.transaction_type] || t.transaction_type || 'transacted on',
        target: t.property?.title || 'Realshare Platform',
        amount: Number(t.amount || 0),
        status: t.payment_status || 'completed',
        time: t.created_at || new Date().toISOString(),
      });
    }

    // Add KYC Submissions
    for (const kyc of recentKycDocs) {
      activityItems.push({
        id: `kyc-${kyc.id}`,
        type: 'kyc',
        user: kyc.profile?.full_name || kyc.profile?.email?.split('@')[0] || 'User',
        action: 'submitted verification document',
        target: (kyc.document_type || 'document').toUpperCase().replace('_', ' '),
        amount: null,
        status: kyc.verification_status || 'pending',
        time: kyc.created_at || new Date().toISOString(),
      });
    }

    // Add Signups
    for (const inv of recentBuyers) {
      activityItems.push({
        id: `inv-${inv.id}`,
        type: 'signup',
        user: inv.full_name || inv.email?.split('@')[0] || 'New Buyer',
        action: 'registered as a new buyer',
        target: 'Realshare Platform',
        amount: null,
        status: inv.kyc_status === 'verified' ? 'verified' : 'registered',
        time: inv.created_at || new Date().toISOString(),
      });
    }

    for (const agent of recentAgents) {
      activityItems.push({
        id: `agent-${agent.id}`,
        type: 'signup',
        user: agent.full_name || agent.email?.split('@')[0] || 'New Agent',
        action: 'registered as a partner agent',
        target: 'Realshare Platform',
        amount: null,
        status: agent.is_approved ? 'approved' : 'pending',
        time: agent.created_at || new Date().toISOString(),
      });
    }

    for (const builder of recentBuilders) {
      activityItems.push({
        id: `bld-${builder.id}`,
        type: 'signup',
        user: builder.full_name || builder.email?.split('@')[0] || 'New Builder',
        action: 'registered as a builder',
        target: 'Realshare Platform',
        amount: null,
        status: builder.is_approved ? 'approved' : 'pending',
        time: builder.created_at || new Date().toISOString(),
      });
    }

    // Add Support Tickets
    for (const ticket of recentTickets) {
      activityItems.push({
        id: `tkt-${ticket.id}`,
        type: 'support',
        user: ticket.profile?.full_name || ticket.profile?.email?.split('@')[0] || 'User',
        action: 'opened support ticket',
        target: ticket.subject || 'Help Request',
        amount: null,
        status: ticket.status || 'open',
        time: ticket.created_at || new Date().toISOString(),
      });
    }

    // Add Service Inquiries
    for (const inq of recentServiceInquiries) {
      activityItems.push({
        id: `inq-${inq.id}`,
        type: 'inquiry',
        user: inq.customer_name || inq.profile?.full_name || 'Customer',
        action: 'inquired about service',
        target: inq.service_type || 'Platform Service',
        amount: null,
        status: inq.status || 'pending',
        time: inq.created_at || new Date().toISOString(),
      });
    }

    // Add Property Listings
    for (const prop of recentProperties) {
      const user = prop.builder_profile?.full_name || prop.agent_profile?.full_name || 'Admin';
      activityItems.push({
        id: `prop-${prop.id}`,
        type: 'property',
        user: user,
        action: 'listed property',
        target: prop.title || 'Untitled Property',
        amount: null,
        status: prop.approval_status || 'pending',
        time: prop.created_at || new Date().toISOString(),
      });
    }

    // Sort all activities by time descending
    activityItems.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    return NextResponse.json({ success: true, activities: activityItems });

  } catch (error: any) {
    console.error('Error fetching activities:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
