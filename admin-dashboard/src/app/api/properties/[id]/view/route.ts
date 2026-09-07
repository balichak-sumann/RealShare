import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    const updated = await prisma.property.update({
      where: { id },
      data: {
        views_count: { increment: 1 },
      },
      select: {
        id: true,
        views_count: true,
      },
    });

    return NextResponse.json({ success: true, views_count: updated.views_count });
  } catch (error) {
    console.error('Failed to increment view count:', error);
    return NextResponse.json({ error: 'Failed to record view' }, { status: 500 });
  }
}
