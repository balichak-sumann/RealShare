import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/require-admin';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const { id } = await context.params;
    const body = await request.json();
    const { is_active, commission_rate_pct } = body;

    const data: any = {};
    if (typeof is_active === 'boolean') data.is_active = is_active;
    if (typeof commission_rate_pct === 'number') {
      if (commission_rate_pct < 0 || commission_rate_pct > 100) {
        return NextResponse.json({ error: 'commission_rate_pct must be between 0 and 100' }, { status: 400 });
      }
      data.commission_rate_pct = commission_rate_pct;
    }
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    const updated = await prisma.profile.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Failed to update agent:', error);
    return NextResponse.json({ error: error.message || 'Failed to update agent' }, { status: 500 });
  }
}
