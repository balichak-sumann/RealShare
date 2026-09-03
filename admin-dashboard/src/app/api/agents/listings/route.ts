import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/firebase-admin';

// GET /api/agents/listings — Fetch all listings posted by this agent
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const agentId = decodedToken.uid;

    const listings = await prisma.property.findMany({
      where: {
        posted_by: agentId,
      },
      include: {
        images: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return NextResponse.json(listings);
  } catch (error) {
    console.error('Failed to fetch agent listings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/agents/listings — Create a new listing on behalf of this agent
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    // Agent id always comes from the verified token, never from the request
    // body, so an agent can't post a listing under someone else's id.
    const agentId = decodedToken.uid;

    const profile = await prisma.profile.findUnique({ where: { id: agentId } });
    if (!profile || profile.role !== 'agent') {
      return NextResponse.json({ error: 'Only agents can create listings here' }, { status: 403 });
    }

    const data = await request.json();

    if (!data.title || !data.property_type || !data.price_per_fraction) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const allowedCategories = ['Commercial', 'Fractional', 'Residential', 'Holiday', 'Investor'];
    if (!allowedCategories.includes(data.property_type)) {
      return NextResponse.json({ error: `Invalid property_type. Allowed: ${allowedCategories.join(', ')}` }, { status: 400 });
    }

    // Outright listings are modeled as a single "fraction" = 100% ownership,
    // matching src/app/api/properties/route.ts's POST handler.
    const listingType = data.listing_type === 'outright' ? 'outright' : 'fractional';
    const totalFractions = listingType === 'outright' ? 1 : data.total_fractions;
    const availableFractions = listingType === 'outright' ? 1 : data.available_fractions;

    const property = await prisma.property.create({
      data: {
        title: data.title,
        description: data.description || '',
        property_type: data.property_type,
        listing_type: listingType,
        total_fractions: totalFractions,
        available_fractions: availableFractions,
        price_per_fraction: data.price_per_fraction,
        booking_amount: data.booking_amount || 50000,
        assured_yield: data.assured_yield,
        target_irr: data.target_irr,
        state: data.state,
        district: data.district,
        locality: data.locality,
        full_address: data.full_address,
        featured: false,
        posted_by: agentId,
        developer_id: data.developer_id || null,
        // Agent-created listings always need admin review before going live.
        approval_status: 'pending_approval',
        images: Array.isArray(data.images) && data.images.length > 0
          ? {
              create: data.images.map((url: string, idx: number) => ({
                image_url: url,
                is_primary: idx === 0,
              })),
            }
          : data.image_url
          ? { create: { image_url: data.image_url, is_primary: true } }
          : undefined,
      },
      include: {
        images: true,
      },
    });

    return NextResponse.json(property, { status: 201 });
  } catch (error) {
    console.error('Failed to create agent listing:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/agents/listings?id=xxx — Withdraw a pending listing
export async function DELETE(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const agentId = decodedToken.uid;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('id');

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID required' }, { status: 400 });
    }

    // Make sure this property belongs to the agent and is still pending
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        posted_by: agentId,
        approval_status: { in: ['draft', 'pending_approval'] },
      },
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found or cannot be withdrawn' }, { status: 404 });
    }

    await prisma.property.delete({
      where: { id: propertyId },
    });

    return NextResponse.json({ message: 'Listing withdrawn successfully' });
  } catch (error) {
    console.error('Failed to withdraw listing:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH /api/agents/listings — Edit a pending listing
export async function PATCH(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const agentId = decodedToken.uid;

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Property ID required' }, { status: 400 });
    }

    // Make sure this property belongs to the agent and is still pending
    const property = await prisma.property.findFirst({
      where: {
        id,
        posted_by: agentId,
        approval_status: { in: ['draft', 'pending_approval'] },
      },
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found or cannot be edited after approval' }, { status: 404 });
    }

    const updated = await prisma.property.update({
      where: { id },
      data: {
        title: updateData.title,
        description: updateData.description,
        property_type: updateData.property_type,
        total_fractions: updateData.total_fractions,
        available_fractions: updateData.available_fractions,
        price_per_fraction: updateData.price_per_fraction,
        assured_yield: updateData.assured_yield,
        target_irr: updateData.target_irr,
        state: updateData.state,
        district: updateData.district,
        locality: updateData.locality,
        full_address: updateData.full_address,
      },
      include: { images: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update listing:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
