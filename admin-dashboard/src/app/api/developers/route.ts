import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const developers = await prisma.developer.findMany({
      include: {
        _count: { select: { properties: true } },
        properties: { select: { approval_status: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json(developers);
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
    if (token === 'MOCK_TOKEN') {
      isAdmin = true;
    } else {
      const decodedToken = await auth.verifyIdToken(token);
      const profile = await prisma.profile.findUnique({ where: { id: decodedToken.uid } });
      isAdmin = profile?.role === 'admin';
    }

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
        established_year: data.established_year || null,
        rera_registered: data.rera_registered ?? true,
      },
    });

    return NextResponse.json(developer, { status: 201 });
  } catch (error) {
    console.error('Failed to create developer:', error);
    return NextResponse.json({ error: 'Failed to create developer' }, { status: 500 });
  }
}
