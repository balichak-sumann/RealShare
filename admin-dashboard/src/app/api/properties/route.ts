import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/firebase-admin';

const ALLOWED_LISTING_TYPES = ['fractional', 'outright', 'rental', 'resale'] as const;
type ListingType = (typeof ALLOWED_LISTING_TYPES)[number];

/**
 * Best-effort admin check for a request that is allowed to be anonymous
 * (unlike requireAuth/requireAdmin, this never returns a 401/403 response -
 * an invalid or missing token just means "treat as a public caller").
 */
async function isAuthenticatedAdmin(request: Request): Promise<boolean> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;

  const token = authHeader.split('Bearer ')[1];
  try {
    const decoded = await auth.verifyIdToken(token);
    const profile = await prisma.profile.findUnique({ where: { id: decoded.uid }, select: { role: true } });
    return profile?.role === 'admin';
  } catch (e) {
    return false;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get('featured') === 'true';
    const listingType = searchParams.get('listing_type');
    const district = searchParams.get('district');
    const propertyType = searchParams.get('property_type');

    const admin = await isAuthenticatedAdmin(request);

    const properties = await prisma.property.findMany({
      where: {
        ...(featured ? { featured: true } : {}),
        ...(listingType ? { listing_type: listingType } : {}),
        ...(district ? { district } : {}),
        ...(propertyType ? { property_type: propertyType } : {}),
        // Non-admin callers (including the public mobile app) only ever see
        // approved listings. Admins can see every status for the admin
        // properties page.
        ...(admin ? {} : { approval_status: 'approved' }),
      },
      include: {
        images: true,
        profile: { select: { full_name: true, role: true } },
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
    // Require a valid authenticated user to create a property.
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    let userId: string;
    let isAdmin = false;
    try {
      const decodedToken = await auth.verifyIdToken(token);
      userId = decodedToken.uid;

      const profile = await prisma.profile.findUnique({ where: { id: userId } });
      if (profile?.role === 'admin') isAdmin = true;
    } catch (e) {
      console.error('Invalid token', e);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const data = await request.json();

    // Quick validation
    if (!data.title || !data.property_type || !data.price_per_fraction) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const allowedCategories = ['Commercial', 'Fractional', 'Residential', 'Holiday', 'Investor'];
    if (!allowedCategories.includes(data.property_type)) {
      return NextResponse.json({ error: `Invalid property_type. Allowed: ${allowedCategories.join(', ')}` }, { status: 400 });
    }

    const listingType: ListingType = data.listing_type ?? 'fractional';
    if (!ALLOWED_LISTING_TYPES.includes(listingType)) {
      return NextResponse.json(
        { error: `Invalid listing_type. Allowed: ${ALLOWED_LISTING_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Outright listings are modeled as a single "fraction" = 100% ownership,
    // so every existing Investment/Transaction/AgentCommission calculation
    // (fractions_bought, ownership_percentage) keeps working unmodified.
    // Rental/resale are also whole-unit listings (no fractional share pool),
    // so they get the same single-unit treatment - only 'fractional' keeps
    // a real share pool. The listing_type value itself is preserved as-is
    // in every case (never collapsed to 'fractional').
    const isSingleUnit = listingType !== 'fractional';
    const totalFractions = isSingleUnit ? 1 : data.total_fractions;
    const availableFractions = isSingleUnit ? 1 : data.available_fractions;

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
        featured: data.featured || false,
        posted_by: userId,
        developer_id: data.developer_id || null,
        approval_status: isAdmin ? 'approved' : 'pending_approval',
        images: data.image_url ? {
          create: {
            image_url: data.image_url,
            is_primary: true
          }
        } : undefined
      },
      include: {
        images: true,
        developer: true,
      }
    });

    return NextResponse.json(property, { status: 201 });
  } catch (error) {
    console.error('Failed to create property:', error);
    return NextResponse.json({ error: 'Failed to create property' }, { status: 500 });
  }
}
