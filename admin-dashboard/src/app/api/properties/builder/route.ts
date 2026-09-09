import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/firebase-admin';

function attachComputedFields(property: any) {
  const total = property.total_fractions || 1;
  const available = property.available_fractions ?? total;
  const sold = property.sold_fractions ?? (total - available);
  const percentageSold = Math.min(100, Math.max(0, Math.round((sold / total) * 100)));
  const action = property.listing_type === 'fractional' ? 'INVEST' : 'BUY';

  return {
    ...property,
    shares_available: available,
    percentage_sold: percentageSold,
    action,
  };
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Bearer token required' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const properties = await prisma.property.findMany({
      where: {
        posted_by: userId,
      },
      include: {
        images: {
          orderBy: [{ is_primary: 'desc' }, { created_at: 'asc' }],
        },
        developer: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return NextResponse.json(properties.map(attachComputedFields));
  } catch (error) {
    console.error('Failed to fetch builder properties:', error);
    return NextResponse.json({ error: 'Failed to fetch builder properties' }, { status: 500 });
  }
}

