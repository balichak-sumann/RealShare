import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import prisma from '@/lib/prisma';
import Razorpay from 'razorpay';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch (authErr) {
      return NextResponse.json({ error: 'Invalid authentication session.' }, { status: 401 });
    }

    const uid = decodedToken.uid;
    const body = await req.json().catch(() => ({}));
    const { planId, couponCode } = body;

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required.' }, { status: 400 });
    }

    // Verify plan exists and is active
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId }
    });

    if (!plan || !plan.is_active) {
      return NextResponse.json({ error: 'Plan not found or inactive.' }, { status: 404 });
    }

    let finalPrice = Number(plan.price);
    let discountAmount = 0;
    let appliedCoupon = null;

    // Validate and apply coupon if provided
    if (couponCode) {
      const coupon = await prisma.discountCoupon.findUnique({
        where: { code: couponCode.toUpperCase() }
      });

      if (coupon && coupon.is_active) {
        const now = new Date();
        if (now >= coupon.valid_from && now <= coupon.valid_until && coupon.times_used < coupon.max_uses) {
          if (!coupon.applicable_role || coupon.applicable_role === plan.role_type) {
             if (!coupon.applicable_tier || coupon.applicable_tier === plan.tier) {
               if (Number(plan.price) >= Number(coupon.min_plan_price)) {
                 appliedCoupon = coupon;
                 if (coupon.discount_type === 'percentage') {
                   discountAmount = (finalPrice * Number(coupon.discount_value)) / 100;
                 } else if (coupon.discount_type === 'flat') {
                   discountAmount = Number(coupon.discount_value);
                 }
                 finalPrice = Math.max(0, finalPrice - discountAmount);
               }
             }
          }
        }
      }
    }

    // If free plan or 100% discount, activate immediately
    if (finalPrice <= 0) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + plan.validity_days);

      // Expire previous subscriptions
      await prisma.userSubscription.updateMany({
        where: { user_id: uid, status: 'active' },
        data: { status: 'expired' }
      });

      const subscription = await prisma.userSubscription.create({
        data: {
          user_id: uid,
          plan_id: plan.id,
          status: 'active',
          amount_paid: 0,
          coupon_code: appliedCoupon ? appliedCoupon.code : null,
          discount_amount: discountAmount,
          expires_at: expiresAt,
        }
      });

      if (appliedCoupon) {
        await prisma.discountCoupon.update({
          where: { id: appliedCoupon.id },
          data: { times_used: { increment: 1 } }
        });
      }

      return NextResponse.json({
        success: true,
        activatedImmediately: true,
        subscriptionId: subscription.id
      });
    }

    // For paid plans, create Razorpay order
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_TSKXy2WO8gcwyH';
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || 'NZnDXpg0bw187rRQIiVtGmCz';

    const orderAmount = Math.round(finalPrice * 100); // paise
    const orderCurrency = 'INR';

    const razorpay = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    });

    const rzpOrder: any = await razorpay.orders.create({
      amount: orderAmount,
      currency: orderCurrency,
      receipt: `plan_${Date.now().toString().slice(-8)}`,
      notes: {
        planId,
        userId: uid,
        couponCode: appliedCoupon ? appliedCoupon.code : null,
      }
    });

    if (!rzpOrder || !rzpOrder.id) {
      return NextResponse.json({ error: 'Failed to generate payment gateway order.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      activatedImmediately: false,
      order_id: rzpOrder.id,
      amount: finalPrice,
      originalAmount: Number(plan.price),
      discountAmount,
      currency: orderCurrency,
      keyId: razorpayKeyId,
    });

  } catch (error: any) {
    console.error('Error creating plan subscription order:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create subscription order.' },
      { status: 500 }
    );
  }
}
