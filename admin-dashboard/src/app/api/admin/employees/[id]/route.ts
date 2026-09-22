import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin, requireSuperAdmin } from '@/lib/require-admin';
import { auth as firebaseAuth } from '@/lib/firebase-admin';

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

    const updated = await prisma.profile.update({
      where: { id },
      data: { is_active },
    });

    return NextResponse.json({ success: true, employee: updated });
  } catch (error: any) {
    console.error('Failed to update employee:', error);
    return NextResponse.json({ error: error.message || 'Failed to update employee' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const { id } = await context.params;

    // Delete from Prisma
    await prisma.profile.delete({
      where: { id },
    });

    // Delete from Firebase Auth
    try {
      await firebaseAuth.deleteUser(id);
    } catch (firebaseError: any) {
      console.warn(`Could not delete user from Firebase Auth: ${firebaseError.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete employee:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete employee' }, { status: 500 });
  }
}
