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

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = await getUser(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (asset.user_id !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const data = await request.json();
    if (!data.tenant_name || !data.start_date || !data.end_date || !data.monthly_rent || !data.security_deposit) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const agreement = await prisma.rentalAgreement.create({
      data: {
        asset_id: id,
        tenant_name: data.tenant_name,
        tenant_phone: data.tenant_phone || null,
        start_date: new Date(data.start_date),
        end_date: new Date(data.end_date),
        monthly_rent: data.monthly_rent,
        security_deposit: data.security_deposit,
        status: data.status || 'active',
      }
    });

    return NextResponse.json(agreement, { status: 201 });
  } catch (error) {
    console.error('Failed to create rental agreement:', error);
    return NextResponse.json({ error: 'Failed to create agreement' }, { status: 500 });
  }
}
