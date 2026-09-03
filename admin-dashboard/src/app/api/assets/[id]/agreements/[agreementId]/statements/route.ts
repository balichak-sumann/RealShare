import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/firebase-admin';

async function getUser(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken.uid;
  } catch (e) {
    return null;
  }
}

/** Loads the agreement and verifies it belongs (via its parent asset) to the caller. */
async function getOwnedAgreement(id: string, agreementId: string, userId: string) {
  const agreement = await prisma.rentalAgreement.findUnique({
    where: { id: agreementId },
    include: { asset: true },
  });
  if (!agreement || agreement.asset_id !== id) {
    return { error: NextResponse.json({ error: 'Not found' }, { status: 404 }) };
  }
  if (agreement.asset.user_id !== userId) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { agreement };
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string; agreementId: string }> }) {
  try {
    const { id, agreementId } = await params;
    const userId = await getUser(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { error } = await getOwnedAgreement(id, agreementId, userId);
    if (error) return error;

    const statements = await prisma.rentalStatement.findMany({
      where: { agreement_id: agreementId },
      orderBy: { payment_date: 'desc' },
    });

    return NextResponse.json(statements);
  } catch (error) {
    console.error('Failed to fetch rental statements:', error);
    return NextResponse.json({ error: 'Failed to fetch statements' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string; agreementId: string }> }) {
  try {
    const { id, agreementId } = await params;
    const userId = await getUser(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { error } = await getOwnedAgreement(id, agreementId, userId);
    if (error) return error;

    const data = await request.json();
    if (!data.month_year || !data.amount_paid || !data.payment_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const amountPaid = Number(data.amount_paid);
    if (!Number.isFinite(amountPaid) || amountPaid <= 0) {
      return NextResponse.json({ error: 'amount_paid must be greater than 0' }, { status: 400 });
    }

    const paymentDate = new Date(data.payment_date);
    if (isNaN(paymentDate.getTime())) {
      return NextResponse.json({ error: 'Invalid payment_date' }, { status: 400 });
    }

    if (data.status !== undefined && !['paid', 'pending'].includes(data.status)) {
      return NextResponse.json({ error: "status must be 'paid' or 'pending'" }, { status: 400 });
    }

    const statement = await prisma.rentalStatement.create({
      data: {
        agreement_id: agreementId,
        month_year: data.month_year,
        amount_paid: amountPaid,
        payment_date: paymentDate,
        payment_mode: data.payment_mode || null,
        receipt_url: data.receipt_url || null,
        status: data.status || 'paid',
      }
    });

    return NextResponse.json(statement, { status: 201 });
  } catch (error) {
    console.error('Failed to create rental statement:', error);
    return NextResponse.json({ error: 'Failed to create statement' }, { status: 500 });
  }
}
