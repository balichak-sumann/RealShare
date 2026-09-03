import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import prisma from '@/lib/prisma';
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

    // SECURITY: 'admin' is never self-assignable by a public caller. It is only
    // granted on first-time account creation, and only when the caller presents
    // a server-known bootstrap secret (used once to create the very first admin
    // account). Every subsequent admin must be created via the protected,
    // admin-only /api/admin/employees route. Self-selectable roles for normal
    // signup remain investor/agent/builder, matching the app's sign-up screen.
    const SELF_SERVICE_ROLES = ['investor', 'agent', 'builder'];
    const bootstrapSecret = req.headers.get('x-admin-bootstrap-secret');
    const bootstrapAllowed =
      !!process.env.ADMIN_BOOTSTRAP_SECRET &&
      bootstrapSecret === process.env.ADMIN_BOOTSTRAP_SECRET;

    const existingProfile = await prisma.profile.findUnique({
      where: { id: decodedToken.uid },
      select: { role: true },
    });

    let requestedRole = 'investor';
    if (!existingProfile) {
      // First time this user has ever synced: role may be set once.
      if (body.role === 'admin' && bootstrapAllowed) {
        requestedRole = 'admin';
      } else if (body.role && SELF_SERVICE_ROLES.includes(body.role)) {
        requestedRole = body.role;
      }
    }

    // Create or update the user in the database. Role is only ever written on
    // first creation above — an existing profile's role can never be changed
    // through this public, self-service endpoint.
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
