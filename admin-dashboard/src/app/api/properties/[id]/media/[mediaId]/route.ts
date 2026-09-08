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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; mediaId: string }> }
) {
  try {
    const { id, mediaId } = await params;
    const user = await getUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const property = await prisma.property.findUnique({ where: { id } });
    if (!property) return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    if (!user.isAdmin && property.posted_by !== user.uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const image = await prisma.propertyImage.findUnique({ where: { id: mediaId } });
    if (!image || image.property_id !== id) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    await prisma.propertyImage.delete({ where: { id: mediaId } });

    // If deleted image was primary, set another remaining image as primary
    if (image.is_primary) {
      const firstRemaining = await prisma.propertyImage.findFirst({
        where: { property_id: id },
        orderBy: { created_at: 'asc' },
      });
      if (firstRemaining) {
        await prisma.propertyImage.update({
          where: { id: firstRemaining.id },
          data: { is_primary: true },
        });
      }
    }

    const remainingImages = await prisma.propertyImage.findMany({
      where: { property_id: id },
      orderBy: [{ is_primary: 'desc' }, { created_at: 'asc' }],
    });

    return NextResponse.json({ success: true, images: remainingImages });
  } catch (error: any) {
    console.error('Failed to delete media:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete media' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; mediaId: string }> }
) {
  try {
    const { id, mediaId } = await params;
    const user = await getUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const property = await prisma.property.findUnique({ where: { id } });
    if (!property) return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    if (!user.isAdmin && property.posted_by !== user.uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const image = await prisma.propertyImage.findUnique({ where: { id: mediaId } });
    if (!image || image.property_id !== id) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    const data = await request.json();

    if (data.is_primary) {
      await prisma.$transaction([
        prisma.propertyImage.updateMany({
          where: { property_id: id },
          data: { is_primary: false },
        }),
        prisma.propertyImage.update({
          where: { id: mediaId },
          data: { is_primary: true },
        }),
      ]);
    }

    const updatedImages = await prisma.propertyImage.findMany({
      where: { property_id: id },
      orderBy: [{ is_primary: 'desc' }, { created_at: 'asc' }],
    });

    return NextResponse.json({ success: true, images: updatedImages });
  } catch (error: any) {
    console.error('Failed to update media:', error);
    return NextResponse.json({ error: error.message || 'Failed to update media' }, { status: 500 });
  }
}
