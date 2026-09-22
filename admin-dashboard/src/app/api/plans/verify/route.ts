import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

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
    const uid = decodedToken.uid;

    const body = await req.json().catch(() => ({}));
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId, amount, couponCode } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !planId) {
      return NextResponse.json({ error: 'Missing required payment verification fields.' }, { status: 400 });
    }

    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || 'NZnDXpg0bw187rRQIiVtGmCz';

    const generatedSignature = crypto
      .createHmac('sha256', razorpayKeySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment signature. Payment verification failed.' }, { status: 400 });
    }

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId }
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found.' }, { status: 404 });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + plan.validity_days);

    // Expire previous active subscriptions for the user
    await prisma.userSubscription.updateMany({
      where: { user_id: uid, status: 'active' },
      data: { status: 'expired' }
    });

    // Determine discount amount
    let discountAmount = 0;
    if (couponCode) {
      const coupon = await prisma.discountCoupon.findUnique({ where: { code: couponCode } });
      if (coupon) {
         if (coupon.discount_type === 'percentage') {
           discountAmount = (Number(plan.price) * Number(coupon.discount_value)) / 100;
         } else if (coupon.discount_type === 'flat') {
           discountAmount = Number(coupon.discount_value);
         }
         // Increment coupon usage
         await prisma.discountCoupon.update({
            where: { id: coupon.id },
            data: { times_used: { increment: 1 } }
         });
      }
    }

    const subscription = await prisma.userSubscription.create({
      data: {
        user_id: uid,
        plan_id: planId,
        status: 'active',
        razorpay_order_id,
        razorpay_payment_id,
        amount_paid: amount || 0,
        coupon_code: couponCode || null,
        discount_amount: discountAmount,
        expires_at: expiresAt,
      }
    });

    return NextResponse.json({ success: true, subscriptionId: subscription.id });

  } catch (error: any) {
    console.error('Error verifying plan payment:', error);
    return NextResponse.json(
      { error: error?.message || 'Payment verification failed.' },
      { status: 500 }
    );
  }
}
