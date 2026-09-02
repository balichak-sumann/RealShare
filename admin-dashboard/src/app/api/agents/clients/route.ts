import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;

    const profile = await prisma.profile.findUnique({ where: { id: uid } });
    if (!profile || (profile.role !== 'agent' && profile.role !== 'admin')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const clients = await prisma.agentClient.findMany({
      where: { agent_id: uid },
      include: {
        assignments: {
          include: {
            property: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    const formattedClients = clients.map(client => ({
      id: client.id,
      name: client.client_name,
      phone: client.phone_number,
      budget: client.target_budget || 'N/A',
      status: client.status,
      propertiesPitched: client.assignments.length,
      pitchedProperties: client.assignments.map(a => a.property)
    }));

    return NextResponse.json(formattedClients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;

    const { name, phone, budget } = await req.json();

    if (!name || !phone) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });
    }

    const newClient = await prisma.agentClient.create({
      data: {
        agent_id: uid,
        client_name: name,
        phone_number: phone,
        target_budget: budget || null,
        status: 'Hot Lead'
      }
    });

    return NextResponse.json({ success: true, client: newClient }, { status: 201 });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
