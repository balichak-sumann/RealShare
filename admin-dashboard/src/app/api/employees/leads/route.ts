import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth as adminAuth } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    const employeeProfile = await prisma.profile.findUnique({
      where: { email: decodedToken.email }
    });

    if (!employeeProfile || employeeProfile.role !== 'employee' || employeeProfile.employee_department !== 'sales') {
      return NextResponse.json({ error: 'Unauthorized, must be a sales employee' }, { status: 403 });
    }

    const body = await req.json();
    const { name, phone, property } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });
    }

    const newLead = await prisma.profile.create({
      data: {
        id: crypto.randomUUID(),
        full_name: name,
        phone_number: phone,
        role: 'buyer',
        assigned_sales_rep_id: employeeProfile.id,
        about_me: property ? `Interested in: ${property}` : undefined
      }
    });

    return NextResponse.json({ success: true, lead: newLead });

  } catch (error: any) {
    console.error('Create lead API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
