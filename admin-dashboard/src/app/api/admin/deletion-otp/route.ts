import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/require-admin';
import { generateOtp, storeOtp } from '@/lib/otp-store';
import { sendOtpSms } from '@/lib/sms';

export async function POST(request: Request) {
  try {
    const authResult = await requireSuperAdmin(request);
    if (!authResult.ok) return authResult.response;

    const body = await request.json();
    const { targetId, targetType } = body;

    if (!targetId) {
      return NextResponse.json({ error: 'Target ID is required for deletion request.' }, { status: 400 });
    }

    // Lookup superadmin profile to get phone number for OTP delivery
    const superadminProfile = await prisma.profile.findUnique({
      where: { id: authResult.uid },
      select: { phone_number: true, full_name: true, email: true }
    });

    const otp = generateOtp();
    const otpKey = `delete_${targetId}`;
    storeOtp(otpKey, otp);

    const phone = superadminProfile?.phone_number || '6302662448';
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);

    console.log(`[DELETION OTP] Generated OTP=${otp} for deleting ${targetType || 'record'} ${targetId}. Target Phone=${cleanPhone}`);

    // Send OTP via SMS
    const smsResult = await sendOtpSms(cleanPhone, otp, true);

    return NextResponse.json({
      success: true,
      message: `Deletion OTP dispatched to Super Admin (${cleanPhone}).`,
      // Return dev OTP in mock/non-prod environments for ease of testing
      devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    });
  } catch (error: any) {
    console.error('Failed to generate deletion OTP:', error);
    return NextResponse.json({ error: error.message || 'Failed to send deletion OTP' }, { status: 500 });
  }
}
