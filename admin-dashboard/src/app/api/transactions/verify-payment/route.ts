import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/firebase-admin';
import crypto from 'crypto';

const prisma = new PrismaClient();

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
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, transactionId } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !transactionId) {
      return NextResponse.json({ error: 'Missing payment details' }, { status: 400 });
    }

    // Verify signature
    const secret = process.env.RAZORPAY_KEY_SECRET!;
    const generated_signature = crypto
      .createHmac('sha256', secret)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
    }

    // Payment is valid, update transaction and create investment
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Ensure it hasn't been completed already
    if (transaction.payment_status === 'completed') {
      return NextResponse.json({ success: true, message: 'Already processed' });
    }

    const fractionsBought = (transaction.metadata as any)?.fractions_bought || 1;
    const certificateId = `RS-CERT-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const investment = await prisma.investment.create({
      data: {
        user_id: userId,
        property_id: transaction.property_id!,
        fractions_bought: fractionsBought,
        total_amount: transaction.amount,
        booking_amount_paid: transaction.amount,
        ownership_percentage: 0.1, // Mock ownership, should be dynamic
        certificate_number: certificateId,
        status: 'completed',
      }
    });

    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        payment_status: 'completed',
        investment_id: investment.id,
      }
    });

    return NextResponse.json({ success: true, certificateId, investmentId: investment.id });
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
