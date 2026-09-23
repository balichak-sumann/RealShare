import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import prisma from '@/lib/prisma';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    
    const adminProfile = await prisma.profile.findUnique({
      where: { id: decodedToken.uid },
      select: { role: true }
    });

    if (adminProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userId = params.id;

    // Restore in database
    await prisma.profile.update({
      where: { id: userId },
      data: { deleted_at: null }
    });

    // Re-enable in Firebase
    await auth.updateUser(userId, { disabled: false });

    return NextResponse.json({ success: true, message: 'Account restored successfully' });
  } catch (error: any) {
    console.error('Error revoking user deletion:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
