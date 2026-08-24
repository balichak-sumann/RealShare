import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import { sendAadhaarOtp } from '@/lib/kyc-provider';

/**
 * POST /api/kyc/aadhaar-otp
 * Sends OTP to Aadhaar-linked mobile number
 * Body: { aadhaar_number: "123456789012" }
 */
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await auth.verifyIdToken(authHeader.split('Bearer ')[1]);

    const { aadhaar_number } = await req.json();
    if (!aadhaar_number || aadhaar_number.length !== 12) {
      return NextResponse.json({ error: 'Invalid Aadhaar number. Must be 12 digits.' }, { status: 400 });
    }

    const result = await sendAadhaarOtp(aadhaar_number);

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to send OTP' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      client_id: result.data?.client_id,
      message: result.data?.message,
    });
  } catch (error: any) {
    console.error('[KYC] Aadhaar OTP route error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
