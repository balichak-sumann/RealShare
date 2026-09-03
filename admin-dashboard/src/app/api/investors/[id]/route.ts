import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/require-admin';

// PATCH: admin actions on an investor — approve/reject KYC, toggle active/banned status.
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const { id } = await context.params;
    const body = await request.json();
    const { kyc_action, rejection_reason, is_active, is_banned } = body;

    if (kyc_action) {
      if (!['approve', 'reject'].includes(kyc_action)) {
        return NextResponse.json({ error: 'Invalid kyc_action' }, { status: 400 });
      }
      const status = kyc_action === 'approve' ? 'verified' : 'rejected';
      // Applies to every KYC document this investor has submitted — the admin UI
      // reviews an investor's whole KYC submission as one action, not per-document.
      await prisma.kycDocument.updateMany({
        where: { user_id: id },
        data: {
          verification_status: status,
          verified_by: auth.uid,
          verified_at: new Date(),
          rejection_reason: kyc_action === 'reject' ? (rejection_reason || 'Rejected by admin') : null,
        },
      });
      await prisma.profile.update({ where: { id }, data: { kyc_status: status } });
    }

    if (typeof is_active === 'boolean' || typeof is_banned === 'boolean') {
      await prisma.profile.update({
        where: { id },
        data: {
          ...(typeof is_active === 'boolean' ? { is_active } : {}),
          ...(typeof is_banned === 'boolean' ? { is_banned } : {}),
        },
      });
    }

    const updated = await prisma.profile.findUnique({
      where: { id },
      include: { kyc_documents: true },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Failed to update investor:', error);
    return NextResponse.json({ error: error.message || 'Failed to update investor' }, { status: 500 });
  }
}
