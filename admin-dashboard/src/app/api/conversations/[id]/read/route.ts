import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/require-admin';

// PATCH: mark the conversation read (for the calling user only) as of now.
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;
    const { id } = await context.params;

    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversation_id_profile_id: { conversation_id: id, profile_id: auth.uid } },
    });
    if (!participant) {
      return NextResponse.json({ error: 'Not a participant of this conversation' }, { status: 404 });
    }

    const updated = await prisma.conversationParticipant.update({
      where: { id: participant.id },
      data: { last_read_at: new Date() },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Failed to mark conversation as read:', error);
    return NextResponse.json({ error: error.message || 'Failed to mark conversation as read' }, { status: 500 });
  }
}
