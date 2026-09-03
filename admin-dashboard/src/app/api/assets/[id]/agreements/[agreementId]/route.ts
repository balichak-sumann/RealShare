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
async function getOwnedAgreement(agreementId: string, userId: string) {
  const agreement = await prisma.rentalAgreement.findUnique({
    where: { id: agreementId },
    include: { asset: true },
  });
  if (!agreement) return { error: NextResponse.json({ error: 'Not found' }, { status: 404 }) };
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

    const { agreement, error } = await getOwnedAgreement(agreementId, userId);
    if (error) return error;
    if (agreement!.asset_id !== id) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const { asset, ...rest } = agreement!;
    return NextResponse.json(rest);
  } catch (error) {
    console.error('Failed to fetch rental agreement:', error);
    return NextResponse.json({ error: 'Failed to fetch agreement' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string; agreementId: string }> }) {
  try {
    const { id, agreementId } = await params;
    const userId = await getUser(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { agreement, error } = await getOwnedAgreement(agreementId, userId);
    if (error) return error;
    if (agreement!.asset_id !== id) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const data = await request.json();

    const startDate = data.start_date ? new Date(data.start_date) : agreement!.start_date;
    const endDate = data.end_date ? new Date(data.end_date) : agreement!.end_date;
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: 'Invalid start_date or end_date' }, { status: 400 });
    }
    if (endDate <= startDate) {
      return NextResponse.json({ error: 'end_date must be after start_date' }, { status: 400 });
    }

    const monthlyRent = data.monthly_rent !== undefined ? Number(data.monthly_rent) : Number(agreement!.monthly_rent);
    if (!Number.isFinite(monthlyRent) || monthlyRent <= 0) {
      return NextResponse.json({ error: 'monthly_rent must be greater than 0' }, { status: 400 });
    }
    const securityDeposit = data.security_deposit !== undefined ? Number(data.security_deposit) : Number(agreement!.security_deposit);
    if (!Number.isFinite(securityDeposit) || securityDeposit < 0) {
      return NextResponse.json({ error: 'security_deposit must not be negative' }, { status: 400 });
    }

    if (data.status !== undefined && !['active', 'terminated'].includes(data.status)) {
      return NextResponse.json({ error: "status must be 'active' or 'terminated'" }, { status: 400 });
    }

    const updated = await prisma.rentalAgreement.update({
      where: { id: agreementId },
      data: {
        tenant_name: data.tenant_name !== undefined ? data.tenant_name : agreement!.tenant_name,
        tenant_phone: data.tenant_phone !== undefined ? data.tenant_phone : agreement!.tenant_phone,
        start_date: startDate,
        end_date: endDate,
        monthly_rent: monthlyRent,
        security_deposit: securityDeposit,
        status: data.status !== undefined ? data.status : agreement!.status,
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update rental agreement:', error);
    return NextResponse.json({ error: 'Failed to update agreement' }, { status: 500 });
  }
}

/** Status-only update, e.g. { status: 'terminated' } — the preferred way to close out a tenancy. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; agreementId: string }> }) {
  try {
    const { id, agreementId } = await params;
    const userId = await getUser(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { agreement, error } = await getOwnedAgreement(agreementId, userId);
    if (error) return error;
    if (agreement!.asset_id !== id) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const data = await request.json();
    if (!data.status || !['active', 'terminated'].includes(data.status)) {
      return NextResponse.json({ error: "status must be 'active' or 'terminated'" }, { status: 400 });
    }

    const updated = await prisma.rentalAgreement.update({
      where: { id: agreementId },
      data: { status: data.status },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update rental agreement status:', error);
    return NextResponse.json({ error: 'Failed to update agreement status' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string; agreementId: string }> }) {
  try {
    const { id, agreementId } = await params;
    const userId = await getUser(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { agreement, error } = await getOwnedAgreement(agreementId, userId);
    if (error) return error;
    if (agreement!.asset_id !== id) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await prisma.rentalAgreement.delete({ where: { id: agreementId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete rental agreement:', error);
    return NextResponse.json({ error: 'Failed to delete agreement' }, { status: 500 });
  }
}
