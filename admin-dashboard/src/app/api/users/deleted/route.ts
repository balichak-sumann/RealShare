import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const adminProfile = await prisma.profile.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (adminProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const deletedUsers = await prisma.profile.findMany({
      where: {
        deleted_at: {
          not: null
        }
      },
      orderBy: {
        deleted_at: 'desc'
      }
    });

    return NextResponse.json(deletedUsers);
  } catch (error: any) {
    console.error('Error fetching deleted users:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
