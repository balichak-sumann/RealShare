import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/require-admin';

function generateReferralCode(uid: string): string {
  const base = uid.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6).padEnd(6, '0');
  return `RS-${base}`;
}

// GET: the authenticated user's own referral code, referred-investor count,
// and total commission actually earned through referrals (real AgentCommission
// rows only -- no fabricated "points" or loyalty catalog).
export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    let profile = await prisma.profile.findUnique({ where: { id: auth.uid } });
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (!profile.referral_code) {
      let code = generateReferralCode(profile.id);
      // Extremely unlikely collision path: fall back to a uid-suffixed code.
      const existing = await prisma.profile.findUnique({ where: { referral_code: code } });
      if (existing && existing.id !== profile.id) {
        code = `${code}-${profile.id.slice(-4).toUpperCase()}`;
      }
      profile = await prisma.profile.update({
        where: { id: profile.id },
        data: { referral_code: code },
      });
    }

    const referredCount = await prisma.profile.count({
      where: { referred_by_code: profile.referral_code },
    });

    const commissions = await prisma.agentCommission.findMany({
      where: { agent_id: profile.id },
      select: { commission_amount: true, status: true },
    });
    const totalEarned = commissions
      .filter((c) => c.status === 'paid')
      .reduce((sum, c) => sum + Number(c.commission_amount), 0);
    const totalPending = commissions
      .filter((c) => c.status !== 'paid')
      .reduce((sum, c) => sum + Number(c.commission_amount), 0);

    return NextResponse.json({
      referral_code: profile.referral_code,
      referred_count: referredCount,
      total_earned: totalEarned,
      total_pending: totalPending,
    });
  } catch (error: any) {
    console.error('Failed to fetch referral info:', error);
    return NextResponse.json({ error: 'Failed to fetch referral info' }, { status: 500 });
  }
}
