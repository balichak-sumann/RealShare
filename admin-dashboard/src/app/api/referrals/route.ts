import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/require-admin';

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    // Get every user who has a referral code -- referral codes are issued to
    // any authenticated user (see /api/me/referral), not just agents, so
    // filtering this admin view to role 'agent' hid real non-agent referral
    // activity. Reward/commission columns below are agent-specific and will
    // correctly show 0 for non-agent referrers; that's expected.
    const agents = await prisma.profile.findMany({
      where: {
        referral_code: { not: null },
      },
      select: {
        id: true,
        full_name: true,
        email: true,
        referral_code: true,
        created_at: true,
      },
    });

    // For each agent, get investors who used their referral code + commissions
    const referralData = await Promise.all(
      agents.map(async (agent) => {
        const referredInvestors = await prisma.profile.findMany({
          where: { referred_by_code: agent.referral_code },
          select: {
            id: true,
            full_name: true,
            email: true,
            created_at: true,
          },
        });

        const commissions = await prisma.agentCommission.findMany({
          where: { agent_id: agent.id },
          select: {
            commission_amount: true,
            status: true,
            created_at: true,
          },
        });

        const totalCommission = commissions.reduce(
          (sum, c) => sum + Number(c.commission_amount),
          0
        );
        const paidCommission = commissions
          .filter((c) => c.status === 'paid')
          .reduce((sum, c) => sum + Number(c.commission_amount), 0);

        // Get total investment volume from referred investors
        const investorIds = referredInvestors.map((inv) => inv.id);
        const investments = investorIds.length > 0
          ? await prisma.investment.findMany({
              where: { user_id: { in: investorIds } },
              select: { total_amount: true },
            })
          : [];

        const totalInvestmentVolume = investments.reduce(
          (sum, inv) => sum + Number(inv.total_amount),
          0
        );

        return {
          agentId: agent.id,
          agentName: agent.full_name,
          agentEmail: agent.email,
          referralCode: agent.referral_code,
          joinedAt: agent.created_at,
          investorsReferred: referredInvestors.length,
          referredInvestors: referredInvestors,
          totalInvestmentVolume,
          totalCommission,
          paidCommission,
          pendingCommission: totalCommission - paidCommission,
          conversionRate:
            referredInvestors.length > 0
              ? Math.round(
                  (investments.length / referredInvestors.length) * 100
                )
              : 0,
        };
      })
    );

    // Sort by total investors referred (highest first)
    referralData.sort((a, b) => b.investorsReferred - a.investorsReferred);

    return NextResponse.json(referralData);
  } catch (error: any) {
    console.error('Error fetching referral data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch referral data', details: error.message },
      { status: 500 }
    );
  }
}
