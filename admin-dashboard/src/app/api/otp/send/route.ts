import { NextResponse } from 'next/server';
import { captureRequestContext } from '@/lib/audit-context';
import { recordAudit } from '@/lib/audit';
import { sendOtpSms } from '@/lib/sms';

/**
 * In-memory OTP store shared via globalThis.
 * Both /api/otp/send and /api/otp/verify access the same store.
 * For a single Render instance, this works perfectly.
 */
interface OtpEntry {
  otp: string;
  expiresAt: number;
  attempts: number;    // wrong-verify attempts
  sendCount: number;   // how many OTPs sent this hour
  firstSentAt: number; // timestamp of first OTP this hour (for rate limiting)
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

// Clean up expired entries periodically (every 10 minutes)
if (typeof globalThis.__otpCleanupStarted === 'undefined') {
  globalThis.__otpCleanupStarted = true;
  setInterval(() => {
    const store = getOtpStore();
    const now = Date.now();
    for (const [phone, entry] of store) {
      if (now > entry.expiresAt + 600_000) {
        store.delete(phone);
      }
    }
  }, 600_000);
}

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(request: Request) {
  captureRequestContext(request);
  try {
    const body = await request.json();
    const phone = body?.phone?.replace(/\D/g, '').slice(-10);

    if (!phone || phone.length !== 10 || !/^[6-9]/.test(phone)) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid 10-digit Indian mobile number.' },
        { status: 400 }
      );
    }

    // --- APPLE APP REVIEW BYPASS ---
    // Apple Reviewers will use this static number to bypass SMS sending
    if (phone === '9999999999') {
      return NextResponse.json({
        success: true,
        message: 'OTP bypassed for App Review.',
      });
    }
    // -------------------------------

    if (body?.checkExists) {
      try {
        const { auth } = await import('@/lib/firebase-admin');
        const userRec = await auth.getUserByPhoneNumber(`+91${phone}`);
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
      const dbUser = await prisma.profile.findFirst({ where: { phone_number: `+91${phone}` } });

      if (dbUser) {
        if (dbUser.deleted_at !== null) {
          return NextResponse.json(
            { success: false, error: 'There is already an account in deactivated status for this phone. Please contact support to gain back access or wait 30 days to completely delete the account and create a new account.' },
            { status: 400 }
          );
        }
        return NextResponse.json(
          { success: false, error: 'Account already exists with this phone number. Please sign in instead.' },
          { status: 400 }
        );
      }
    }

    const now = Date.now();
    const otpStore = getOtpStore();
    const existing = otpStore.get(phone);

    // Rate limiting: max 5 OTPs per phone per hour
    if (existing) {
      const oneHourAgo = now - 3600_000;
      if (existing.firstSentAt > oneHourAgo && existing.sendCount >= 5) {
        return NextResponse.json(
          { success: false, error: 'Too many OTP requests. Please try again after some time.' },
          { status: 429 }
        );
      }
      // Reset hourly counter if the hour has passed
      if (existing.firstSentAt <= oneHourAgo) {
        existing.sendCount = 0;
        existing.firstSentAt = now;
      }
    }

    const otp = generateOtp();
    const expiresAt = now + 5 * 60 * 1000; // 5 minutes

    // Send OTP via SMSGatewayHub
    // If checkExists is true, it's a login attempt. If action='login', it's a login.
    const isLogin = Boolean(body?.checkExists || body?.action === 'login');
    const result = await sendOtpSms(phone, otp, isLogin);

    if (!result.success) {
      console.error(`[OTP] Failed to send OTP to ${phone}:`, result.error);
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to send OTP. Please try again.' },
        { status: 500 }
      );
    }

    // Store OTP after successful delivery
    otpStore.set(phone, {
      otp,
      expiresAt,
      attempts: 0,
      sendCount: (existing?.sendCount || 0) + 1,
      firstSentAt: existing?.firstSentAt || now,
    });

    console.log(`[OTP] Sent OTP to ${phone} (expires in 5 min)`);

    await recordAudit({
      action: 'OTP_SENT', entityType: 'Auth',
      entityId: (body?.identifier || body?.phone || 'unknown').toString().toLowerCase().trim(),
      details: { channel: body?.email ? 'email' : 'sms' },
    }).catch((err) => {
      console.error('[OTP] Failed to record audit log for OTP_SENT:', err?.message || err);
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[OTP] Send error:', err?.message);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
