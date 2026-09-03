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

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = await getUser(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        documents: true,
        rental_agreements: {
          include: {
            statements: true
          }
        }
      }
    });

    if (!asset) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (asset.user_id !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    return NextResponse.json(asset);
  } catch (error) {
    console.error('Failed to fetch asset:', error);
    return NextResponse.json({ error: 'Failed to fetch asset' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = await getUser(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (asset.user_id !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const data = await request.json();
    const updated = await prisma.asset.update({
      where: { id },
      data: {
        title: data.title,
        property_type: data.property_type,
        address: data.address,
        purchase_price: data.purchase_price,
        purchase_date: data.purchase_date ? new Date(data.purchase_date) : null,
        status: data.status,
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update asset:', error);
    return NextResponse.json({ error: 'Failed to update asset' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = await getUser(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (asset.user_id !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await prisma.asset.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete asset:', error);
    return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 });
  }
}
