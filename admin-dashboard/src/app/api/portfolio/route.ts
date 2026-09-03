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

    let user = await prisma.profile.findUnique({ where: { id: userId } });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const investments = await prisma.investment.findMany({
      where: { user_id: user.id },
      include: {
        property: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return NextResponse.json({
      user,
      investments,
    });
  } catch (error) {
    console.error('Failed to fetch portfolio:', error);
    return NextResponse.json({ error: 'Failed to fetch portfolio' }, { status: 500 });
  }
}
