import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin, requireSuperAdmin } from '@/lib/require-admin';
import { logAdminAction } from '@/lib/audit';
import { verifyAndDeleteOtp } from '@/lib/otp-store';

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const roleFilter = searchParams.get('role');

    const whereClause: any = {
      is_approved: false,
      is_banned: false,
    };

    if (roleFilter && ['buyer', 'agent', 'builder'].includes(roleFilter)) {
      whereClause.role = roleFilter;
    } else {
      whereClause.role = { in: ['buyer', 'agent', 'builder'] };
    }

    const pendingUsers = await prisma.profile.findMany({
      where: whereClause,
      include: {
        kyc_documents: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json(pendingUsers);
  } catch (error: any) {
    console.error('Failed to fetch pending approvals:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch pending approvals' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const { id, action } = body;

    if (!id) {
      return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
    }

    let updatedUser;
    if (action === 'reject') {
      updatedUser = await prisma.profile.update({
        where: { id },
        data: { is_banned: true },
      });
      await logAdminAction(auth.uid, 'REJECT_USER', 'User', id, { reason: 'banned via approvals' });
    } else {
      updatedUser = await prisma.profile.update({
        where: { id },
        data: { is_approved: true },
      });
      await logAdminAction(auth.uid, 'APPROVE_USER', 'User', id, {});
    }

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error('Failed to approve/reject user:', error);
    return NextResponse.json({ error: error.message || 'Failed to approve/reject user' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
    }

    const otp = searchParams.get('otp');
    if (!otp) {
      return NextResponse.json({ error: 'Security OTP is required to confirm account deletion.' }, { status: 400 });
    }
    const otpCheck = verifyAndDeleteOtp(`delete_${id}`, otp);
    if (!otpCheck.valid) {
      return NextResponse.json({ error: otpCheck.error || 'Invalid deletion OTP.' }, { status: 400 });
    }

    await prisma.profile.delete({
      where: { id },
    });
    
    await logAdminAction(auth.uid, 'DELETE_USER', 'User', id, {});

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete user:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete user' }, { status: 500 });
  }
}
