import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import prisma from '@/lib/prisma';

export async function DELETE(
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

    // Hard delete in database
    await prisma.profile.delete({
      where: { id: userId }
    });

    // Hard delete in Firebase
    await auth.deleteUser(userId);

    return NextResponse.json({ success: true, message: 'Account permanently deleted' });
  } catch (error: any) {
    console.error('Error permanently deleting user:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
