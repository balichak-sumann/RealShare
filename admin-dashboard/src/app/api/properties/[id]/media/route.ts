import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/firebase-admin';

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

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const images = await prisma.propertyImage.findMany({
      where: { property_id: id },
      orderBy: [{ is_primary: 'desc' }, { created_at: 'asc' }],
    });
    return NextResponse.json(images);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch property images' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const property = await prisma.property.findUnique({ where: { id } });
    if (!property) return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    if (!user.isAdmin && property.posted_by !== user.uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await request.json();
    const existingCount = await prisma.propertyImage.count({ where: { property_id: id } });

    let createdImages = [];

    if (Array.isArray(data.image_urls) && data.image_urls.length > 0) {
      const urls = data.image_urls.filter((u: any) => typeof u === 'string' && u.trim().length > 0);
      createdImages = await prisma.$transaction(
        urls.map((url: string, index: number) =>
          prisma.propertyImage.create({
            data: {
              property_id: id,
              image_url: url.trim(),
              is_primary: existingCount === 0 && index === 0,
            },
          })
        )
      );
    } else if (data.image_url) {
      const isPrimary = Boolean(data.is_primary) || existingCount === 0;
      if (isPrimary && existingCount > 0) {
        await prisma.propertyImage.updateMany({
          where: { property_id: id },
          data: { is_primary: false },
        });
      }
      const created = await prisma.propertyImage.create({
        data: {
          property_id: id,
          image_url: data.image_url.trim(),
          is_primary: isPrimary,
        },
      });
      createdImages = [created];
    } else {
      return NextResponse.json({ error: 'image_url or image_urls array is required' }, { status: 400 });
    }

    const allImages = await prisma.propertyImage.findMany({
      where: { property_id: id },
      orderBy: [{ is_primary: 'desc' }, { created_at: 'asc' }],
    });

    return NextResponse.json({ success: true, created: createdImages, images: allImages }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to add property media:', error);
    return NextResponse.json({ error: error.message || 'Failed to add media' }, { status: 500 });
  }
}
