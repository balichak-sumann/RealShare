import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/firebase-admin';

// Auth helper
async function getUser(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    try {
      const decodedToken = await auth.verifyIdToken(token);
      const profile = await prisma.profile.findUnique({ where: { id: decodedToken.uid } });
      return { uid: decodedToken.uid, isAdmin: profile?.role === 'admin' };
    } catch (e) {
      return null;
    }
  }
  return null;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        images: true,
        developer: true,
        profile: { select: { full_name: true, role: true } },
      }
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    return NextResponse.json(property);
  } catch (error) {
    console.error('Failed to fetch property details:', error);
    return NextResponse.json({ error: 'Failed to fetch property details' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const property = await prisma.property.findUnique({ where: { id } });
    if (!property) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (!user.isAdmin && property.posted_by !== user.uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await request.json();
    if (data.property_type) {
      const allowedCategories = ['Commercial', 'Fractional', 'Residential', 'Holiday', 'Investor'];
      if (!allowedCategories.includes(data.property_type)) {
        return NextResponse.json({ error: `Invalid property_type. Allowed: ${allowedCategories.join(', ')}` }, { status: 400 });
      }
    }

    // Resolve what listing_type and total_fractions would be *after* this
    // update, and enforce the "outright listings always have exactly one
    // fraction" invariant against that final state (covers both changing
    // total_fractions on an outright property and changing listing_type to
    // outright without also setting total_fractions to 1).
    const finalListingType = data.listing_type !== undefined ? data.listing_type : property.listing_type;
    const finalTotalFractions =
      data.total_fractions !== undefined ? Number(data.total_fractions) : property.total_fractions;

    if (finalListingType === 'outright' && finalTotalFractions !== 1) {
      return NextResponse.json(
        { error: 'Outright listings must have total_fractions = 1' },
        { status: 400 }
      );
    }

    // If total_fractions is changing, keep available_fractions consistent:
    // sold_fractions is a historical fact we never rewrite here, so the
    // remaining pool is simply the new total minus what's already sold,
    // clamped so it can never exceed the new total or go negative.
    let newAvailableFractions: number | undefined = undefined;
    if (data.total_fractions !== undefined) {
      const newTotal = Number(data.total_fractions);
      newAvailableFractions = Math.min(newTotal, Math.max(0, newTotal - property.sold_fractions));
    }

    const updated = await prisma.property.update({
      where: { id },
      data: {
        title: data.title,
        locality: data.locality,
        property_type: data.property_type,
        listing_type: data.listing_type !== undefined ? data.listing_type : undefined,
        total_fractions: data.total_fractions !== undefined ? Number(data.total_fractions) : undefined,
        available_fractions: newAvailableFractions,
        price_per_fraction: data.price_per_fraction,
        assured_yield: data.assured_yield,
      }
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getUser(request);
    if (!user || !user.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await request.json();
    const updated = await prisma.property.update({
      where: { id },
      data: { approval_status: data.approval_status }
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to patch' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getUser(request);
    if (!user || !user.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await prisma.property.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
