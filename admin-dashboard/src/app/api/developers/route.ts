import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const [developers, builderProfiles] = await Promise.all([
      prisma.developer.findMany({
        include: {
          _count: { select: { properties: true } },
          properties: { select: { id: true, title: true, approval_status: true } },
        },
        orderBy: { created_at: 'desc' },
      }),
      prisma.profile.findMany({
        where: { role: { in: ['builder', 'developer'] } },
        include: {
          posted_properties: { select: { id: true, title: true, approval_status: true } },
        },
        orderBy: { created_at: 'desc' },
      }),
    ]);

    // Avoid duplicate entries if a developer entity has the same name as a builder profile
    const devNames = new Set(developers.map((d) => d.name.toLowerCase()));

    const unifiedList = [
      ...developers.map((d) => ({
        id: d.id,
        name: d.name,
        logo_url: d.logo_url,
        bio: d.bio,
        rating: Number(d.rating),
        established_year: d.established_year,
        rera_registered: d.rera_registered,
        type: 'firm',
        is_approved: true,
        _count: { properties: d._count.properties },
        properties: d.properties,
        created_at: d.created_at,
      })),
      ...builderProfiles
        .filter((b) => {
          const name = (b.full_name || '').toLowerCase();
          return !devNames.has(name);
        })
        .map((b) => ({
          id: b.id,
          name: b.full_name || b.email?.split('@')[0] || 'Registered Builder',
          email: b.email,
          phone_number: b.phone_number,
          logo_url: b.avatar_url,
          bio: `Registered Builder Account • ${b.email || b.phone_number || ''}`,
          rating: 4.5,
          established_year: new Date(b.created_at).getFullYear(),
          rera_registered: b.kyc_status === 'verified',
          type: 'account',
          is_approved: b.is_approved ?? true,
          _count: { properties: b.posted_properties.length },
          properties: b.posted_properties,
          created_at: b.created_at,
        })),
    ];

    return NextResponse.json(unifiedList);
  } catch (error) {
    console.error('Failed to fetch developers:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];

    let isAdmin = false;
    const decodedToken = await auth.verifyIdToken(token);
    const adminProfile = await prisma.profile.findUnique({ where: { id: decodedToken.uid } });
    isAdmin = adminProfile?.role === 'admin';

    if (!isAdmin) {
      return NextResponse.json({ error: 'Only admins can add developers' }, { status: 403 });
    }

    const data = await request.json();
    if (!data.name || !data.phone_number) {
      return NextResponse.json({ error: 'Developer name and mobile number are required' }, { status: 400 });
    }

    let formattedPhone = data.phone_number.trim();
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = `+91${formattedPhone}`; // Default to India
    }

    let uid = "";
    try {
      // Check if user already exists
      const userRecord = await auth.getUserByPhoneNumber(formattedPhone);
      uid = userRecord.uid;
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') {
        // Create new user
        const newUser = await auth.createUser({
          phoneNumber: formattedPhone,
          displayName: data.name,
          email: data.email || undefined,
        });
        uid = newUser.uid;
      } else {
        throw e;
      }
    }

    // Create or update Profile in Postgres
    const profile = await prisma.profile.upsert({
      where: { id: uid },
      update: {
        role: 'builder',
        full_name: data.name,
        email: data.email || null,
        phone_number: formattedPhone,
        company_name: data.company_name || data.name,
        office_address: data.office_address || null,
        website: data.website || null,
        rera_number: data.rera_number || null,
        credai_member: data.credai_member || false,
        company_pan: data.company_pan || null,
        company_gst: data.company_gst || null,
        bio: data.bio || `Registered Builder Account • ${formattedPhone}`,
        is_approved: true,
      },
      create: {
        id: uid,
        role: 'builder',
        full_name: data.name,
        email: data.email || null,
        phone_number: formattedPhone,
        company_name: data.company_name || data.name,
        office_address: data.office_address || null,
        website: data.website || null,
        rera_number: data.rera_number || null,
        credai_member: data.credai_member || false,
        company_pan: data.company_pan || null,
        company_gst: data.company_gst || null,
        bio: data.bio || `Registered Builder Account • ${formattedPhone}`,
        is_approved: true,
      }
    });

    // Store KYC documents if provided
    const kycDocs = [];
    if (data.aadhaar_number) {
      kycDocs.push({ user_id: uid, document_type: 'aadhaar', document_number: data.aadhaar_number, document_front_url: 'PENDING_UPLOAD', verification_status: 'pending' });
    }
    if (data.pan_number) {
      kycDocs.push({ user_id: uid, document_type: 'pan', document_number: data.pan_number, document_front_url: 'PENDING_UPLOAD', verification_status: 'pending' });
    }
    if (data.passport_number) {
      kycDocs.push({ user_id: uid, document_type: 'passport', document_number: data.passport_number, document_front_url: 'PENDING_UPLOAD', verification_status: 'pending' });
    }
    
    for (const doc of kycDocs) {
      await prisma.kycDocument.upsert({
        where: { user_id_document_type: { user_id: doc.user_id, document_type: doc.document_type } },
        update: { document_number: doc.document_number },
        create: doc,
      });
    }

    // Also create the Developer record for backwards compatibility and properties count
    const developer = await prisma.developer.upsert({
      where: { name: data.name },
      update: {
        logo_url: data.logo_url || null,
        bio: data.bio || null,
        rating: data.rating ?? 4.5,
        established_year: data.established_year ? Number(data.established_year) : null,
        rera_registered: data.rera_registered ?? true,
        company_pan: data.company_pan || null,
        company_gst: data.company_gst || null,
        website: data.website || null,
        office_address: data.office_address || null,
      },
      create: {
        name: data.name,
        logo_url: data.logo_url || null,
        bio: data.bio || null,
        rating: data.rating ?? 4.5,
        established_year: data.established_year ? Number(data.established_year) : null,
        rera_registered: data.rera_registered ?? true,
        company_pan: data.company_pan || null,
        company_gst: data.company_gst || null,
        website: data.website || null,
        office_address: data.office_address || null,
      }
    });

    // Return combined representation
    const result = {
      id: profile.id,
      name: profile.full_name,
      email: profile.email,
      phone_number: profile.phone_number,
      type: 'account',
      is_approved: true,
      _count: { properties: 0 },
      properties: [],
      created_at: profile.created_at,
    };

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create developer:', error);
    return NextResponse.json({ error: error.message || 'Failed to create developer' }, { status: 500 });
  }
}
