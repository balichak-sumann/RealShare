import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/firebase-admin';
import { parseGoogleMapsCoordinates } from '../route';
import { deletePropertyWithRelations } from '@/lib/delete-cascade';

// Auth helper
async function getUser(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    try {
      const decodedToken = await auth.verifyIdToken(token);
      const profile = await prisma.profile.findUnique({ where: { id: decodedToken.uid } });
      return { uid: decodedToken.uid, role: profile?.role?.toLowerCase() || 'investor', isAdmin: profile?.role === 'admin' };
    } catch (e) {
      return null;
    }
  }
  return null;
}

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

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    const property = await prisma.property.update({
      where: { id },
      data: {
        views_count: { increment: 1 },
      },
      include: {
        images: {
          orderBy: [{ is_primary: 'desc' }, { created_at: 'asc' }],
        },
        developer: true,
        profile: { select: { full_name: true, role: true, avatar_url: true, phone_number: true, email: true } },
      },
    }).catch(async () => {
      // Fallback to findUnique if update fails (e.g. read-only context)
      return await prisma.property.findUnique({
        where: { id },
        include: {
          images: {
            orderBy: [{ is_primary: 'desc' }, { created_at: 'asc' }],
          },
          developer: true,
          profile: { select: { full_name: true, role: true, avatar_url: true, phone_number: true, email: true } },
        },
      });
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    return NextResponse.json(attachComputedFields(property));
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
      const pType = allowedCategories.find(c => c.toLowerCase() === String(data.property_type).trim().toLowerCase());
      if (!pType) {
        console.error('INVALID PROPERTY TYPE RECEIVED:', data.property_type, typeof data.property_type);
        return NextResponse.json({ error: `Invalid property_type. Allowed: ${allowedCategories.join(', ')}` }, { status: 400 });
      }
      data.property_type = pType;
    }

    const finalListingType = data.listing_type !== undefined ? data.listing_type : property.listing_type;
    const isSingleUnit = finalListingType !== 'fractional';

    let newTotalFractions = property.total_fractions;
    let newAvailableFractions = property.available_fractions;

    if (isSingleUnit) {
      newTotalFractions = 1;
      newAvailableFractions = 1;
    } else if (data.total_fractions !== undefined) {
      newTotalFractions = Number(data.total_fractions);
      if (isNaN(newTotalFractions) || newTotalFractions < 1) {
        return NextResponse.json({ error: 'total_fractions must be >= 1' }, { status: 400 });
      }
      newAvailableFractions = Math.min(newTotalFractions, Math.max(0, newTotalFractions - property.sold_fractions));
    }

    // Handle coordinates & Google Maps URL
    let lat = data.lat !== undefined ? (data.lat !== null && data.lat !== '' ? Number(data.lat) : null) : undefined;
    let lng = data.lng !== undefined ? (data.lng !== null && data.lng !== '' ? Number(data.lng) : null) : undefined;
    const googleMapsUrl = data.google_maps_url !== undefined ? data.google_maps_url : property.google_maps_url;

    if ((lat === undefined || lat === null) && (lng === undefined || lng === null) && googleMapsUrl) {
      const coords = parseGoogleMapsCoordinates(googleMapsUrl);
      if (coords) {
        lat = coords.lat;
        lng = coords.lng;
      }
    }

    const areaSqft = data.area_sqft !== undefined ? (data.area_sqft !== null && data.area_sqft !== '' ? Number(data.area_sqft) : null) : undefined;

    const updated = await prisma.property.update({
      where: { id },
      data: {
        title: data.title !== undefined ? data.title : undefined,
        short_description: data.short_description !== undefined ? data.short_description : undefined,
        description: data.description !== undefined ? data.description : undefined,
        property_type: data.property_type !== undefined ? data.property_type : undefined,
        listing_type: data.listing_type !== undefined ? data.listing_type : undefined,
        sub_type: data.sub_type !== undefined ? data.sub_type : undefined,
        total_fractions: newTotalFractions,
        available_fractions: newAvailableFractions,
        price_per_fraction: data.price_per_fraction !== undefined ? Number(data.price_per_fraction) : undefined,
        booking_amount: data.booking_amount !== undefined ? Number(data.booking_amount) : undefined,
        assured_yield: data.assured_yield !== undefined ? (data.assured_yield ? Number(data.assured_yield) : null) : undefined,
        target_irr: data.target_irr !== undefined ? (data.target_irr ? Number(data.target_irr) : null) : undefined,
        state: data.state !== undefined ? data.state : undefined,
        district: data.district !== undefined ? data.district : undefined,
        locality: data.locality !== undefined ? data.locality : undefined,
        full_address: data.full_address !== undefined ? data.full_address : undefined,
        lat: lat !== undefined ? lat : undefined,
        lng: lng !== undefined ? lng : undefined,
        video_url: data.video_url !== undefined ? data.video_url : undefined,
        brochure_url: data.brochure_url !== undefined ? data.brochure_url : undefined,
        area_sqft: areaSqft !== undefined ? areaSqft : undefined,
        area_unit: data.area_unit !== undefined ? data.area_unit : undefined,
        google_maps_url: googleMapsUrl,
        featured: data.featured !== undefined ? data.featured : undefined,
        developer_id: data.developer_id !== undefined ? data.developer_id : undefined,
        // Residential fields
        floor_type: data.floor_type !== undefined ? data.floor_type : undefined,
        bedrooms: data.bedrooms !== undefined ? (data.bedrooms ? Number(data.bedrooms) : null) : undefined,
        bathrooms: data.bathrooms !== undefined ? (data.bathrooms ? Number(data.bathrooms) : null) : undefined,
        flooring: data.flooring !== undefined ? data.flooring : undefined,
        kitchen_type: data.kitchen_type !== undefined ? data.kitchen_type : undefined,
        parking_count: data.parking_count !== undefined ? (data.parking_count ? Number(data.parking_count) : null) : undefined,
        club_house: data.club_house !== undefined ? Boolean(data.club_house) : undefined,
        amenities: data.amenities !== undefined ? data.amenities : undefined,
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
      include: {
        images: {
          orderBy: [{ is_primary: 'desc' }, { created_at: 'asc' }],
        },
        developer: true,
        profile: { select: { full_name: true, role: true, avatar_url: true } },
      },
    });

    return NextResponse.json(attachComputedFields(updated));
  } catch (error: any) {
    console.error('Failed to update property:', error);
    return NextResponse.json({ error: error.message || 'Failed to update' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getUser(request);
    if (!user || !user.isAdmin) return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });

    const data = await request.json();
    
    // If reverting from sold out to live
    if (data.is_sold_out === false) {
      const prop = await prisma.property.findUnique({ where: { id } });
      if (prop) {
        data.sold_fractions = 0;
        data.available_fractions = prop.total_fractions;
        
        // Cancel investments so they are removed from investor profiles without deleting records
        await prisma.investment.updateMany({
          where: { property_id: id, status: 'completed' },
          data: { status: 'cancelled' }
        });
      }
    }

    const updated = await prisma.property.update({
      where: { id },
      data: {
        approval_status: data.approval_status !== undefined ? data.approval_status : undefined,
        rejection_notes: data.rejection_notes !== undefined ? data.rejection_notes : undefined,
        featured: data.featured !== undefined ? data.featured : undefined,
        is_sold_out: data.is_sold_out !== undefined ? data.is_sold_out : undefined,
        sold_fractions: data.sold_fractions !== undefined ? data.sold_fractions : undefined,
        available_fractions: data.available_fractions !== undefined ? data.available_fractions : undefined,
      },
      include: {
        images: {
          orderBy: [{ is_primary: 'desc' }, { created_at: 'asc' }],
        },
        developer: true,
        profile: { select: { full_name: true, role: true } },
      },
    });
    return NextResponse.json(attachComputedFields(updated));
  } catch (error) {
    console.error('Failed to patch property:', error);
    return NextResponse.json({ error: 'Failed to patch property' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const property = await prisma.property.findUnique({ where: { id } });
    if (!property) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (!user.isAdmin && property.posted_by !== user.uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await deletePropertyWithRelations(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete property:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete property' }, { status: 500 });
  }
}

