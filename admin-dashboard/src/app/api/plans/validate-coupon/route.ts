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
    try {
      await auth.verifyIdToken(token);
    } catch (authErr) {
      return NextResponse.json({ error: 'Invalid auth token' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { code, planId } = body;

    if (!code || !planId) {
      return NextResponse.json({ error: 'Coupon code and plan ID are required.' }, { status: 400 });
    }

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId }
    });

    if (!plan) {
       return NextResponse.json({ error: 'Plan not found.' }, { status: 404 });
    }

    const coupon = await prisma.discountCoupon.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (!coupon) {
      return NextResponse.json({ error: 'Invalid coupon code.' }, { status: 400 });
    }

    if (!coupon.is_active) {
      return NextResponse.json({ error: 'This coupon is no longer active.' }, { status: 400 });
    }

    const now = new Date();
    if (now < coupon.valid_from) {
      return NextResponse.json({ error: 'This coupon is not valid yet.' }, { status: 400 });
    }

    if (now > coupon.valid_until) {
      return NextResponse.json({ error: 'This coupon has expired.' }, { status: 400 });
    }

    if (coupon.times_used >= coupon.max_uses) {
      return NextResponse.json({ error: 'Coupon exhaustion limit reached.' }, { status: 400 });
    }

    if (coupon.applicable_role && coupon.applicable_role !== plan.role_type) {
      return NextResponse.json({ error: `This coupon is only valid for ${coupon.applicable_role} plans.` }, { status: 400 });
    }

    if (coupon.applicable_tier && coupon.applicable_tier !== plan.tier) {
      return NextResponse.json({ error: `This coupon is only valid for ${coupon.applicable_tier} plans.` }, { status: 400 });
    }

    if (Number(plan.price) < Number(coupon.min_plan_price)) {
      return NextResponse.json({ error: `This coupon requires a minimum plan price of ₹${coupon.min_plan_price}.` }, { status: 400 });
    }

    let discountAmount = 0;
    if (coupon.discount_type === 'percentage') {
       discountAmount = (Number(plan.price) * Number(coupon.discount_value)) / 100;
    } else if (coupon.discount_type === 'flat') {
       discountAmount = Number(coupon.discount_value);
    }

    const finalPrice = Math.max(0, Number(plan.price) - discountAmount);

    return NextResponse.json({
      valid: true,
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: Number(coupon.discount_value),
      discount_amount: discountAmount,
      original_price: Number(plan.price),
      final_price: finalPrice
    });

  } catch (error: any) {
    console.error('Error validating coupon:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
