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
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

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

    const propertyBeforeUpdate = await prisma.property.findUnique({
      where: { id: transaction.property_id! },
    });

    if (!propertyBeforeUpdate) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // Guard against overselling: only decrement available_fractions when enough
    // remain. This runs as a single conditional UPDATE (WHERE available_fractions
    // >= fractionsBought), so it stays correct under concurrent purchases instead
    // of letting available_fractions go negative.
    const decrementResult = await prisma.property.updateMany({
      where: {
        id: transaction.property_id!,
        available_fractions: { gte: fractionsBought },
      },
      data: {
        available_fractions: { decrement: fractionsBought },
        sold_fractions: { increment: fractionsBought },
      },
    });

    if (decrementResult.count === 0) {
      return NextResponse.json(
        { error: 'Not enough available fractions remaining for this purchase' },
        { status: 409 }
      );
    }

    // If this purchase exhausted the share pool, mark the property sold out so
    // the admin "Sold Out" filter tab actually finds it.
    const propertyAfterUpdate = await prisma.property.findUnique({
      where: { id: transaction.property_id! },
      select: { available_fractions: true },
    });
    if (propertyAfterUpdate && propertyAfterUpdate.available_fractions <= 0) {
      await prisma.property.update({
        where: { id: transaction.property_id! },
        data: { approval_status: 'sold_out' },
      });
    }

    // Real ownership percentage (not the raw fraction count), rounded to the
    // Decimal(6,3) precision the Investment.ownership_percentage column expects.
    const rawOwnershipPercentage =
      propertyBeforeUpdate.total_fractions > 0
        ? (fractionsBought / propertyBeforeUpdate.total_fractions) * 100
        : 0;
    const ownershipPercentage = Math.round(rawOwnershipPercentage * 1000) / 1000;

    const investment = await prisma.investment.create({
      data: {
        user_id: userId,
        property_id: transaction.property_id!,
        fractions_bought: fractionsBought,
        total_amount: transaction.amount,
        booking_amount_paid: transaction.amount,
        ownership_percentage: ownershipPercentage,
        certificate_number: certificateId,
        status: 'completed',
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
