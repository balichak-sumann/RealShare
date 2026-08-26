import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/firebase-admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get('featured') === 'true';

    const properties = await prisma.property.findMany({
      where: featured ? { featured: true } : undefined,
      include: {
        images: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return NextResponse.json(properties);
  } catch (error) {
    console.error('Failed to fetch properties:', error);
    return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    let userId: string | null = null;
    let isAdmin = false;

    // Check auth
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      if (token === 'MOCK_TOKEN') {
        userId = 'mock-user-123';
      } else {
        try {
          const decodedToken = await auth.verifyIdToken(token);
          userId = decodedToken.uid;
          
          // Check if admin
          const profile = await prisma.profile.findUnique({ where: { id: userId } });
          if (profile?.role === 'admin') isAdmin = true;
        } catch (e) {
          console.error('Invalid token', e);
        }
      }
    }

    const data = await request.json();
    
    // Quick validation
    if (!data.title || !data.property_type || !data.price_per_fraction) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const property = await prisma.property.create({
      data: {
        title: data.title,
        description: data.description || '',
        property_type: data.property_type,
        total_fractions: data.total_fractions,
        available_fractions: data.available_fractions,
        price_per_fraction: data.price_per_fraction,
        booking_amount: data.booking_amount || 50000,
        assured_yield: data.assured_yield,
        target_irr: data.target_irr,
        state: data.state,
        district: data.district,
        locality: data.locality,
        featured: data.featured || false,
        posted_by: userId,
        approval_status: isAdmin ? 'approved' : 'pending_approval',
        images: data.image_url ? {
          create: {
            image_url: data.image_url,
            is_primary: true
          }
        } : undefined
      },
      include: {
        images: true
      }
    });

    return NextResponse.json(property, { status: 201 });
  } catch (error) {
    console.error('Failed to create property:', error);
    return NextResponse.json({ error: 'Failed to create property' }, { status: 500 });
  }
}
