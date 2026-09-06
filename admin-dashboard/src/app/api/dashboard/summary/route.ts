import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/require-admin';

const TRANSACTION_TYPE_ACTION_LABELS: Record<string, string> = {
  property_booking: 'booked a share in',
  fraction_purchase: 'purchased shares in',
  wallet_deposit: 'deposited funds to wallet',
  wallet_topup: 'deposited funds to wallet',
  rental_yield: 'received dividend payout from',
  payout: 'received dividend payout from',
  commission_payout: 'received commission from',
  token_refund: 'refunded shares in',
};

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const [
      propertyCount,
      activePropertiesCount,
      pendingPropertiesCount,
      investorCount,
      verifiedInvestorCount,
      pendingKycCount,
      activeAgentsCount,
      openTicketsCount,
      totalInquiriesCount,
      investments,
      mostViewedProperties,
      yieldProperties,
      recentTransactions,
      recentKycDocs,
      recentInvestors,
      recentProps,
    ] = await Promise.all([
      prisma.property.count().catch(() => 0),
      prisma.property.count({ where: { approval_status: 'approved' } }).catch(() => 0),
      prisma.property.count({ where: { approval_status: 'pending_approval' } }).catch(() => 0),
      prisma.profile.count({ where: { role: 'investor' } }).catch(() => 0),
      prisma.profile.count({ where: { role: 'investor', kyc_status: 'verified' } }).catch(() => 0),
      prisma.profile.count({ where: { role: 'investor', kyc_status: 'pending' } }).catch(() => 0),
      prisma.profile.count({ where: { role: 'agent', is_active: true } }).catch(() => 0),
      prisma.supportTicket.count({ where: { status: 'open' } }).catch(() => 0),
      prisma.serviceInquiry.count().catch(() => 0),
      prisma.investment.findMany({ select: { total_amount: true, property_id: true } }).catch(() => []),
      // Top performing properties sorted primarily by most views
      prisma.property.findMany({
        include: {
          _count: { select: { investments: true } },
          images: true,
          developer: { select: { name: true } },
        },
        orderBy: [
          { views_count: 'desc' },
          { sold_fractions: 'desc' },
          { created_at: 'desc' },
        ],
        take: 6,
      }).catch(() => []),
      prisma.property.findMany({
        select: { assured_yield: true, target_irr: true },
        where: { approval_status: 'approved' },
      }).catch(() => []),
      prisma.transaction.findMany({
        orderBy: { created_at: 'desc' },
        take: 6,
        include: {
          profile: { select: { full_name: true, email: true } },
          property: { select: { title: true } },
        },
      }).catch(() => []),
      prisma.kycDocument.findMany({
        orderBy: { created_at: 'desc' },
        take: 4,
        include: {
          profile: { select: { full_name: true, email: true } },
        },
      }).catch(() => []),
      prisma.profile.findMany({
        where: { role: 'investor' },
        orderBy: { created_at: 'desc' },
        take: 4,
        select: { id: true, full_name: true, email: true, created_at: true, kyc_status: true },
      }).catch(() => []),
      prisma.property.findMany({
        orderBy: { created_at: 'desc' },
        take: 4,
        select: { id: true, title: true, property_type: true, created_at: true, approval_status: true },
      }).catch(() => []),
    ]);

    // Financial KPIs
    const totalInvested = Array.isArray(investments)
      ? investments.reduce((sum, i) => sum + Number(i.total_amount || 0), 0)
      : 0;
    
    const yields = Array.isArray(yieldProperties)
      ? yieldProperties.map((p) => Number(p.assured_yield || 0)).filter((y) => y > 0)
      : [];
    const avgYield = yields.length > 0 ? yields.reduce((a, b) => a + b, 0) / yields.length : 0;

    const irrs = Array.isArray(yieldProperties)
      ? yieldProperties.map((p) => Number(p.target_irr || 0)).filter((i) => i > 0)
      : [];
    const avgIrr = irrs.length > 0 ? irrs.reduce((a, b) => a + b, 0) / irrs.length : 0;

    // Shape Top Most Viewed Properties
    const topProperties = Array.isArray(mostViewedProperties)
      ? mostViewedProperties.map((p) => {
          const pricePerFraction = Number(p.price_per_fraction || 0);
          const soldFractions = Number(p.sold_fractions || 0);
          const totalFractions = Number(p.total_fractions || 0);
          const raised = pricePerFraction * soldFractions;
          const progress = totalFractions > 0 ? Math.round((soldFractions / totalFractions) * 100) : 0;
          const primaryImg = p.images?.find((img) => img.is_primary)?.image_url || p.images?.[0]?.image_url || null;

          return {
            id: p.id,
            name: p.title || 'Untitled Property',
            locality: p.locality || '',
            district: p.district || '',
            state: p.state || '',
            property_type: p.property_type || 'Commercial',
            listing_type: p.listing_type || 'fractional',
            views: p.views_count || 0,
            investors: p._count?.investments ?? 0,
            raised,
            total_fractions: totalFractions,
            sold_fractions: soldFractions,
            available_fractions: Number(p.available_fractions || 0),
            price_per_fraction: pricePerFraction,
            assured_yield: Number(p.assured_yield || 0),
            target_irr: Number(p.target_irr || 0),
            progress,
            image: primaryImg,
            developerName: p.developer?.name || null,
            approval_status: p.approval_status || 'approved',
          };
        })
      : [];

    // Unified Live Recent Activity Feed
    const activityItems: Array<{
      id: string;
      type: 'transaction' | 'kyc' | 'signup' | 'property';
      user: string;
      action: string;
      target: string;
      amount: number | null;
      status: string;
      time: Date | string;
    }> = [];

    // Add Transactions
    if (Array.isArray(recentTransactions)) {
      for (const t of recentTransactions) {
        activityItems.push({
          id: `txn-${t.id}`,
          type: 'transaction',
          user: t.profile?.full_name || t.profile?.email?.split('@')[0] || 'Investor',
          action: TRANSACTION_TYPE_ACTION_LABELS[t.transaction_type] || t.transaction_type || 'transacted on',
          target: t.property?.title || 'RealShare Platform',
          amount: Number(t.amount || 0),
          status: t.payment_status || 'completed',
          time: t.created_at || new Date().toISOString(),
        });
      }
    }

    // Add KYC Submissions
    if (Array.isArray(recentKycDocs)) {
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
    }

    // Add Investor Registrations
    if (Array.isArray(recentInvestors)) {
      for (const inv of recentInvestors) {
        activityItems.push({
          id: `inv-${inv.id}`,
          type: 'signup',
          user: inv.full_name || inv.email?.split('@')[0] || 'New Investor',
          action: 'registered as a new investor',
          target: 'RealShare Platform',
          amount: null,
          status: inv.kyc_status === 'verified' ? 'verified' : 'registered',
          time: inv.created_at || new Date().toISOString(),
        });
      }
    }

    // Add Property Additions
    if (Array.isArray(recentProps)) {
      for (const prop of recentProps) {
        activityItems.push({
          id: `prop-${prop.id}`,
          type: 'property',
          user: 'Platform Listing',
          action: 'added new property',
          target: prop.title || 'Untitled Property',
          amount: null,
          status: prop.approval_status || 'approved',
          time: prop.created_at || new Date().toISOString(),
        });
      }
    }

    // Sort unified activities chronologically and take latest 8
    activityItems.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    const recentActivity = activityItems.slice(0, 8);

    return NextResponse.json({
      kpis: {
        totalProperties: propertyCount,
        activeProperties: activePropertiesCount,
        pendingProperties: pendingPropertiesCount,
        activeInvestors: investorCount,
        verifiedInvestors: verifiedInvestorCount,
        pendingKyc: pendingKycCount,
        totalInvestments: totalInvested,
        avgYield: Math.round(avgYield * 10) / 10,
        avgIrr: Math.round(avgIrr * 10) / 10,
        activeAgents: activeAgentsCount,
        openTickets: openTicketsCount,
        totalInquiries: totalInquiriesCount,
      },
      topProperties,
      recentActivity,
    });
  } catch (error: any) {
    console.error('Failed to fetch dashboard summary:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch dashboard summary' }, { status: 500 });
  }
}
