import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
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
      return NextResponse.json({ error: 'Invalid authentication session.' }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({
      where: { id: decodedToken.uid },
      select: { role: true }
    });

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const existingPlansCount = await prisma.subscriptionPlan.count();
    if (existingPlansCount > 0) {
      return NextResponse.json({ message: 'Plans already seeded.', count: existingPlansCount });
    }

    const plansToSeed = [
      // Agent Plans
      {
        role_type: 'agent',
        tier: 'REGULAR',
        price: 0,
        postings_limit: 1,
        post_listing_days: 30,
        support_level: 'Regular',
        post_assistance: 'No',
        referral_program: false,
        renewal: false,
        validity_days: 30,
        tagline: 'Starter',
        sort_order: 1,
      },
      {
        role_type: 'agent',
        tier: 'GOLD',
        price: 499,
        postings_limit: 5,
        post_listing_days: 30,
        support_level: 'Regular',
        post_assistance: 'Yes',
        referral_program: false,
        renewal: true,
        validity_days: 90,
        tagline: 'Small Listings',
        sort_order: 2,
      },
      {
        role_type: 'agent',
        tier: 'PLATINUM',
        price: 999,
        postings_limit: 15,
        post_listing_days: 90,
        support_level: 'Premium',
        post_assistance: 'Premium',
        referral_program: true,
        renewal: true,
        validity_days: 365,
        tagline: 'Most Valuable',
        sort_order: 3,
      },
      {
        role_type: 'agent',
        tier: 'TITANIUM',
        price: 1999,
        postings_limit: 50,
        post_listing_days: 180,
        support_level: 'Premium',
        post_assistance: 'Premium',
        referral_program: true,
        renewal: true,
        validity_days: 365,
        tagline: 'Selling Big Mandate',
        sort_order: 4,
      },
      // Builder Plans
      {
        role_type: 'builder',
        tier: 'REGULAR',
        price: 0,
        postings_limit: 1,
        post_listing_days: 30,
        support_level: 'Regular',
        post_assistance: 'No',
        referral_program: false,
        renewal: false,
        validity_days: 90,
        tagline: 'Starter',
        sort_order: 1,
        features: { display: "Local" },
      },
      {
        role_type: 'builder',
        tier: 'GOLD',
        price: 14999,
        postings_limit: 10,
        post_listing_days: 90,
        support_level: 'Regular',
        post_assistance: 'Yes',
        referral_program: false,
        renewal: true,
        validity_days: 365,
        tagline: 'Good for Small Projects',
        sort_order: 2,
        features: { display: "Pan India", freeVerification: true },
      },
      {
        role_type: 'builder',
        tier: 'PLATINUM',
        price: 29999,
        postings_limit: 30,
        post_listing_days: 180,
        support_level: 'Premium',
        post_assistance: 'Premium',
        referral_program: false,
        renewal: true,
        validity_days: 365,
        tagline: 'Hot Selling',
        sort_order: 3,
        features: { display: "Pan India", boostMode: true, searchListing: true, accountManager: true, freeVerification: true },
      },
      {
        role_type: 'builder',
        tier: 'TITANIUM',
        price: 49999,
        postings_limit: 100,
        post_listing_days: 365,
        support_level: 'Premium',
        post_assistance: 'Premium',
        referral_program: false,
        renewal: true,
        validity_days: 365,
        tagline: 'Good for Mega Projects',
        sort_order: 4,
        features: { display: "Pan India", boostMode: true, searchListing: true, accountManager: true, freeVerification: true },
      },
    ];

    const createdPlans = await prisma.$transaction(
      plansToSeed.map((plan) => prisma.subscriptionPlan.create({ data: plan }))
    );

    return NextResponse.json({ success: true, count: createdPlans.length });
  } catch (error: any) {
    console.error('Error seeding plans:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
