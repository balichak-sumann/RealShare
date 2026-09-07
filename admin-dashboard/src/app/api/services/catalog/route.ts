import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/require-admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const onlyActive = searchParams.get('active') === 'true';

    let services: any[];
    if ((prisma as any).premiumService) {
      services = await (prisma as any).premiumService.findMany({
        where: onlyActive ? { is_active: true } : undefined,
        orderBy: { sort_order: 'asc' },
      });
    } else {
      // Fallback if Prisma Client runtime delegate is cached in long-running dev server
      if (onlyActive) {
        services = await prisma.$queryRaw<any[]>`SELECT * FROM premium_services WHERE is_active = true ORDER BY sort_order ASC`;
      } else {
        services = await prisma.$queryRaw<any[]>`SELECT * FROM premium_services ORDER BY sort_order ASC`;
      }
    }

    return NextResponse.json(services);
  } catch (error: any) {
    console.error('Failed to fetch services catalog:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch services catalog' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const { title, category, description, pricing, image_url, icon, sort_order = 0, is_active = true } = body;

    if (!title || !image_url) {
      return NextResponse.json({ error: 'Title and image URL are required' }, { status: 400 });
    }

    let service: any;
    if ((prisma as any).premiumService) {
      service = await (prisma as any).premiumService.create({
        data: {
          title: title.trim(),
          category: category?.trim() || 'Premium Service',
          description: description?.trim() || null,
          pricing: pricing?.trim() || null,
          image_url: image_url.trim(),
          icon: icon?.trim() || null,
          sort_order: Number(sort_order) || 0,
          is_active: Boolean(is_active),
        },
      });
    } else {
      const id = `srv-${Date.now()}`;
      const rows = await prisma.$queryRaw<any[]>`
        INSERT INTO premium_services (id, title, category, description, pricing, image_url, icon, sort_order, is_active, created_at, updated_at)
        VALUES (${id}, ${title.trim()}, ${category?.trim() || 'Premium Service'}, ${description?.trim() || null}, ${pricing?.trim() || null}, ${image_url.trim()}, ${icon?.trim() || null}, ${Number(sort_order) || 0}, ${Boolean(is_active)}, NOW(), NOW())
        RETURNING *
      `;
      service = rows[0];
    }

    return NextResponse.json(service, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create service:', error);
    return NextResponse.json({ error: error?.message || 'Failed to create service' }, { status: 500 });
  }
}
