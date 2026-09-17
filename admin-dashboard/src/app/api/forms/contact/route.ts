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

    const messages = await prisma.contactMessage.findMany({
      orderBy: { created_at: 'desc' }
    });

    return NextResponse.json(messages);
  } catch (error: any) {
    console.error('Failed to fetch contact messages:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { contact_type, full_name, email, phone, location, message } = data;

    if (!contact_type || !full_name || !email || !phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const contact = await prisma.contactMessage.create({
      data: {
        contact_type,
        full_name,
        email,
        phone,
        location,
        message,
      }
    });

    return NextResponse.json({ success: true, contact }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create contact message:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
