import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/require-admin';

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

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.ok) return authResult.response;

    const { id } = await params;
    const existing = await prisma.developer.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Developer not found' }, { status: 404 });
    }

    const data = await request.json();

    const updated = await prisma.developer.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name : existing.name,
        logo_url: data.logo_url !== undefined ? data.logo_url : existing.logo_url,
        bio: data.bio !== undefined ? data.bio : existing.bio,
        rating: data.rating !== undefined ? data.rating : existing.rating,
        established_year: data.established_year !== undefined ? data.established_year : existing.established_year,
        rera_registered: data.rera_registered !== undefined ? data.rera_registered : existing.rera_registered,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update developer:', error);
    return NextResponse.json({ error: 'Failed to update developer' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.ok) return authResult.response;

    const { id } = await params;
    const existing = await prisma.developer.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Developer not found' }, { status: 404 });
    }

    await prisma.developer.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete developer:', error);
    return NextResponse.json({ error: 'Failed to delete developer' }, { status: 500 });
  }
}
