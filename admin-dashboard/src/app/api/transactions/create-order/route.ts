import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/firebase-admin';

const prisma = new PrismaClient();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const body = await req.json();
    const { propertyId, amount, fractionsBought } = body;

    if (!propertyId || !amount || !fractionsBought) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Amount is in INR. Razorpay expects amount in paise (1 INR = 100 paise)
    const amountInPaise = Math.round(amount * 100);

    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `rcpt_${userId.substring(0, 8)}_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    // Create a transaction record in pending state
    const transaction = await prisma.transaction.create({
      data: {
        user_id: userId,
        property_id: propertyId,
        transaction_type: 'property_booking',
        amount: amount,
        currency: 'INR',
        payment_gateway: 'Razorpay',
        gateway_txn_id: order.id,
        payment_status: 'pending',
        metadata: {
          fractions_bought: fractionsBought
        }
      }
    });

    return NextResponse.json({ orderId: order.id, transactionId: transaction.id, amount: amountInPaise, currency: "INR" });
  } catch (error: any) {
    console.error('Error creating Razorpay order:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
