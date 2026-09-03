import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/require-admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('all') === 'true';

    if (includeInactive) {
      // Admin CMS view: needs to see and manage inactive banners too.
      const auth = await requireAdmin(request);
      if (!auth.ok) return auth.response;
      const banners = await prisma.banner.findMany({ orderBy: { sort_order: 'asc' } });
      return NextResponse.json(banners);
    }

    // Public: the mobile/web home screen reads active banners without auth.
    const banners = await prisma.banner.findMany({
      where: { is_active: true },
      orderBy: { sort_order: 'asc' },
    });
    return NextResponse.json(banners);
  } catch (error: any) {
    console.error('Failed to fetch banners:', error);
    return NextResponse.json({ error: 'Failed to fetch banners' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const { title, subtitle, badge, image_url, link_url } = body;
    if (!title || !image_url) {
      return NextResponse.json({ error: 'title and image_url are required' }, { status: 400 });
    }
    const count = await prisma.banner.count();
    const banner = await prisma.banner.create({
      data: { title, subtitle, badge, image_url, link_url, sort_order: count + 1 },
    });
    return NextResponse.json(banner);
  } catch (error: any) {
    console.error('Failed to create banner:', error);
    return NextResponse.json({ error: error.message || 'Failed to create banner' }, { status: 500 });
  }
}
