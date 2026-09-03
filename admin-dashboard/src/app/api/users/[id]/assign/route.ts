import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/require-admin';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const body = await req.json();
    const { assigned_sales_rep_id } = body;

    const updatedUser = await prisma.profile.update({
      where: { id },
      data: {
        assigned_sales_rep_id: assigned_sales_rep_id || null,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error('Failed to assign user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
