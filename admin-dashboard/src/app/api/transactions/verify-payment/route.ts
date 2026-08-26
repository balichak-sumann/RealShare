import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import crypto from 'crypto';
import { sendInvestmentSuccessEmail } from '@/lib/mailer';

import prisma from '@/lib/prisma';
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];
    let userId = 'mock-user-123';
    
    if (token !== 'MOCK_TOKEN') {
      const decodedToken = await auth.verifyIdToken(token);
      userId = decodedToken.uid;
    }

    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, transactionId } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !transactionId) {
      return NextResponse.json({ error: 'Missing payment details' }, { status: 400 });
    }

    // Verify signature
    let isValid = false;
    if (razorpay_order_id.startsWith('mock_order_') || (!process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET.includes('YOUR_'))) {
       isValid = true; // Bypass signature verification for mock local testing
    } else {
       const secret = process.env.RAZORPAY_KEY_SECRET!;
       const generated_signature = crypto
         .createHmac('sha256', secret)
         .update(razorpay_order_id + '|' + razorpay_payment_id)
         .digest('hex');
       isValid = generated_signature === razorpay_signature;
    }

    if (!isValid) {
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
        ownership_percentage: fractionsBought, // In a real app this might be (fractionsBought / total_fractions) * 100
        certificate_number: certificateId,
        status: 'completed',
      }
    });

    // Update Property fractions
    await prisma.property.update({
      where: { id: transaction.property_id! },
      data: {
        available_fractions: { decrement: fractionsBought },
        sold_fractions: { increment: fractionsBought },
      }
    });

    // Commission Logic
    const investor = await prisma.profile.findUnique({
      where: { id: userId }
    });

    if (investor && investor.referred_by_code) {
      const agent = await prisma.profile.findUnique({
        where: { referral_code: investor.referred_by_code }
      });

      if (agent && agent.role === 'agent') {
        const commissionAmount = Number(transaction.amount) * 0.025;
        
        await prisma.agentCommission.create({
          data: {
            agent_id: agent.id,
            investor_id: investor.id,
            property_id: transaction.property_id!,
            investment_id: investment.id,
            commission_percentage: 2.50,
            commission_amount: commissionAmount,
            status: 'pending_clearance'
          }
        });

        if (agent.expo_push_token) {
          try {
            await fetch('https://exp.host/--/api/v2/push/send', {
              method: 'POST',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                to: agent.expo_push_token,
                sound: 'default',
                title: 'New Commission Earned! 🎉',
                body: `You just earned ₹${commissionAmount.toLocaleString('en-IN')} from a referral!`,
              })
            });
          } catch (e) {
            console.error('Failed to send push notification', e);
          }
        }
      }
    }

    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        payment_status: 'completed',
        investment_id: investment.id,
      }
    });

    const property = await prisma.property.findUnique({
      where: { id: transaction.property_id! }
    });

    if (investor && investor.email && property) {
      await sendInvestmentSuccessEmail({
        to: investor.email,
        userName: investor.full_name,
        propertyName: property.title,
        fractionsBought: fractionsBought,
        certificateId: certificateId,
        amount: Number(transaction.amount)
      });
    }

    return NextResponse.json({ success: true, certificateId, investmentId: investment.id });
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
