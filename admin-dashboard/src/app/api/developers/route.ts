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
          _count: { properties: b.posted_properties.length },
          properties: b.posted_properties,
          created_at: b.created_at,
        })),
    ];

    return NextResponse.json(unifiedList);
  } catch (error) {
    console.error('Failed to fetch developers:', error);
    return NextResponse.json({ error: 'Failed to fetch developers' }, { status: 500 });
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
    const profile = await prisma.profile.findUnique({ where: { id: decodedToken.uid } });
    isAdmin = profile?.role === 'admin';

    if (!isAdmin) {
      return NextResponse.json({ error: 'Only admins can add developers' }, { status: 403 });
    }

    const data = await request.json();
    if (!data.name) {
      return NextResponse.json({ error: 'Developer name is required' }, { status: 400 });
    }

    const developer = await prisma.developer.create({
      data: {
        name: data.name,
        logo_url: data.logo_url || null,
        bio: data.bio || null,
        rating: data.rating ?? 4.5,
        established_year: data.established_year ? Number(data.established_year) : null,
        rera_registered: data.rera_registered ?? true,
      },
    });

    return NextResponse.json(developer, { status: 201 });
  } catch (error) {
    console.error('Failed to create developer:', error);
    return NextResponse.json({ error: 'Failed to create developer' }, { status: 500 });
  }
}
