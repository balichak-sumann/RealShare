import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const developer = await prisma.developer.findUnique({
      where: { id },
      include: {
        properties: {
          include: { images: true },
          orderBy: { created_at: 'desc' },
        },
        _count: { select: { properties: true } },
      },
    });

    if (!developer) {
      return NextResponse.json({ error: 'Developer not found' }, { status: 404 });
    }

    return NextResponse.json(developer);
  } catch (error) {
    console.error('Failed to fetch developer:', error);
    return NextResponse.json({ error: 'Failed to fetch developer' }, { status: 500 });
  }
}
