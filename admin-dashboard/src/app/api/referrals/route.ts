import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/require-admin';

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    // Get all users who have a referral code or role 'agent'
    const referrers = await prisma.profile.findMany({
      where: {
        OR: [
          { role: 'agent' },
          { referral_code: { not: null } },
        ],
      },
      select: {
        id: true,
        full_name: true,
        email: true,
        phone_number: true,
        role: true,
        referral_code: true,
        created_at: true,
      },
      orderBy: { created_at: 'desc' },
    });

    const referralData = await Promise.all(
      referrers.map(async (referrer) => {
        // 1. Fetch investors who signed up with referrer's code
        const codeReferred = referrer.referral_code
          ? await prisma.profile.findMany({
              where: { referred_by_code: referrer.referral_code },
              include: {
                investments: {
                  include: {
                    property: {
                      select: {
                        id: true,
                        title: true,
                        locality: true,
                        district: true,
                      },
                    },
                  },
                },
              },
            })
          : [];

        // 2. Fetch commissions linked to this agent
        const commissions = await prisma.agentCommission.findMany({
          where: { agent_id: referrer.id },
          include: {
            investor: {
              include: {
                investments: {
                  include: {
                    property: {
                      select: {
                        id: true,
                        title: true,
                        locality: true,
                        district: true,
                      },
                    },
                  },
                },
              },
            },
            investment: {
              include: {
                property: {
                  select: {
                    id: true,
                    title: true,
                    locality: true,
                    district: true,
                  },
                },
              },
            },
            property: true,
          },
        });

        // 3. Fetch agent client leads
        const clientLeads = await prisma.agentClient.findMany({
          where: { agent_id: referrer.id },
        });

        // Consolidate unique referred investors
        const investorMap = new Map<string, any>();

        // Add code-referred investors
        for (const inv of codeReferred) {
          const invSum = inv.investments.reduce(
            (sum, i) => sum + Number(i.total_amount || 0),
            0
          );
          const fractions = inv.investments.reduce(
            (sum, i) => sum + (i.fractions_bought || 0),
            0
          );
          investorMap.set(inv.id, {
            id: inv.id,
            full_name: inv.full_name || 'Investor',
            email: inv.email || '—',
            phone: inv.phone_number || '—',
            joined_at: inv.created_at,
            total_invested: invSum,
            fractions_bought: fractions,
            status: inv.investments.length > 0 ? 'Converted Investor' : 'Registered Lead',
            properties: inv.investments.map((i) => i.property?.title).filter(Boolean),
          });
        }

        // Add commission investors
        for (const comm of commissions) {
          if (comm.investor) {
            const existing = investorMap.get(comm.investor.id);
            const invSum =
              Number(comm.investment?.total_amount || 0) ||
              comm.investor.investments?.reduce(
                (sum: number, i: any) => sum + Number(i.total_amount || 0),
                0
              ) || 0;
            const fractions =
              comm.investment?.fractions_bought ||
              comm.investor.investments?.reduce(
                (sum: number, i: any) => sum + (i.fractions_bought || 0),
                0
              ) || 1;

            investorMap.set(comm.investor.id, {
              id: comm.investor.id,
              full_name: comm.investor.full_name || 'Investor',
              email: comm.investor.email || '—',
              phone: comm.investor.phone_number || '—',
              joined_at: comm.investor.created_at || comm.created_at,
              total_invested: existing ? Math.max(existing.total_invested, invSum) : invSum,
              fractions_bought: existing ? Math.max(existing.fractions_bought, fractions) : fractions,
              status: 'Converted Investor',
              properties: [
                ...(existing?.properties || []),
                comm.property?.title,
                comm.investment?.property?.title,
              ].filter(Boolean),
            });
          }
        }

        // Add CRM leads if any
        for (const lead of clientLeads) {
          const leadKey = `lead_${lead.id}`;
          if (!investorMap.has(leadKey)) {
            investorMap.set(leadKey, {
              id: lead.id,
              full_name: lead.client_name,
              email: '—',
              phone: lead.phone_number || '—',
              joined_at: lead.created_at,
              total_invested: 0,
              fractions_bought: 0,
              status: lead.status || 'Active Lead',
              properties: [],
            });
          }
        }

        const consolidatedInvestors = Array.from(investorMap.values());

        // Commissions Calculations
        const totalCommission = commissions.reduce(
          (sum, c) => sum + Number(c.commission_amount || 0),
          0
        );
        const paidCommission = commissions
          .filter((c) => c.status === 'paid')
          .reduce((sum, c) => sum + Number(c.commission_amount || 0), 0);
        const pendingCommission = totalCommission - paidCommission;

        // Investment Volume Calculations
        let totalInvestmentVolume = consolidatedInvestors.reduce(
          (sum, inv) => sum + Number(inv.total_invested || 0),
          0
        );

        // Fallback: If commissions exist with investment amounts
        if (totalInvestmentVolume === 0 && commissions.length > 0) {
          totalInvestmentVolume = commissions.reduce(
            (sum, c) => sum + Number(c.investment?.total_amount || 0),
            0
          );
        }

        const convertedCount = consolidatedInvestors.filter(
          (inv) => inv.total_invested > 0 || inv.status === 'Converted Investor'
        ).length;

        const totalReferredCount = Math.max(
          consolidatedInvestors.length,
          commissions.length
        );

        const conversionRate =
          totalReferredCount > 0
            ? Math.round((convertedCount / totalReferredCount) * 100)
            : 0;

        return {
          agentId: referrer.id,
          agentName: referrer.full_name,
          agentEmail: referrer.email,
          referralCode: referrer.referral_code || '—',
          joinedAt: referrer.created_at,
          investorsReferred: totalReferredCount,
          referredInvestors: consolidatedInvestors,
          totalInvestmentVolume,
          totalCommission,
          paidCommission,
          pendingCommission,
          conversionRate,
        };
      })
    );

    // Sort by investment volume and referrals (highest first)
    referralData.sort(
      (a, b) =>
        b.totalInvestmentVolume - a.totalInvestmentVolume ||
        b.investorsReferred - a.investorsReferred
    );

    return NextResponse.json(referralData);
  } catch (error: any) {
    console.error('Error fetching referral data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch referral data', details: error.message },
      { status: 500 }
    );
  }
}
