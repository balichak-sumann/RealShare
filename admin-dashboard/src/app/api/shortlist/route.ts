import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/require-admin';

// GET: the signed-in user's shortlisted property ids.
export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;
    const rows = await prisma.shortlist.findMany({ where: { user_id: auth.uid } });
    return NextResponse.json(rows.map((r) => r.property_id));
  } catch (error: any) {
    console.error('Failed to fetch shortlist:', error);
    return NextResponse.json({ error: 'Failed to fetch shortlist' }, { status: 500 });
  }
}

// POST: toggle a property in the signed-in user's shortlist. Body: { property_id }
export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;
    const body = await request.json();
    const { property_id } = body;
    if (!property_id) {
      return NextResponse.json({ error: 'property_id is required' }, { status: 400 });
    }

    const existing = await prisma.shortlist.findUnique({
      where: { user_id_property_id: { user_id: auth.uid, property_id } },
    });

    if (existing) {
      await prisma.shortlist.delete({ where: { id: existing.id } });
      return NextResponse.json({ shortlisted: false });
    } else {
      await prisma.shortlist.create({ data: { user_id: auth.uid, property_id } });
      return NextResponse.json({ shortlisted: true });
    }
  } catch (error: any) {
    console.error('Failed to update shortlist:', error);
    return NextResponse.json({ error: error.message || 'Failed to update shortlist' }, { status: 500 });
  }
}
