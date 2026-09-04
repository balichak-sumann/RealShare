// Server-side helper for pushing real-time chat events. Only ever called
// from within API routes running in the same Node process as server.js,
// which attaches the Socket.io server to `global.__socketio` on startup.
// No-ops safely whenever that global isn't set -- e.g. `next build`'s
// type-check/compile step, or any environment not running server.js.

type MessagePayload = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: Date | string;
  sender: { full_name: string | null; role: string | null };
};

export function emitNewMessage(participantIds: string[], conversationId: string, message: MessagePayload): void {
  const io = (globalThis as any).__socketio;
  if (!io) return; // no socket server attached in this process -- fine, REST still works
  for (const profileId of participantIds) {
    io.to(`user:${profileId}`).emit('new_message', { conversation_id: conversationId, message });
  }
}
