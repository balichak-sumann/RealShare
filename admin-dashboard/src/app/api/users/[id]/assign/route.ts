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

    if (assigned_sales_rep_id) {
      const rep = await prisma.profile.findUnique({
        where: { id: assigned_sales_rep_id },
        select: { role: true, employee_department: true },
      });

      if (!rep || rep.role !== 'employee' || rep.employee_department !== 'sales') {
        return NextResponse.json(
          { error: 'assigned_sales_rep_id must belong to a sales department employee' },
          { status: 400 }
        );
      }
    }

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
