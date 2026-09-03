import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/require-admin';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;
    const { id } = await context.params;
    const body = await request.json();
    const { is_active } = body;
    if (typeof is_active !== 'boolean') {
      return NextResponse.json({ error: 'is_active (boolean) is required' }, { status: 400 });
    }
    const updated = await prisma.banner.update({ where: { id }, data: { is_active } });
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Failed to update banner:', error);
    return NextResponse.json({ error: error.message || 'Failed to update banner' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;
    const { id } = await context.params;
    await prisma.banner.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete banner:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete banner' }, { status: 500 });
  }
}
