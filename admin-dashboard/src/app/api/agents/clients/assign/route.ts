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
    const uid = decodedToken.uid;

    const { clientId, propertyId } = await req.json();

    if (!clientId || !propertyId) {
      return NextResponse.json({ error: 'Client ID and Property ID are required' }, { status: 400 });
    }

    // Verify the client belongs to the agent
    const client = await prisma.agentClient.findUnique({ where: { id: clientId } });
    if (!client || client.agent_id !== uid) {
      return NextResponse.json({ error: 'Client not found or access denied' }, { status: 403 });
    }

    // Assign the property
    const assignment = await prisma.agentClientProperty.create({
      data: {
        client_id: clientId,
        property_id: propertyId
      }
    });

    return NextResponse.json({ success: true, assignment }, { status: 201 });
  } catch (error: any) {
    console.error('Error assigning property:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Property is already assigned to this client' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
