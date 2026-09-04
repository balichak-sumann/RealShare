import prisma from '@/lib/prisma';

const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';

export interface ExpoPushMessage {
  to: string;
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
}

export interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: unknown;
}

/**
 * Low-level fan-out to Expo's push API. Accepts one or many messages in a
 * single batched request (Expo supports up to 100 per call, which is plenty
 * for this app's use) and returns the per-message ticket array Expo sends
 * back, so callers that need to know which specific sends succeeded/failed
 * (e.g. the bulk admin notification sender) still can.
 *
 * Never throws -- a delivery failure (network error, bad response shape)
 * resolves to an empty ticket array instead of rejecting, so a push problem
 * can never break the caller's request.
 */
export async function sendExpoPushTickets(messages: ExpoPushMessage[]): Promise<ExpoPushTicket[]> {
  if (messages.length === 0) return [];
  try {
    const res = await fetch(EXPO_PUSH_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(messages),
    });
    const json = await res.json().catch(() => null);
    const tickets: ExpoPushTicket[] = Array.isArray(json?.data) ? json.data : [];
    return tickets;
  } catch (e) {
    console.error('Expo push delivery failed:', e);
    return [];
  }
}

/**
 * Looks up the given profile's Expo push token and sends them a single
 * notification. Silently no-ops if the profile has no token on file, and
 * swallows any delivery error -- a failed push must never break whatever
 * request triggered it (a new message, a commission, etc).
 */
export async function sendPushToProfile(
  profileId: string,
  payload: { title: string; body: string; data?: Record<string, unknown> }
): Promise<void> {
  try {
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      select: { expo_push_token: true },
    });
    if (!profile?.expo_push_token) return;

    await sendExpoPushTickets([
      {
        to: profile.expo_push_token,
        title: payload.title,
        body: payload.body,
        data: payload.data,
        sound: 'default',
      },
    ]);
  } catch (e) {
    console.error(`Failed to send push notification to profile ${profileId}:`, e);
  }
}
