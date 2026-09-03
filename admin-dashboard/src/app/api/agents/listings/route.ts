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
