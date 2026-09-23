import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withoutAudit } from '@/lib/audit-context';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    // A view counter fires on every page load. It carries no forensic meaning
    // and would otherwise bury real activity under millions of rows.
    const updated = await withoutAudit(() =>
      prisma.property.update({
        where: { id },
        data: {
          views_count: { increment: 1 },
        },
        select: {
          id: true,
          views_count: true,
        },
      })
    );

    return NextResponse.json({ success: true, views_count: updated.views_count });
  } catch (error) {
    console.error('Failed to increment view count:', error);
    return NextResponse.json({ error: 'Failed to record view' }, { status: 500 });
  }
}
