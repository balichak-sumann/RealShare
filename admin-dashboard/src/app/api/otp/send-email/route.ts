import { NextResponse } from 'next/server';
import { sendOtpEmail } from '@/lib/email';

interface OtpEntry {
  otp: string;
  expiresAt: number;
  attempts: number;
  sendCount: number;
  firstSentAt: number;
}

declare global {
  var __otpStore: Map<string, OtpEntry> | undefined;
  var __otpCleanupStarted: boolean | undefined;
}

function getOtpStore(): Map<string, OtpEntry> {
  if (!globalThis.__otpStore) {
    globalThis.__otpStore = new Map();
  }
  return globalThis.__otpStore;
}

// Clean up expired entries periodically
if (typeof globalThis.__otpCleanupStarted === 'undefined') {
  globalThis.__otpCleanupStarted = true;
  setInterval(() => {
    const store = getOtpStore();
    const now = Date.now();
    for (const [identifier, entry] of store) {
      if (now > entry.expiresAt + 600_000) {
        store.delete(identifier);
      }
    }
  }, 600_000);
}

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = body?.email?.toLowerCase().trim();

    if (!email || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    if (body?.checkExists) {
      try {
        const { auth } = await import('@/lib/firebase-admin');
        const userRec = await auth.getUserByEmail(email);
        if (userRec.disabled) {
          return NextResponse.json(
            { success: false, error: 'This account had been requested for deletion. Please contact support to get back access.' },
            { status: 403 }
          );
        }
      } catch (err: any) {
        if (err.code === 'auth/user-not-found') {
          return NextResponse.json(
            { success: false, error: 'Account not found. Please sign up first.' },
            { status: 404 }
          );
        }
      }
    }

    if (body?.checkNotExists) {
      const prisma = (await import('@/lib/prisma')).default;
      const dbUser = await prisma.profile.findFirst({ where: { email: email } });

      if (dbUser) {
        if (dbUser.deleted_at !== null) {
          return NextResponse.json(
            { success: false, error: 'There is already an account in deactivated status for this email. Please contact support to gain back access or wait 30 days to completely delete the account and create a new account.' },
            { status: 400 }
          );
        }
        return NextResponse.json(
          { success: false, error: 'Account already exists with this email address. Please sign in instead.' },
          { status: 400 }
        );
      }
    }

    const now = Date.now();
    const otpStore = getOtpStore();
    const existing = otpStore.get(email);

    // Rate limiting: max 5 OTPs per email per hour
    if (existing) {
      const oneHourAgo = now - 3600_000;
      if (existing.firstSentAt > oneHourAgo && existing.sendCount >= 5) {
        return NextResponse.json(
          { success: false, error: 'Too many OTP requests. Please try again after some time.' },
          { status: 429 }
        );
      }
      if (existing.firstSentAt <= oneHourAgo) {
        existing.sendCount = 0;
        existing.firstSentAt = now;
      }
    }

    const otp = generateOtp();
    const expiresAt = now + 5 * 60 * 1000; // 5 minutes

    const result = await sendOtpEmail(email, otp);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to send OTP.' },
        { status: 500 }
      );
    }

    otpStore.set(email, {
      otp,
      expiresAt,
      attempts: 0,
      sendCount: (existing?.sendCount || 0) + 1,
      firstSentAt: existing?.firstSentAt || now,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[OTP] Send email error:', err?.message);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
