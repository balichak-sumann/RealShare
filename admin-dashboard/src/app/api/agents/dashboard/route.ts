import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // Fetch the agent's profile
    let profile = await prisma.profile.findUnique({
      where: { id: uid }
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (profile.role !== 'agent' && profile.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied: not an agent' }, { status: 403 });
    }

    // Generate referral code if it doesn't exist
    if (!profile.referral_code) {
      const shortId = uid.substring(0, 6).toUpperCase();
      const generatedCode = `RS-${shortId}`;
      profile = await prisma.profile.update({
        where: { id: uid },
        data: { referral_code: generatedCode }
      });
    }

    // Fetch agent commissions and client pipeline
    const commissions = await prisma.agentCommission.findMany({
      where: { agent_id: uid },
      include: {
        investor: true,
        property: true,
        investment: true
      },
      orderBy: { created_at: 'desc' }
    });

    let totalEarned = 0;
    let pendingPayout = 0;
    const clientLeads = commissions.map(c => {
      const amount = Number(c.commission_amount);
      
      if (c.status === 'paid') {
        totalEarned += amount;
      } else if (c.status === 'pending_clearance' || c.status === 'accrued') {
        pendingPayout += amount;
      }

      // Map status for frontend UI
      let displayStatus = 'Under Review';
      if (c.status === 'paid') displayStatus = 'Commission Paid';
      else if (c.status === 'pending_clearance' || c.status === 'accrued') displayStatus = 'Pending Payout';

      return {
        id: c.id,
        name: c.investor.full_name,
        property: c.property.title,
        fractions: c.investment?.fractions_bought || 0,
        commission: `₹${amount.toLocaleString('en-IN')}`,
        status: displayStatus
      };
    });

    // Monthly trends aggregation
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyDataMap: Record<string, number> = {};
    
    // Initialize last 6 months with 0
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const label = monthNames[d.getMonth()];
      monthlyDataMap[label] = 0;
    }

    commissions.forEach(c => {
      const date = new Date(c.created_at);
      const label = monthNames[date.getMonth()];
      if (monthlyDataMap[label] !== undefined && c.status === 'paid') {
         monthlyDataMap[label] += Number(c.commission_amount);
      }
    });

    const monthlyTrends = {
      labels: Object.keys(monthlyDataMap),
      data: Object.values(monthlyDataMap)
    };

    return NextResponse.json({
      agentName: profile.full_name,
      agencyName: 'RealShare Agent', // Could be dynamic if added to schema later
      commissionRate: '2.5% per Sale', // Could be dynamic
      referralCode: profile.referral_code,
      totalEarned: `₹${totalEarned.toLocaleString('en-IN')}`,
      pendingPayout: `₹${pendingPayout.toLocaleString('en-IN')}`,
      clientLeads,
      monthlyTrends
    });

  } catch (error: any) {
    console.error('Error fetching agent dashboard:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
