import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/require-admin';

const STAFF_ROLES = ['admin', 'employee'];
const VALID_TYPES = ['advisor', 'support', 'property_inquiry'];

// POST: find-or-create a conversation. The client only says *what kind* of
// conversation it wants (and, for support/property_inquiry, which ticket or
// property) -- who the other participant is gets resolved here from the
// real data model, never taken from the request body.
export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;
    const callerId = auth.uid;

    const body = await request.json().catch(() => ({}));
    const { type, ticket_id, property_id } = body ?? {};

    if (typeof type !== 'string' || !VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    if (type === 'advisor') {
      return await findOrCreateAdvisorConversation(callerId);
    }
    if (type === 'support') {
      return await findOrCreateSupportConversation(callerId, auth.role, ticket_id);
    }
    return await findOrCreatePropertyInquiryConversation(callerId, property_id);
  } catch (error: any) {
    console.error('Failed to create/find conversation:', error);
    return NextResponse.json({ error: error.message || 'Failed to create conversation' }, { status: 500 });
  }
}

async function findOrCreateAdvisorConversation(callerId: string) {
  const caller = await prisma.profile.findUnique({ where: { id: callerId } });
  if (!caller) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  // Resolve the investor's advisor: a formally assigned sales rep, falling
  // back to whichever agent most recently earned a commission on this
  // investor's behalf (e.g. right after their first investment, before a
  // rep has been formally assigned).
  let advisorId = caller.assigned_sales_rep_id ?? null;
  if (!advisorId) {
    const recentCommission = await prisma.agentCommission.findFirst({
      where: { investor_id: callerId },
      orderBy: { created_at: 'desc' },
      select: { agent_id: true },
    });
    advisorId = recentCommission?.agent_id ?? null;
  }

  if (!advisorId) {
    return NextResponse.json({ error: 'No advisor assigned yet.' }, { status: 400 });
  }

  // context_id is the *other* participant's profile id for advisor
  // conversations, so re-calling this for the same investor+agent pair
  // always resolves back to the same thread.
  const existing = await prisma.conversation.findFirst({
    where: {
      type: 'advisor',
      context_id: advisorId,
      participants: { some: { profile_id: callerId } },
    },
  });
  if (existing) {
    return NextResponse.json({ id: existing.id }, { status: 200 });
  }

  const advisor = await prisma.profile.findUnique({ where: { id: advisorId }, select: { full_name: true } });

  const conversation = await prisma.$transaction(async (tx) => {
    const conv = await tx.conversation.create({
      data: {
        type: 'advisor',
        context_id: advisorId,
        context_label: advisor?.full_name ?? null,
      },
    });
    await tx.conversationParticipant.createMany({
      data: [
        { conversation_id: conv.id, profile_id: callerId },
        { conversation_id: conv.id, profile_id: advisorId! },
      ],
    });
    return conv;
  });

  return NextResponse.json({ id: conversation.id }, { status: 201 });
}

async function findOrCreateSupportConversation(callerId: string, callerRole: string | null, ticketId: unknown) {
  if (typeof ticketId !== 'string' || !ticketId) {
    return NextResponse.json({ error: 'ticket_id is required' }, { status: 400 });
  }

  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
  }

  const isOwner = ticket.user_id === callerId;
  const isStaff = !!callerRole && STAFF_ROLES.includes(callerRole);
  if (!isOwner && !isStaff) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Support conversations are keyed by ticket alone -- there's exactly one
  // thread per ticket, shared by whichever staff members join it. No
  // specific staff member is pre-assigned as a required participant.
  const existing = await prisma.conversation.findFirst({
    where: { type: 'support', context_id: ticketId },
  });
  if (existing) {
    return NextResponse.json({ id: existing.id }, { status: 200 });
  }

  const conversation = await prisma.$transaction(async (tx) => {
    const conv = await tx.conversation.create({
      data: {
        type: 'support',
        context_id: ticketId,
        context_label: ticket.ticket_number,
      },
    });
    // Participants start with just the caller -- staff auto-join the first
    // time they reply (see POST /[id]/messages).
    await tx.conversationParticipant.create({
      data: { conversation_id: conv.id, profile_id: callerId },
    });
    return conv;
  });

  return NextResponse.json({ id: conversation.id }, { status: 201 });
}

