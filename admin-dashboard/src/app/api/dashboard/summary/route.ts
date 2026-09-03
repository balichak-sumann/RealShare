import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/require-admin';

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const [propertyCount, investorCount, investments, properties, recentTransactions] = await Promise.all([
      prisma.property.count(),
      prisma.profile.count({ where: { role: 'investor' } }),
      prisma.investment.findMany({ select: { total_amount: true, property_id: true } }),
      prisma.property.findMany({
        include: { _count: { select: { investments: true } } },
        orderBy: { sold_fractions: 'desc' },
        take: 4,
      }),
      prisma.transaction.findMany({
        orderBy: { created_at: 'desc' },
        take: 6,
        include: { profile: { select: { full_name: true } }, property: { select: { title: true } } },
      }),
    ]);

    const totalInvested = investments.reduce((sum, i) => sum + Number(i.total_amount), 0);
    const properties_ = await prisma.property.findMany({ select: { assured_yield: true } });
    const yields = properties_.map((p) => Number(p.assured_yield || 0)).filter((y) => y > 0);
    const avgYield = yields.length > 0 ? yields.reduce((a, b) => a + b, 0) / yields.length : 0;

    const topProperties = properties.map((p) => {
      const raised = Number(p.price_per_fraction) * p.sold_fractions;
      const progress = p.total_fractions > 0 ? Math.round((p.sold_fractions / p.total_fractions) * 100) : 0;
      return {
        id: p.id,
        name: p.title,
        investors: p._count.investments,
        raised,
        progress,
        image: null,
      };
    });

    const recentActivity = recentTransactions.map((t) => ({
      id: t.id,
      user: t.profile?.full_name || 'Unknown',
      action:
        t.transaction_type === 'investment'
          ? 'invested'
          : t.transaction_type === 'payout'
          ? 'received a payout for'
          : t.transaction_type,
      target: t.property?.title || '',
      amount: Number(t.amount),
      status: t.payment_status,
      time: t.created_at,
    }));

    return NextResponse.json({
      kpis: {
        totalProperties: propertyCount,
        activeInvestors: investorCount,
        totalInvestments: totalInvested,
        avgYield: Math.round(avgYield * 10) / 10,
      },
      topProperties,
      recentActivity,
    });
  } catch (error: any) {
    console.error('Failed to fetch dashboard summary:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard summary' }, { status: 500 });
  }
}
