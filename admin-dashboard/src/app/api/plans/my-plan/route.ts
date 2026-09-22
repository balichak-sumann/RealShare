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
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch (authErr) {
      return NextResponse.json({ error: 'Invalid auth token' }, { status: 401 });
    }

    const uid = decodedToken.uid;

    const subscription = await prisma.userSubscription.findFirst({
      where: {
        user_id: uid,
        status: 'active',
        expires_at: { gt: new Date() } // ensure it's not expired
      },
      include: {
        plan: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    if (!subscription) {
       return NextResponse.json({ hasPlan: false });
    }

    return NextResponse.json({
      hasPlan: true,
      subscription: {
        id: subscription.id,
        tier: subscription.plan.tier,
        plan_name: `${subscription.plan.tier} (${subscription.plan.role_type})`,
        postings_limit: subscription.plan.postings_limit,
        postings_used: subscription.postings_used,
        expires_at: subscription.expires_at,
        status: subscription.status,
        plan: subscription.plan,
      }
    });

  } catch (error: any) {
    console.error('Error fetching user plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
