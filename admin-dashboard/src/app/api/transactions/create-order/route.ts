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
    const { propertyId, amount, fractionsBought = 1 } = body;

    if (!propertyId || !amount || Number(amount) <= 0) {
      return NextResponse.json({ error: 'Property ID and a valid payment amount are required.' }, { status: 400 });
    }

    // Verify property exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found.' }, { status: 404 });
    }

    if (property.available_fractions < Number(fractionsBought)) {
      return NextResponse.json({ error: `Only ${property.available_fractions} fractions currently available.` }, { status: 400 });
    }

    // Ensure buyer profile exists in DB
    let profile = await prisma.profile.findUnique({ where: { id: uid } });
    if (!profile) {
      profile = await prisma.profile.create({
        data: {
          id: uid,
          email: decodedToken.email || null,
          full_name: decodedToken.name || decodedToken.email?.split('@')[0] || 'Investor',
          role: 'investor',
        }
      }).catch(async () => prisma.profile.findUnique({ where: { id: uid } }));
    }

    const razorpayKeyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_TSKXy2WO8gcwyH';
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || 'NZnDXpg0bw187rRQIiVtGmCz';

    let orderAmount = Math.round(Number(amount) * 100);
    const isTestMode = razorpayKeyId.startsWith('rzp_test_');

    // Razorpay Test mode has a ₹5,00,000 (50,000,000 paise) transaction cap.
    // In test mode, clamp the checkout payment authorization amount if needed
    // so test orders always create successfully.
    let gatewayOrderAmount = orderAmount;
    if (isTestMode && gatewayOrderAmount > 50000000) {
      gatewayOrderAmount = 5000000; // ₹50,000 test token
    }

    const orderCurrency = 'INR';
    const razorpay = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    });

    const rzpOrder = await razorpay.orders.create({
      amount: gatewayOrderAmount,
      currency: orderCurrency,
      receipt: `rcpt_${Date.now().toString().slice(-8)}`,
      notes: {
        propertyId,
        userId: uid,
        fractionsBought: String(fractionsBought),
      }
    });

    if (!rzpOrder || !rzpOrder.id) {
      return NextResponse.json({ error: 'Failed to generate payment gateway order.' }, { status: 500 });
    }

    const orderId = rzpOrder.id;
    const finalGatewayAmount = Number(rzpOrder.amount);

    // Create pending transaction in DB
    const transaction = await prisma.transaction.create({
      data: {
        user_id: uid,
        property_id: propertyId,
        transaction_type: 'fraction_purchase',
        amount: Number(amount),
        currency: orderCurrency,
        payment_gateway: 'Razorpay',
        gateway_txn_id: orderId,
        payment_method: 'razorpay',
        payment_status: 'pending',
        metadata: {
          fractions_bought: Number(fractionsBought),
          property_title: property.title,
          order_id: orderId,
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
    console.error('Error creating transaction order:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create payment order.' },
      { status: 500 }
    );
  }
}
