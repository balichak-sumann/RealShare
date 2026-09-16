import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';

interface OtpEntry {
  otp: string;
  expiresAt: number;
  attempts: number;
  sendCount: number;
  firstSentAt: number;
}

declare global {
  var __otpStore: Map<string, OtpEntry> | undefined;
}

function getOtpStore(): Map<string, OtpEntry> {
  if (!globalThis.__otpStore) {
    globalThis.__otpStore = new Map();
  }
  return globalThis.__otpStore;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const identifier = body?.identifier?.toLowerCase().trim() || body?.phone?.replace(/\D/g, '').slice(-10);
    const otp = body?.otp;

    if (!identifier) {
      return NextResponse.json(
        { success: false, error: 'Identifier (email or phone) is required.' },
        { status: 400 }
      );
    }

    if (!otp || otp.length !== 6) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid 6-digit OTP.' },
        { status: 400 }
      );
    }

    const otpStore = getOtpStore();
    const entry = otpStore.get(identifier);

    if (!entry) {
      return NextResponse.json(
        { success: false, error: 'No OTP was sent to this address/number.' },
        { status: 400 }
      );
    }

    // Check expiry
    if (Date.now() > entry.expiresAt) {
      otpStore.delete(identifier);
      return NextResponse.json(
        { success: false, error: 'OTP has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Check max wrong attempts
    if (entry.attempts >= 3) {
      otpStore.delete(identifier);
      return NextResponse.json(
        { success: false, error: 'Too many incorrect attempts. Please request a new OTP.' },
        { status: 400 }
      );
    }

    // Verify OTP
    if (entry.otp !== otp) {
      entry.attempts += 1;
      const remaining = 3 - entry.attempts;
      return NextResponse.json(
        { success: false, error: `Incorrect OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.` },
        { status: 400 }
      );
    }

    // OTP is correct
    otpStore.delete(identifier);

    // Sign in logic - Find Firebase user by email or phone
    const isEmail = identifier.includes('@');
    
    try {
      let userRecord;
      if (isEmail) {
        userRecord = await auth.getUserByEmail(identifier);
      } else {
        // Firebase phone numbers are stored with +91
        userRecord = await auth.getUserByPhoneNumber(`+91${identifier}`);
      }

      // Generate a custom token
      const customToken = await auth.createCustomToken(userRecord.uid);

      return NextResponse.json({
        success: true,
        firebaseToken: customToken,
      });
    } catch (firebaseErr: any) {
      console.error('[OTP Verify] Firebase lookup failed:', firebaseErr?.message);
      if (firebaseErr?.code === 'auth/user-not-found') {
         return NextResponse.json(
           { success: false, error: 'Account not found. Please sign up first.' },
           { status: 404 }
         );
      }
      return NextResponse.json(
        { success: false, error: 'Authentication failed. Please try again.' },
        { status: 500 }
      );
    }
  } catch (err: any) {
    console.error('[OTP] Verify error:', err?.message);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
