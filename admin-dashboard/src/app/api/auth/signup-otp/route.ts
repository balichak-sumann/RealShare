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
    const identifier = body?.identifier?.toLowerCase().trim() || body?.phone?.replace(/\\D/g, '').slice(-10);
    const otp = body?.otp || body?.phoneOtp; // Support legacy payload during transition
    const role = body?.role;

    if (!identifier) {
      return NextResponse.json({ success: false, error: 'Identifier (email or phone) is required.' }, { status: 400 });
    }

    if (!otp || otp.length !== 6) {
      return NextResponse.json({ success: false, error: 'Please provide a valid 6-digit OTP.' }, { status: 400 });
    }

    const otpStore = getOtpStore();
    const entry = otpStore.get(identifier);

    if (!entry) {
      return NextResponse.json({ success: false, error: 'No OTP sent to this address/number.' }, { status: 400 });
    }

    if (Date.now() > entry.expiresAt) {
      otpStore.delete(identifier);
      return NextResponse.json({ success: false, error: 'OTP expired. Please request a new one.' }, { status: 400 });
    }

    if (entry.attempts >= 3) {
      otpStore.delete(identifier);
      return NextResponse.json({ success: false, error: 'Too many incorrect attempts.' }, { status: 400 });
    }

    if (entry.otp !== otp) {
      entry.attempts += 1;
      return NextResponse.json({ success: false, error: 'Incorrect OTP.' }, { status: 400 });
    }

    // OTP is correct
    otpStore.delete(identifier);

    const isEmail = identifier.includes('@');
    const uid = isEmail ? `email_${identifier}` : `phone_${identifier}`;

    try {
      // Create or update Firebase user
      const authPayload: any = {
        displayName: body?.fullName || 'User'
      };
      
      if (isEmail) {
        authPayload.email = identifier;
        authPayload.emailVerified = true;
      } else {
        authPayload.phoneNumber = `+91${identifier}`;
      }

      try {
        await auth.getUser(uid);
        // User exists, update fields
        await auth.updateUser(uid, authPayload);
      } catch (err: any) {
        if (err.code === 'auth/user-not-found') {
          await auth.createUser({
            uid,
            ...authPayload
          });
        } else {
          // If phone number/email is already linked to another account, it might throw here
          throw err;
        }
      }

      // Generate a custom token
      const customToken = await auth.createCustomToken(uid);

      return NextResponse.json({
        success: true,
        firebaseToken: customToken,
      });
    } catch (firebaseErr: any) {
      console.error('[OTP Signup] Firebase token creation failed:', firebaseErr?.message);
      if (firebaseErr?.code === 'auth/email-already-exists') {
         return NextResponse.json({ success: false, error: 'Email is already registered.' }, { status: 400 });
      }
      if (firebaseErr?.code === 'auth/phone-number-already-exists') {
         return NextResponse.json({ success: false, error: 'Phone number is already registered.' }, { status: 400 });
      }
      return NextResponse.json({ success: false, error: 'Account creation failed. It may already exist.' }, { status: 500 });
    }
  } catch (err: any) {
    console.error('[OTP Signup] Error:', err?.message);
    return NextResponse.json({ success: false, error: 'Internal server error.' }, { status: 500 });
  }
}
