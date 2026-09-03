import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/firebase-admin';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const agentId = decodedToken.uid;

    const { id: clientId } = await params;

    // Verify client belongs to agent
    const client = await prisma.agentClient.findFirst({
      where: {
        id: clientId,
        agent_id: agentId,
      }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found or unauthorized' }, { status: 404 });
    }

    const messages = await prisma.chatMessage.findMany({
      where: {
        agent_id: agentId,
        client_id: clientId,
      },
      orderBy: {
        created_at: 'asc',
      }
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Failed to fetch messages:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const agentId = decodedToken.uid;

    const { id: clientId } = await params;
    const body = await request.json();
    const { message, sender } = body; // sender should be "agent" or "client"

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Verify client belongs to agent
    const client = await prisma.agentClient.findFirst({
      where: {
        id: clientId,
        agent_id: agentId,
      }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found or unauthorized' }, { status: 404 });
    }

    const newMessage = await prisma.chatMessage.create({
      data: {
        agent_id: agentId,
        client_id: clientId,
        message: message.trim(),
        sender: sender || 'agent',
      }
    });

    return NextResponse.json(newMessage);
  } catch (error) {
    console.error('Failed to send message:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
