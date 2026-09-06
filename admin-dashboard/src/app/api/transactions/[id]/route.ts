import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/require-admin';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const { id } = await context.params;
    const body = await request.json();

    const dataToUpdate: any = {};
    if (body.payment_status) dataToUpdate.payment_status = body.payment_status.toLowerCase();
    if (body.payment_method) dataToUpdate.payment_method = body.payment_method;
    if (body.gateway_txn_id) dataToUpdate.gateway_txn_id = body.gateway_txn_id;

    const updated = await prisma.transaction.update({
      where: { id },
      data: dataToUpdate,
      include: {
        profile: true,
        property: true,
        investment: true,
      },
    });

    return NextResponse.json({ success: true, transaction: updated });
  } catch (error: any) {
    console.error('Failed to update transaction:', error);
    return NextResponse.json({ error: error.message || 'Failed to update transaction' }, { status: 500 });
  }
}
