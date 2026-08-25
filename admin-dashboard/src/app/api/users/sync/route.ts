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
    
    let body: any = {};
    try {
      const bodyText = await req.text();
      if (bodyText) {
        body = JSON.parse(bodyText);
      }
    } catch (e) {
      // Ignore parsing errors for empty bodies
    }

    const referredByCode = body.referred_by_code;
    const expoPushToken = body.expo_push_token;
    
    let requestedRole = 'investor';
    if (body.role && ['investor', 'agent', 'builder'].includes(body.role)) {
      requestedRole = body.role;
    }

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
        ...(referredByCode ? { referred_by_code: referredByCode } : {}),
        ...(expoPushToken ? { expo_push_token: expoPushToken } : {}),
      },
      create: {
        id: decodedToken.uid,
        email: decodedToken.email || null,
        phone_number: decodedToken.phone_number || null,
        full_name: decodedToken.name || decodedToken.email?.split('@')[0] || 'User',
        avatar_url: decodedToken.picture || null,
        role: requestedRole,
        referred_by_code: referredByCode || null,
        expo_push_token: expoPushToken || null,
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
