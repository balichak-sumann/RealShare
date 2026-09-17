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
    const { amount } = body;

    if (!amount || Number(amount) <= 0) {
      return NextResponse.json({ error: 'A valid payment amount is required.' }, { status: 400 });
    }

    // Ensure user profile exists in DB
    let profile = await prisma.profile.findUnique({ where: { id: uid } });
    if (!profile) {
      profile = await prisma.profile.create({
        data: {
          id: uid,
          email: decodedToken.email || null,
          full_name: decodedToken.name || decodedToken.email?.split('@')[0] || 'User',
          role: 'buyer',
        }
      }).catch(async () => prisma.profile.findUnique({ where: { id: uid } }));
    }

    const razorpayKeyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_TSKXy2WO8gcwyH';
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || 'NZnDXpg0bw187rRQIiVtGmCz';

    let orderAmount = Math.round(Number(amount) * 100);
    const isTestMode = razorpayKeyId.startsWith('rzp_test_');

    // Razorpay Test mode has a ₹5,00,000 (50,000,000 paise) transaction cap.
    let gatewayOrderAmount = orderAmount;
    if (isTestMode && gatewayOrderAmount > 50000000) {
      gatewayOrderAmount = 50000000;
    }

    const orderCurrency = 'INR';
    const razorpay = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    });

    const rzpOrder = await razorpay.orders.create({
      amount: gatewayOrderAmount,
      currency: orderCurrency,
      receipt: `w_rcpt_${Date.now().toString().slice(-8)}`,
      notes: {
        userId: uid,
        type: 'wallet_deposit',
      }
    });

    if (!rzpOrder || !rzpOrder.id) {
      return NextResponse.json({ error: 'Failed to generate payment gateway order.' }, { status: 500 });
    }

    const orderId = rzpOrder.id;
    const finalGatewayAmount = Number(rzpOrder.amount);

    // Create pending transaction in DB for wallet deposit
    const transaction = await prisma.transaction.create({
      data: {
        user_id: uid,
        transaction_type: 'wallet_deposit',
        amount: Number(amount),
        currency: orderCurrency,
        payment_gateway: 'Razorpay',
        gateway_txn_id: orderId,
        payment_method: 'razorpay',
        payment_status: 'pending',
        metadata: {
          order_id: orderId,
          type: 'wallet_deposit'
        }
      }
    });

    return NextResponse.json({
      orderId,
      amount: finalGatewayAmount,
      currency: orderCurrency,
      transactionId: transaction.id,
      keyId: razorpayKeyId,
    });
  } catch (error: any) {
    console.error('Error creating wallet top-up order:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create payment order.' },
      { status: 500 }
    );
  }
}
