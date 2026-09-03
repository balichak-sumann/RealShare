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

export async function GET(request: Request) {
  try {
    const userId = await getUser(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const assets = await prisma.asset.findMany({
      where: { user_id: userId },
      include: {
        documents: true,
        rental_agreements: {
          include: {
            statements: true
          }
        }
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return NextResponse.json(assets);
  } catch (error) {
    console.error('Failed to fetch assets:', error);
    return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUser(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await request.json();
    
    if (!data.title || !data.property_type || !data.address) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const asset = await prisma.asset.create({
      data: {
        user_id: userId,
        title: data.title,
        property_type: data.property_type,
        address: data.address,
        purchase_price: data.purchase_price || null,
        purchase_date: data.purchase_date ? new Date(data.purchase_date) : null,
        status: data.status || 'active',
      }
    });

    return NextResponse.json(asset, { status: 201 });
  } catch (error) {
    console.error('Failed to create asset:', error);
    return NextResponse.json({ error: 'Failed to create asset' }, { status: 500 });
  }
}