async function findOrCreatePropertyInquiryConversation(callerId: string, propertyId: unknown) {
  if (typeof propertyId !== 'string' || !propertyId) {
    return NextResponse.json({ error: 'property_id is required' }, { status: 400 });
  }

  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) {
    return NextResponse.json({ error: 'Property not found' }, { status: 404 });
  }
  if (!property.posted_by) {
    return NextResponse.json({ error: 'This property has no listing contact to message.' }, { status: 400 });
  }
  if (property.posted_by === callerId) {
    return NextResponse.json({ error: "You can't inquire about your own listing." }, { status: 400 });
  }

  // If the property was posted directly by an agent or builder, the investor
  // chats with that person one-to-one. If it was posted by an admin, there's
  // no single "right" person to route to -- the thread starts staff-only
  // (no second participant yet) and behaves like a support conversation:
  // any admin/employee sees it in their unclaimed queue and picks it up by
  // replying, which auto-joins them (see [id]/messages/route.ts).
  const poster = await prisma.profile.findUnique({
    where: { id: property.posted_by },
    select: { id: true, role: true },
  });
  const posterIsDirectContact = poster?.role === 'agent' || poster?.role === 'builder';

  const existing = await prisma.conversation.findFirst({
    where: {
      type: 'property_inquiry',
      context_id: propertyId,
      participants: { some: { profile_id: callerId } },
    },
  });
  if (existing) {
    return NextResponse.json({ id: existing.id }, { status: 200 });
  }

  const conversation = await prisma.$transaction(async (tx) => {
    const conv = await tx.conversation.create({
      data: {
        type: 'property_inquiry',
        context_id: propertyId,
        context_label: property.title,
      },
    });
    const participants = posterIsDirectContact
      ? [
          { conversation_id: conv.id, profile_id: callerId },
          { conversation_id: conv.id, profile_id: poster!.id },
        ]
      : [{ conversation_id: conv.id, profile_id: callerId }];
    await tx.conversationParticipant.createMany({ data: participants });
    return conv;
  });

  return NextResponse.json({ id: conversation.id }, { status: 201 });
}

// GET: the caller's inbox -- every conversation they participate in, newest
// activity first, plus (for staff) unclaimed support threads they could
// pick up but haven't joined yet.
export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    const participantRows = await prisma.conversationParticipant.findMany({
      where: { profile_id: auth.uid },
      include: {
        conversation: {
          include: {
            messages: { orderBy: { created_at: 'desc' }, take: 1 },
          },
        },
      },
    });

    const inbox = participantRows.map((p) => {
      const conv = p.conversation;
      const lastMsg = conv.messages[0] ?? null;
      const unread = lastMsg ? !p.last_read_at || lastMsg.created_at > p.last_read_at : false;
      return {
        id: conv.id,
        type: conv.type,
        context_label: conv.context_label,
        updated_at: conv.updated_at,
        last_message: lastMsg
          ? { body: lastMsg.body, created_at: lastMsg.created_at, sender_id: lastMsg.sender_id }
          : null,
        unread,
        staff_unclaimed: false,
      };
    });

    if (auth.role === 'admin' || auth.role === 'employee') {
      const joinedConversationIds = participantRows.map((p) => p.conversation_id);
      const unclaimedSupport = await prisma.conversation.findMany({
        where: {
          type: 'support',
          id: { notIn: joinedConversationIds },
        },
        include: {
          messages: { orderBy: { created_at: 'desc' }, take: 1 },
        },
      });
      // Property inquiries where the property was posted by an admin never get
      // a second participant assigned at creation time (see POST above) --
      // any of those with fewer than 2 participants are still unclaimed and
      // open for any staff member to pick up.
      const unclaimedPropertyCandidates = await prisma.conversation.findMany({
        where: {
          type: 'property_inquiry',
          id: { notIn: joinedConversationIds },
        },
        include: {
          messages: { orderBy: { created_at: 'desc' }, take: 1 },
          participants: { select: { id: true } },
        },
      });
      const unclaimedProperty = unclaimedPropertyCandidates.filter((c) => c.participants.length < 2);

      for (const conv of [...unclaimedSupport, ...unclaimedProperty]) {
        const lastMsg = conv.messages[0] ?? null;
        inbox.push({
          id: conv.id,
          type: conv.type,
          context_label: conv.context_label,
          updated_at: conv.updated_at,
          last_message: lastMsg
            ? { body: lastMsg.body, created_at: lastMsg.created_at, sender_id: lastMsg.sender_id }
            : null,
          unread: true,
          staff_unclaimed: true,
        });
      }
    }

    inbox.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

    return NextResponse.json(inbox);
  } catch (error: any) {
    console.error('Failed to fetch conversation inbox:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch conversations' }, { status: 500 });
  }
}
