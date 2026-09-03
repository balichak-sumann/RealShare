import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/firebase-admin';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const properties = await prisma.property.findMany({
      where: {
        posted_by: userId
      },
      include: {
        images: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return NextResponse.json(properties);
  } catch (error) {
    console.error('Failed to fetch builder properties:', error);
    return NextResponse.json({ error: 'Failed to fetch builder properties' }, { status: 500 });
  }
}
