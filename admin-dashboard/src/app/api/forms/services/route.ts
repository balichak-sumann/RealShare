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

    const inquiries = await prisma.serviceInquiry.findMany({
      orderBy: { created_at: 'desc' }
    });

    return NextResponse.json(inquiries);
  } catch (error: any) {
    console.error('Failed to fetch service inquiries:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { customer_name, phone, email, service_type, property_reference, estimated_budget, notes } = data;

    if (!customer_name || !phone || !service_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const inquiry = await prisma.serviceInquiry.create({
      data: {
        customer_name,
        phone,
        email,
        service_type,
        property_reference,
        estimated_budget,
        notes,
      }
    });

    return NextResponse.json({ success: true, inquiry }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create service inquiry:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
