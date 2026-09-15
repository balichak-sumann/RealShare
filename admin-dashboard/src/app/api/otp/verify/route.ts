import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import { createUserWithEmailAndPassword } from 'firebase/auth';

/**
 * Import the OTP store from the send route.
 * Since Next.js API routes run in the same process, we share the store
 * via a module-level import pattern. However, Next.js isolates route
 * modules, so we use a global variable approach instead.
 */

// Access the same global OTP store
interface OtpEntry {
  otp: string;
  expiresAt: number;
  attempts: number;
  sendCount: number;
  firstSentAt: number;
}

// We need a shared store between send and verify routes.
// Use globalThis to share across Next.js route module boundaries.
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
    const phone = body?.phone?.replace(/\D/g, '').slice(-10);
    const otp = body?.otp;

    if (!phone || phone.length !== 10) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number.' },
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
    const entry = otpStore.get(phone);

    if (!entry) {
      return NextResponse.json(
        { success: false, error: 'No OTP was sent to this number. Please request a new OTP.' },
        { status: 400 }
      );
    }

    // Check expiry
    if (Date.now() > entry.expiresAt) {
      otpStore.delete(phone);
      return NextResponse.json(
        { success: false, error: 'OTP has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Check max wrong attempts (3)
    if (entry.attempts >= 3) {
      otpStore.delete(phone);
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

    // OTP is correct — clean up
    otpStore.delete(phone);

    // Create a Firebase custom token for this phone user.
    // We use the same UID pattern as the existing phone auth flow
    // (phone_XXXXXXXXXX) to maintain consistency.
    const uid = `phone_${phone}`;

    try {
      // Ensure the Firebase user exists. If not, create it.
      try {
        await auth.getUser(uid);
      } catch (getUserErr: any) {
        if (getUserErr?.code === 'auth/user-not-found') {
          // Create a new Firebase user for this phone number
          await auth.createUser({
            uid,
            email: `${phone}@realshare.test`,
            emailVerified: true, // Phone-verified users skip email verification
            displayName: phone,
          });
        } else {
          throw getUserErr;
        }
      }

      // Generate a custom token the frontend can use with signInWithCustomToken()
      const customToken = await auth.createCustomToken(uid);

      return NextResponse.json({
        success: true,
        firebaseToken: customToken,
      });
    } catch (firebaseErr: any) {
      console.error('[OTP] Firebase token creation failed:', firebaseErr?.message);
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
