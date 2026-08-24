import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    
    // Create or update the user in the database
    const profile = await prisma.profile.upsert({
      where: {
        id: decodedToken.uid,
      },
      update: {
        email: decodedToken.email || null,
        phone_number: decodedToken.phone_number || null,
        full_name: decodedToken.name || decodedToken.email?.split('@')[0] || 'User',
        avatar_url: decodedToken.picture || null,
      },
      create: {
        id: decodedToken.uid,
        email: decodedToken.email || null,
        phone_number: decodedToken.phone_number || null,
        full_name: decodedToken.name || decodedToken.email?.split('@')[0] || 'User',
        avatar_url: decodedToken.picture || null,
        role: 'investor',
      },
    });

    return NextResponse.json({ success: true, profile });
  } catch (error: any) {
    console.error('Error syncing user:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
