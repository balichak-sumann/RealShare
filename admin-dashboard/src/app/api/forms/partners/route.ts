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

    let isAdmin = false;
    const decodedToken = await auth.verifyIdToken(token);
    const adminProfile = await prisma.profile.findUnique({ where: { id: decodedToken.uid } });
    isAdmin = adminProfile?.role === 'admin';

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const applications = await prisma.partnerApplication.findMany({
      orderBy: { created_at: 'desc' }
    });

    return NextResponse.json(applications);
  } catch (error: any) {
    console.error('Failed to fetch partner applications:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { full_name, email, phone, primary_market, company } = data;

    if (!full_name || !email || !phone || !primary_market) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const application = await prisma.partnerApplication.create({
      data: {
        full_name,
        email,
        phone,
        primary_market,
        company,
      }
    });

    return NextResponse.json({ success: true, application }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create partner application:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
