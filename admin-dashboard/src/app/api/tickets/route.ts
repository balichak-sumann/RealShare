import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/require-admin';

function generateTicketNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `RS-${date}-${rand}`;
}

// GET: employees/admins see all tickets; everyone else sees only their own.
export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    const isStaff = auth.role === 'admin' || auth.role === 'employee';
    const tickets = await prisma.supportTicket.findMany({
      where: isStaff ? {} : { user_id: auth.uid },
      orderBy: { created_at: 'desc' },
    });
    return NextResponse.json({ tickets });
  } catch (error: any) {
    console.error('Failed to fetch tickets:', error);
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
  }
}

// POST: any signed-in user files a support ticket.
export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const { category, subject, description, priority } = body;
    if (!subject || !description) {
      return NextResponse.json({ error: 'subject and description are required' }, { status: 400 });
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        user_id: auth.uid,
        ticket_number: generateTicketNumber(),
        category: category || 'general',
        subject,
        description,
        priority: ['low', 'medium', 'high'].includes(priority) ? priority : 'medium',
      },
    });
    return NextResponse.json({ success: true, ticket });
  } catch (error: any) {
    console.error('Failed to create ticket:', error);
    return NextResponse.json({ error: error.message || 'Failed to create ticket' }, { status: 500 });
  }
}
