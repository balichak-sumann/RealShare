import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/require-admin';

// GET: admin-only list of service inquiries.
// (There is currently no user-facing intake flow that creates these —
// this endpoint only lists/reads what exists; a mobile submission form is
// tracked separately as future work, same as the rest of the Home
// Services product surface.)
export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;
    const inquiries = await prisma.serviceInquiry.findMany({ orderBy: { created_at: 'desc' } });
    return NextResponse.json(inquiries);
  } catch (error: any) {
    console.error('Failed to fetch service inquiries:', error);
    return NextResponse.json({ error: 'Failed to fetch service inquiries' }, { status: 500 });
  }
}

// POST: public intake -- the mobile app's Home Services screen submits a real
// inquiry here (e.g. "Talk to an Expert" / tapping a service card) instead of
// firing a dead button. No auth required so a not-yet-signed-in visitor can
// still request a callback.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customer_name, phone, email, service_type, notes } = body;
    if (!customer_name || !service_type || (!phone && !email)) {
      return NextResponse.json(
        { error: 'customer_name, service_type and at least one of phone/email are required' },
        { status: 400 }
      );
    }
    const inquiry = await prisma.serviceInquiry.create({
      data: { customer_name, phone, email, service_type, notes },
    });
    return NextResponse.json(inquiry);
  } catch (error: any) {
    console.error('Failed to create service inquiry:', error);
    return NextResponse.json({ error: 'Failed to submit inquiry' }, { status: 500 });
  }
}
