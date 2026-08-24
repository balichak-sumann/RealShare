import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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
      },
    });

    return NextResponse.json(property, { status: 201 });
  } catch (error) {
    console.error('Failed to create property:', error);
    return NextResponse.json({ error: 'Failed to create property' }, { status: 500 });
  }
}
