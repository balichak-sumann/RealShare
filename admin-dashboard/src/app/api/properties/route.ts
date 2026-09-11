import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/firebase-admin';

const ALLOWED_LISTING_TYPES = ['fractional', 'outright', 'rental', 'resale'] as const;
type ListingType = (typeof ALLOWED_LISTING_TYPES)[number];

const ALLOWED_CATEGORIES = ['Commercial', 'Fractional', 'Residential', 'Holiday', 'Investor'] as const;

/**
 * Parses coordinates from Google Maps URLs in various formats:
 * - @lat,lng
 * - ?q=lat,lng or ?query=lat,lng
 * - !3d<lat>!4d<lng>
 * - ?ll=lat,lng
 */
export function parseGoogleMapsCoordinates(url?: string | null): { lat: number; lng: number } | null {
  if (!url || typeof url !== 'string') return null;

  // Match @lat,lng
  const atMatch = url.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (atMatch) {
    const lat = parseFloat(atMatch[1]);
    const lng = parseFloat(atMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
  }

  // Match q=lat,lng or query=lat,lng
  const qMatch = url.match(/[?&](?:q|query)=(-?\d+(?:\.\d+)?)[,%2C]+(-?\d+(?:\.\d+)?)/i);
  if (qMatch) {
    const lat = parseFloat(qMatch[1]);
    const lng = parseFloat(qMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
  }

  // Match !3d<lat>!4d<lng>
  const placeMatch = url.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (placeMatch) {
    const lat = parseFloat(placeMatch[1]);
    const lng = parseFloat(placeMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
  }

  // Match ll=lat,lng
  const llMatch = url.match(/[?&]ll=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (llMatch) {
    const lat = parseFloat(llMatch[1]);
    const lng = parseFloat(llMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
  }

  return null;
}

/**
 * Computes convenience fields (percentage_sold, action, shares_available)
 */
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

/**
 * Best-effort auth check for requests that can be anonymous or authenticated.
 */
async function getAuthContext(request: Request): Promise<{ uid: string; role: string } | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.split('Bearer ')[1];
  try {
    const decoded = await auth.verifyIdToken(token);
    const profile = await prisma.profile.findUnique({ where: { id: decoded.uid }, select: { role: true } });
    return { uid: decoded.uid, role: profile?.role || 'investor' };
  } catch (e) {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get('featured') === 'true';
    const listingType = searchParams.get('listing_type');
    const district = searchParams.get('district');
    const propertyType = searchParams.get('property_type');
    const postedBy = searchParams.get('posted_by');
    const search = searchParams.get('search');

    const authCtx = await getAuthContext(request);
    const isAdmin = authCtx?.role === 'admin';
    const isOwner = postedBy && authCtx?.uid === postedBy;

    const properties = await prisma.property.findMany({
      where: {
        ...(featured ? { featured: true } : {}),
        ...(listingType ? { listing_type: listingType } : {}),
        ...(district ? { district: { contains: district, mode: 'insensitive' } } : {}),
        ...(propertyType ? { property_type: propertyType } : {}),
        ...(postedBy ? { posted_by: postedBy } : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { locality: { contains: search, mode: 'insensitive' } },
                { district: { contains: search, mode: 'insensitive' } },
                { state: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
        // Non-admin callers only see approved listings unless querying their own listings
        ...(isAdmin || isOwner ? {} : { approval_status: 'approved' }),
      },
      include: {
        images: {
          orderBy: [{ is_primary: 'desc' }, { created_at: 'asc' }],
        },
        profile: { select: { full_name: true, role: true, avatar_url: true } },
        developer: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    const enriched = properties.map(attachComputedFields);
    return NextResponse.json(enriched);
  } catch (error) {
    console.error('Failed to fetch properties:', error);
    return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Require a valid authenticated user
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Bearer token required' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    let userId: string;
    let userRole = 'investor';
    try {
      const decodedToken = await auth.verifyIdToken(token);
      userId = decodedToken.uid;

      const profile = await prisma.profile.findUnique({ where: { id: userId }, select: { role: true } });
      userRole = (profile?.role || '').toLowerCase();
    } catch (e) {
      console.error('Invalid token', e);
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // Role-based authorization: only admin, agent, and builder can create properties
    if (!['admin', 'agent', 'builder'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden: Only admins, agents, and builders can list properties.' },
        { status: 403 }
      );
    }
    const isAdmin = userRole === 'admin';

    const data = await request.json();

    // Field validations
    if (!data.title || typeof data.title !== 'string' || data.title.trim().length < 3) {
      return NextResponse.json({ error: 'Title is required and must be at least 3 characters.' }, { status: 400 });
    }

    if (!data.description || typeof data.description !== 'string' || data.description.trim().length < 5) {
      return NextResponse.json({ error: 'Description is required and must be at least 5 characters.' }, { status: 400 });
    }

    const pType = data.property_type ? ALLOWED_CATEGORIES.find(c => c.toLowerCase() === String(data.property_type).trim().toLowerCase()) : undefined;
    if (!pType) {
      return NextResponse.json(
        { error: `Invalid category. Allowed: ${ALLOWED_CATEGORIES.join(', ')}` },
        { status: 400 }
      );
    }
    data.property_type = pType;

    const listingType: ListingType = data.listing_type ?? 'fractional';
    if (!ALLOWED_LISTING_TYPES.includes(listingType)) {
      return NextResponse.json(
        { error: `Invalid listing_type. Allowed: ${ALLOWED_LISTING_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Area sqft validation
    const areaSqft = data.area_sqft !== undefined && data.area_sqft !== null ? Number(data.area_sqft) : null;
    if (areaSqft !== null && (isNaN(areaSqft) || areaSqft <= 0)) {
      return NextResponse.json({ error: 'area_sqft must be a positive number.' }, { status: 400 });
    }

    const areaSqftMax = data.area_sqft_max !== undefined && data.area_sqft_max !== null ? Number(data.area_sqft_max) : null;
    if (areaSqftMax !== null && (isNaN(areaSqftMax) || areaSqftMax <= 0)) {
      return NextResponse.json({ error: 'area_sqft_max must be a positive number.' }, { status: 400 });
    }

    // Financial calculations and validations
    const isSingleUnit = listingType !== 'fractional';
    let totalFractions = 1;
    let availableFractions = 1;
    let pricePerFraction = Number(data.price_per_fraction);

    if (isNaN(pricePerFraction) || pricePerFraction < 0) {
      return NextResponse.json({ error: 'Price must be a positive number or 0.' }, { status: 400 });
    }

    if (!isSingleUnit) {
      totalFractions = parseInt(data.total_fractions, 10);
      if (isNaN(totalFractions) || totalFractions < 1) {
        return NextResponse.json({ error: 'total_fractions must be an integer >= 1 for fractional listings.' }, { status: 400 });
      }
      availableFractions = data.available_fractions !== undefined
        ? Math.min(totalFractions, Math.max(0, parseInt(data.available_fractions, 10)))
        : totalFractions;
    }

    // Location coordinates extraction
    let lat = data.lat !== undefined && data.lat !== null && data.lat !== '' ? Number(data.lat) : null;
    let lng = data.lng !== undefined && data.lng !== null && data.lng !== '' ? Number(data.lng) : null;

    if ((lat === null || lng === null) && data.google_maps_url) {
      const parsedCoords = parseGoogleMapsCoordinates(data.google_maps_url);
      if (parsedCoords) {
        lat = parsedCoords.lat;
        lng = parsedCoords.lng;
      }
    }

    // Collect image URLs
    let imageUrls: string[] = [];
    if (Array.isArray(data.image_urls) && data.image_urls.length > 0) {
      imageUrls = data.image_urls.filter((u: any) => typeof u === 'string' && u.trim().length > 0);
    } else if (data.image_url && typeof data.image_url === 'string') {
      imageUrls = [data.image_url.trim()];
    }

    // Create property + images in database transaction
    const property = await prisma.$transaction(async (tx) => {
      const created = await tx.property.create({
        data: {
          title: data.title.trim(),
          short_description: data.short_description ? data.short_description.trim() : null,
          description: data.description.trim(),
          property_type: data.property_type,
          listing_type: listingType,
          sub_type: data.sub_type || null,
          total_fractions: totalFractions,
          available_fractions: availableFractions,
          sold_fractions: 0,
          price_per_fraction: pricePerFraction,
          booking_amount: data.booking_amount ? Number(data.booking_amount) : 50000,
          assured_yield: data.assured_yield ? Number(data.assured_yield) : null,
          target_irr: data.target_irr ? Number(data.target_irr) : null,
          state: data.state || 'Maharashtra',
          district: data.district || 'Mumbai',
          locality: data.locality || '',
          full_address: data.full_address || null,
          lat: lat !== null && !isNaN(lat) ? lat : null,
          lng: lng !== null && !isNaN(lng) ? lng : null,
          video_url: data.video_url || null,
          brochure_url: data.brochure_url || null,
          area_sqft: areaSqft !== null ? areaSqft : null,
          area_sqft_max: areaSqftMax !== null ? areaSqftMax : null,
          area_unit: data.area_unit || 'sqft',
          rera_number: data.rera_number || null,
          permission_number: data.permission_number || null,
          google_maps_url: data.google_maps_url || null,
          featured: data.featured || false,
          posted_by: userId,
          developer_id: data.developer_id || null,
          approval_status: isAdmin ? 'approved' : 'pending_approval',
          // Residential fields
          floor_type: data.floor_type || null,
          bedrooms: data.bedrooms ? Number(data.bedrooms) : null,
          bathrooms: data.bathrooms ? Number(data.bathrooms) : null,
          flooring: data.flooring || null,
          kitchen_type: data.kitchen_type || null,
          parking_count: data.parking_count ? Number(data.parking_count) : null,
          club_house: data.club_house !== undefined ? Boolean(data.club_house) : null,
          amenities: data.amenities || null,
          // Commercial fields
          furnished: data.furnished !== undefined ? Boolean(data.furnished) : undefined,
          plug_and_play: data.plug_and_play !== undefined ? Boolean(data.plug_and_play) : undefined,
          central_ac: data.central_ac !== undefined ? Boolean(data.central_ac) : undefined,
          preleased: data.preleased !== undefined ? Boolean(data.preleased) : undefined,
          maintenance_avail: data.maintenance_avail !== undefined ? Boolean(data.maintenance_avail) : undefined,
          food_courts: data.food_courts !== undefined ? Boolean(data.food_courts) : undefined,
          // Plot / Farm fields
          fencing: data.fencing !== undefined ? Boolean(data.fencing) : undefined,
          electricity_avail: data.electricity_avail !== undefined ? Boolean(data.electricity_avail) : undefined,
          farm_shed: data.farm_shed !== undefined ? Boolean(data.farm_shed) : undefined,
          bore_wells: data.bore_wells !== undefined ? Boolean(data.bore_wells) : undefined,
          plants_available: data.plants_available !== undefined ? Boolean(data.plants_available) : undefined,
          loan_availability: data.loan_availability !== undefined ? Boolean(data.loan_availability) : undefined,
          land_registered: data.land_registered !== undefined ? Boolean(data.land_registered) : undefined,
          pass_book: data.pass_book !== undefined ? Boolean(data.pass_book) : undefined,
          raithu_bharosa: data.raithu_bharosa !== undefined ? Boolean(data.raithu_bharosa) : undefined,
          approach_road: data.approach_road !== undefined ? data.approach_road : undefined,
          under_irrigation: data.under_irrigation !== undefined ? Boolean(data.under_irrigation) : undefined,
          ownership_type: data.ownership_type !== undefined ? data.ownership_type : undefined,
        },
      });

      if (imageUrls.length > 0) {
        await tx.propertyImage.createMany({
          data: imageUrls.map((url, idx) => ({
            property_id: created.id,
            image_url: url,
            is_primary: idx === 0,
          })),
        });
      }

      return await tx.property.findUnique({
        where: { id: created.id },
        include: {
          images: {
            orderBy: [{ is_primary: 'desc' }, { created_at: 'asc' }],
          },
          developer: true,
          profile: { select: { full_name: true, role: true, avatar_url: true } },
        },
      });
    });

    if (!property) {
      throw new Error('Failed to retrieve created property');
    }

    return NextResponse.json(attachComputedFields(property), { status: 201 });
  } catch (error: any) {
    console.error('Failed to create property:', error);
    return NextResponse.json({ error: error.message || 'Failed to create property', details: error.toString() }, { status: 500 });
  }
}

