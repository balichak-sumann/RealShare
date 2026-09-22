import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import prisma from '@/lib/prisma';

async function verifyAdmin(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await auth.verifyIdToken(token);
    const profile = await prisma.profile.findUnique({
      where: { id: decodedToken.uid },
      select: { role: true }
    });
    if (profile?.role === 'admin') return decodedToken.uid;
  } catch (e) {
    return null;
  }
  return null;
}

export async function GET(req: Request) {
  try {
    const adminId = await verifyAdmin(req);
    if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const plans = await prisma.subscriptionPlan.findMany({
      include: {
        _count: {
          select: { subscriptions: { where: { status: 'active' } } }
        }
      },
      orderBy: [
        { role_type: 'asc' },
        { sort_order: 'asc' }
      ]
    });

    return NextResponse.json(plans);
  } catch (error: any) {
    console.error('Error fetching admin plans:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const adminId = await verifyAdmin(req);
    if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { id, ...data } = body;

    if (!id) return NextResponse.json({ error: 'Plan ID required' }, { status: 400 });

    const updatedPlan = await prisma.subscriptionPlan.update({
      where: { id },
      data
    });

    return NextResponse.json(updatedPlan);
  } catch (error: any) {
    console.error('Error updating plan:', error);
    return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const adminId = await verifyAdmin(req);
    if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();

    const newPlan = await prisma.subscriptionPlan.create({
      data: body
    });

    return NextResponse.json(newPlan);
  } catch (error: any) {
    console.error('Error creating plan:', error);
    return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 });
  }
}
