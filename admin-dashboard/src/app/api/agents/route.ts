import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/require-admin';

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const agents = await prisma.profile.findMany({
      where: { role: 'agent' },
      include: {
        agent_commissions: {
          include: {
            property: {
              select: {
                id: true,
                title: true,
                locality: true,
                district: true,
                price_per_fraction: true,
                images: { where: { is_primary: true }, take: 1, select: { image_url: true } },
              },
            },
            investor: {
              select: {
                id: true,
                full_name: true,
                email: true,
                phone_number: true,
              },
            },
            investment: {
              select: {
                id: true,
                fractions_bought: true,
                total_amount: true,
                created_at: true,
              },
            },
          },
          orderBy: { created_at: 'desc' },
        },
        agent_clients: {
          include: {
            assignments: {
              include: {
                property: {
                  select: {
                    id: true,
                    title: true,
                    locality: true,
                  },
                },
              },
            },
          },
          orderBy: { created_at: 'desc' },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    // Also fetch all investors who were referred by referral codes
    const referredInvestors = await prisma.profile.findMany({
      where: {
        referred_by_code: {
          in: agents.map((a) => a.referral_code).filter(Boolean) as string[],
        },
      },
      select: {
        id: true,
        full_name: true,
        email: true,
        phone_number: true,
        referred_by_code: true,
        created_at: true,
        investments: {
          select: {
            total_amount: true,
            fractions_bought: true,
          },
        },
      },
    });

    const shaped = agents.map((agent) => {
      const commissions = agent.agent_commissions || [];
      const clients = agent.agent_clients || [];
      const codeReferred = referredInvestors.filter(
        (inv) => inv.referred_by_code === agent.referral_code
      );

      let earned = 0;
      let pending = 0;
      let salesVolume = 0;

      commissions.forEach((c) => {
        const amt = Number(c.commission_amount || 0);
        if (c.status === 'paid') {
          earned += amt;
        } else if (c.status === 'pending_clearance') {
          pending += amt;
        }
        if (c.investment) {
          salesVolume += Number(c.investment.total_amount || 0);
        }
      });

      // Add sales volume from directly referred investors if not already in commissions
      codeReferred.forEach((inv) => {
        inv.investments.forEach((invItem) => {
          const invAmt = Number(invItem.total_amount || 0);
          // If commission not already counted
          if (commissions.length === 0) {
            salesVolume += invAmt;
          }
        });
      });

      // Total referred count
      const totalReferred = Math.max(
        commissions.length,
        clients.length,
        codeReferred.length
      );

      return {
        id: agent.id,
        full_name: agent.full_name,
        email: agent.email || '—',
        phone_number: agent.phone_number || '—',
        full_address: agent.full_address || '—',
        role: agent.role,
        referral_code: agent.referral_code || '—',
        commission_rate_pct:
          agent.commission_rate_pct != null
            ? Number(agent.commission_rate_pct)
            : 2.5,
        is_active: agent.is_active,
        is_approved: agent.is_approved,
        bank_account_name: agent.bank_account_name || null,
        bank_account_number: agent.bank_account_number || null,
        bank_ifsc: agent.bank_ifsc || null,
        created_at: agent.created_at,
        total_investors_referred: totalReferred,
        total_sales_volume: salesVolume,
        commission_earned: earned,
        commission_pending: pending,
        commissions: commissions.map((c) => ({
          id: c.id,
          property_title: c.property?.title || 'Property Asset',
          locality: c.property?.locality || '—',
          investor_name: c.investor?.full_name || 'Investor',
          investor_email: c.investor?.email || '—',
          fractions_bought: c.investment?.fractions_bought || 1,
          investment_amount: Number(c.investment?.total_amount || 0),
          commission_percentage: Number(c.commission_percentage || 2.0),
          commission_amount: Number(c.commission_amount || 0),
          status: c.status,
          paid_at: c.paid_at,
          created_at: c.created_at,
        })),
        clients: clients.map((cl) => ({
          id: cl.id,
          client_name: cl.client_name,
          phone_number: cl.phone_number,
          target_budget: cl.target_budget || '—',
          status: cl.status,
          created_at: cl.created_at,
        })),
        referred_investors: codeReferred.map((inv) => ({
          id: inv.id,
          name: inv.full_name,
          email: inv.email,
          phone: inv.phone_number,
          total_invested: inv.investments.reduce(
            (sum, i) => sum + Number(i.total_amount || 0),
            0
          ),
          joined_date: inv.created_at,
        })),
      };
    });

    return NextResponse.json(shaped);
  } catch (error: any) {
    console.error('Failed to fetch agents:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}

// POST: Admin onboards/creates a new Channel Partner / Agent directly
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const {
      full_name,
      email,
      phone_number,
      agency_name,
      commission_rate_pct,
      referral_code,
      bank_account_name,
      bank_account_number,
      bank_ifsc,
      full_address,
    } = body;

    if (!full_name || !email) {
      return NextResponse.json(
        { error: 'Full name and email are required.' },
        { status: 400 }
      );
    }

    const existing = await prisma.profile.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'An agent with this email already exists.' },
        { status: 409 }
      );
    }

    const generatedId = `agent_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const refCode =
      referral_code ||
      `RS-AG-${full_name.split(' ')[0].toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const newAgent = await prisma.profile.create({
      data: {
        id: generatedId,
        full_name: full_name.trim(),
        email: email.trim().toLowerCase(),
        phone_number: phone_number?.trim() || null,
        full_address: full_address?.trim() || (agency_name ? `Agency: ${agency_name.trim()}` : null),
        role: 'agent',
        commission_rate_pct: commission_rate_pct ? Number(commission_rate_pct) : 2.50,
        referral_code: refCode,
        bank_account_name: bank_account_name?.trim() || null,
        bank_account_number: bank_account_number?.trim() || null,
        bank_ifsc: bank_ifsc?.trim() || null,
        is_active: true,
        is_banned: false,
      },
      include: {
        agent_commissions: true,
        agent_clients: true,
      },
    });

    return NextResponse.json(newAgent, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create agent:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create agent' },
      { status: 500 }
    );
  }
}
