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
    const phone = body?.phone?.replace(/\D/g, '').slice(-10);
    const phoneOtp = body?.phoneOtp;
    const email = body?.email?.toLowerCase().trim();
    const emailOtp = body?.emailOtp;
    const role = body?.role;

    if (!phone || phone.length !== 10) {
      return NextResponse.json({ success: false, error: 'Invalid phone number.' }, { status: 400 });
    }

    if (role !== 'buyer') {
      if (!email || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
        return NextResponse.json({ success: false, error: 'Invalid email address.' }, { status: 400 });
      }
      if (!phoneOtp || phoneOtp.length !== 6 || !emailOtp || emailOtp.length !== 6) {
        return NextResponse.json({ success: false, error: 'Please provide valid 6-digit OTPs for both Mobile and Email.' }, { status: 400 });
      }
    } else {
      if (!phoneOtp || phoneOtp.length !== 6) {
        return NextResponse.json({ success: false, error: 'Please provide a valid 6-digit OTP.' }, { status: 400 });
      }
    }

    const otpStore = getOtpStore();
    
    // Check Phone OTP
    const pEntry = otpStore.get(phone);
    if (!pEntry) return NextResponse.json({ success: false, error: 'No OTP sent to this phone number.' }, { status: 400 });
    if (Date.now() > pEntry.expiresAt) {
      otpStore.delete(phone);
      return NextResponse.json({ success: false, error: 'Phone OTP expired.' }, { status: 400 });
    }
    if (pEntry.attempts >= 3) {
      otpStore.delete(phone);
      return NextResponse.json({ success: false, error: 'Too many incorrect phone attempts.' }, { status: 400 });
    }
    if (pEntry.otp !== phoneOtp) {
      pEntry.attempts += 1;
      return NextResponse.json({ success: false, error: 'Incorrect Phone OTP.' }, { status: 400 });
    }

    // Check Email OTP
    if (role !== 'buyer') {
      const eEntry = otpStore.get(email);
      if (!eEntry) return NextResponse.json({ success: false, error: 'No OTP sent to this email.' }, { status: 400 });
      if (Date.now() > eEntry.expiresAt) {
        otpStore.delete(email);
        return NextResponse.json({ success: false, error: 'Email OTP expired.' }, { status: 400 });
      }
      if (eEntry.attempts >= 3) {
        otpStore.delete(email);
        return NextResponse.json({ success: false, error: 'Too many incorrect email attempts.' }, { status: 400 });
      }
      if (eEntry.otp !== emailOtp) {
        eEntry.attempts += 1;
        return NextResponse.json({ success: false, error: 'Incorrect Email OTP.' }, { status: 400 });
      }
      otpStore.delete(email);
    }

    otpStore.delete(phone);

    // Create a new Firebase user. 
    // We will use phone_${phone} as the base ID for backward compatibility with the existing phone auth structure,
    // or we can just use the phone number. Let's use `phone_${phone}` as the UID.
    const uid = `phone_${phone}`;

    try {
      // Create or update Firebase user
      const authPayload: any = {
        phoneNumber: `+91${phone}`,
        displayName: body?.fullName || 'User'
      };
      
      if (role !== 'buyer' && email) {
        authPayload.email = email;
        authPayload.emailVerified = true;
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
          // If phone number is already linked to another account, it might throw here
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
      // It's common for Firebase to complain if phone number or email is already in use by ANOTHER uid.
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
