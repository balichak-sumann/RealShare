import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/require-admin';
import { sendPushToProfile } from '@/lib/push';
import { emitNewMessage } from '@/lib/socket-emit';

const STAFF_ROLES = ['admin', 'employee'];
const MAX_MESSAGE_LENGTH = 4000;

async function getParticipant(conversationId: string, profileId: string) {
  return prisma.conversationParticipant.findUnique({
    where: { conversation_id_profile_id: { conversation_id: conversationId, profile_id: profileId } },
  });
}

// Support conversations are always open to staff oversight. Property
// inquiries only become staff-open when the property was posted by an admin
// -- in that case the conversation was created with a single participant
// (the investor) rather than a specific agent/builder, so "fewer than 2
// participants" is how an admin-posted, still-unclaimed inquiry is detected.
async function isStaffOversightEligible(
  conversation: { id: string; type: string },
  role: string | null
): Promise<boolean> {
  if (!role || !STAFF_ROLES.includes(role)) return false;
  if (conversation.type === 'support') return true;
  if (conversation.type === 'property_inquiry') {
    const count = await prisma.conversationParticipant.count({ where: { conversation_id: conversation.id } });
    return count < 2;
  }
  return false;
}

// GET: message history. Callers must be a participant, or -- for support
// conversations only -- any admin/employee (compliance/audit read, and lets
// staff step into a thread before they've replied).
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;
    const { id } = await context.params;

    const conversation = await prisma.conversation.findUnique({ where: { id } });
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const participant = await getParticipant(id, auth.uid);
    const isEligibleForOversight = participant ? false : await isStaffOversightEligible(conversation, auth.role);
    if (!participant && !isEligibleForOversight) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const messages = await prisma.message.findMany({
      where: { conversation_id: id },
      orderBy: { created_at: 'asc' },
      take: 200,
      include: {
        sender: { select: { full_name: true, role: true } },
      },
    });

    return NextResponse.json(messages);
  } catch (error: any) {
    console.error('Failed to fetch messages:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST: send a message. Same access rule as GET, except an admin/employee
// replying to a support conversation for the first time is auto-joined as a
// participant rather than rejected.
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;
    const { id } = await context.params;

    const conversation = await prisma.conversation.findUnique({ where: { id } });
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const text = typeof body?.body === 'string' ? body.body.trim() : '';
    if (!text) {
      return NextResponse.json({ error: 'Message body is required' }, { status: 400 });
    }
    if (text.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Message body must be ${MAX_MESSAGE_LENGTH} characters or fewer` },
        { status: 400 }
      );
    }

    let participant = await getParticipant(id, auth.uid);
    const isEligibleForOversight = participant ? false : await isStaffOversightEligible(conversation, auth.role);

    if (!participant && !isEligibleForOversight) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!participant) {
      // First reply from a staff member on an unclaimed thread (support, or
      // an admin-posted property inquiry) -- auto-join.
      participant = await prisma.conversationParticipant.create({
        data: { conversation_id: id, profile_id: auth.uid },
      });
    }

    const message = await prisma.message.create({
      data: { conversation_id: id, sender_id: auth.uid, body: text },
      include: { sender: { select: { full_name: true, role: true } } },
    });

    // Bump conversation.updated_at explicitly. Prisma's @updatedAt only
    // fires on a real `update()` call -- an explicit write is the reliable
    // way to bump it here (rather than betting on a field-touching no-op),
    // and GET /api/conversations sorts the inbox off this same field.
    await prisma.conversation.update({
      where: { id },
      data: { updated_at: new Date() },
    });

    // Notify every other participant: an instant socket push to whoever's
    // currently connected, plus a background push notification either way
    // (a connected socket doesn't mean the app is foregrounded). Both are
    // best-effort -- awaited so errors can't escape past this handler, but
    // never allowed to fail the request itself.
    try {
      const otherParticipants = await prisma.conversationParticipant.findMany({
        where: { conversation_id: id, profile_id: { not: auth.uid } },
        select: { profile_id: true },
      });
      const otherIds = otherParticipants.map((p) => p.profile_id);

      emitNewMessage(otherIds, id, message);

      const senderName = message.sender.full_name;
      const truncatedBody = text.length > 120 ? `${text.slice(0, 117)}...` : text;
      await Promise.all(
        otherIds.map((profileId) =>
          sendPushToProfile(profileId, {
            title: senderName,
            body: truncatedBody,
            data: { conversation_id: id, type: 'message' },
          })
        )
      );
    } catch (e) {
      console.error('Failed to notify other participants:', e);
    }

    return NextResponse.json(message, { status: 201 });
  } catch (error: any) {
    console.error('Failed to send message:', error);
    return NextResponse.json({ error: error.message || 'Failed to send message' }, { status: 500 });
  }
}
