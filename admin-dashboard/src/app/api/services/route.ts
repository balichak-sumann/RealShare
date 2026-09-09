import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/require-admin';
import { sendServiceInquiryEmail } from '@/lib/email';

// GET: admin-only list of service inquiries.
// (There is currently no user-facing intake flow that creates these —
// this endpoint only lists/reads what exists; a mobile submission form is
// tracked separately as future work, same as the rest of the Home
// Services product surface.)
export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    let inquiries: any[];
    if ((prisma as any).serviceInquiry) {
      inquiries = await (prisma as any).serviceInquiry.findMany({ orderBy: { created_at: 'desc' } });
    } else {
      inquiries = await prisma.$queryRaw<any[]>`SELECT * FROM service_inquiries ORDER BY created_at DESC`;
    }
    return NextResponse.json(inquiries);
  } catch (error: any) {
    console.error('Failed to fetch service inquiries:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch service inquiries' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customer_name, phone, email, service_type, property_reference, estimated_budget, assigned_to, status = 'New', notes } = body;
    if (!customer_name || !service_type || (!phone && !email)) {
      return NextResponse.json(
        { error: 'customer_name, service_type and at least one of phone/email are required' },
        { status: 400 }
      );
    }

    let inquiry: any;
    if ((prisma as any).serviceInquiry) {
      inquiry = await (prisma as any).serviceInquiry.create({
        data: {
          customer_name: customer_name.trim(),
          phone: phone?.trim() || null,
          email: email?.trim() || null,
          service_type: service_type.trim(),
          property_reference: property_reference?.trim() || null,
          estimated_budget: estimated_budget?.trim() || null,
          assigned_to: assigned_to?.trim() || null,
          status: status || 'New',
          notes: notes?.trim() || null,
        },
      });
    } else {
      const id = `inq-${Date.now()}`;
      const rows = await prisma.$queryRaw<any[]>`
        INSERT INTO service_inquiries (id, customer_name, phone, email, service_type, property_reference, estimated_budget, assigned_to, status, notes, created_at)
        VALUES (${id}, ${customer_name.trim()}, ${phone?.trim() || null}, ${email?.trim() || null}, ${service_type.trim()}, ${property_reference?.trim() || null}, ${estimated_budget?.trim() || null}, ${assigned_to?.trim() || null}, ${status || 'New'}, ${notes?.trim() || null}, NOW())
        RETURNING *
      `;
      inquiry = rows[0];
    }
    
    // Send email notification to admin asynchronously
    sendServiceInquiryEmail({ customer_name, phone, email, service_type, property_reference });

    return NextResponse.json(inquiry, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create service inquiry:', error);
    return NextResponse.json({ error: error?.message || 'Failed to submit inquiry' }, { status: 500 });
  }
}
