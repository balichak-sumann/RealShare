import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/require-admin';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;
    const { id } = await context.params;
    const body = await request.json();

    const data: any = {};
    if (body.title !== undefined) data.title = body.title.trim();
    if (body.category !== undefined) data.category = body.category.trim();
    if (body.description !== undefined) data.description = body.description ? body.description.trim() : null;
    if (body.pricing !== undefined) data.pricing = body.pricing ? body.pricing.trim() : null;
    if (body.image_url !== undefined) data.image_url = body.image_url.trim();
    if (body.icon !== undefined) data.icon = body.icon ? body.icon.trim() : null;
    if (body.sort_order !== undefined) data.sort_order = Number(body.sort_order) || 0;
    if (body.is_active !== undefined) data.is_active = Boolean(body.is_active);

    let updated: any;
    if ((prisma as any).premiumService) {
      updated = await (prisma as any).premiumService.update({
        where: { id },
        data,
      });
    } else {
      const setClauses: string[] = [];
      const values: any[] = [];
      let idx = 1;
      for (const [key, val] of Object.entries(data)) {
        setClauses.push(`${key} = $${idx++}`);
        values.push(val);
      }
      setClauses.push(`updated_at = NOW()`);
      values.push(id);
      const query = `UPDATE premium_services SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`;
      const rows = await prisma.$queryRawUnsafe<any[]>(query, ...values);
      updated = rows[0];
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Failed to update premium service:', error);
    return NextResponse.json({ error: error?.message || 'Failed to update premium service' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;
    const { id } = await context.params;

    if ((prisma as any).premiumService) {
      await (prisma as any).premiumService.delete({ where: { id } });
    } else {
      await prisma.$executeRaw`DELETE FROM premium_services WHERE id = ${id}`;
    }
    return NextResponse.json({ success: true, message: 'Service deleted successfully' });
  } catch (error: any) {
    console.error('Failed to delete premium service:', error);
    return NextResponse.json({ error: error?.message || 'Failed to delete premium service' }, { status: 500 });
  }
}
