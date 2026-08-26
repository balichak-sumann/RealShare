import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import { verifyAadhaarOtp } from '@/lib/kyc-provider';
import prisma from '@/lib/prisma';
/**
 * POST /api/kyc/aadhaar-verify
 * Verifies OTP and completes Aadhaar eKYC
 * Body: { client_id: "...", otp: "123456" }
 */
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decodedToken = await auth.verifyIdToken(authHeader.split('Bearer ')[1]);
    const userId = decodedToken.uid;

    const { client_id, otp } = await req.json();
    if (!client_id || !otp) {
      return NextResponse.json({ error: 'client_id and otp are required' }, { status: 400 });
    }

    const result = await verifyAadhaarOtp(client_id, otp);

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'OTP verification failed' }, { status: 400 });
    }

    // Store verified Aadhaar in DB
    const existingKyc = await prisma.kycDocument.findFirst({
      where: { user_id: userId, document_type: 'aadhaar' },
    });

    if (existingKyc) {
      await prisma.kycDocument.update({
        where: { id: existingKyc.id },
        data: {
          document_number: result.data?.aadhaar_number || '',
          verification_status: 'verified',
          verified_at: new Date(),
        }
      });
    } else {
      await prisma.kycDocument.create({
        data: {
          user_id: userId,
          document_type: 'aadhaar',
          document_number: result.data?.aadhaar_number || '',
          document_front_url: '',
          verification_status: 'verified',
          verified_at: new Date(),
        }
      });
    }

    // Check if PAN is also verified — if yes, mark full KYC as verified
    const panDoc = await prisma.kycDocument.findFirst({
      where: { user_id: userId, document_type: 'pan', verification_status: 'verified' },
    });

    if (panDoc) {
      await prisma.profile.update({
        where: { id: userId },
        data: { kyc_status: 'verified' },
      });
    } else {
      await prisma.profile.update({
        where: { id: userId },
        data: { kyc_status: 'pending' },
      });
    }

    return NextResponse.json({
      success: true,
      full_name: result.data?.full_name,
      aadhaar_number: result.data?.aadhaar_number,
      dob: result.data?.dob,
      address: result.data?.address,
      kyc_complete: !!panDoc,
    });
  } catch (error: any) {
    console.error('[KYC] Aadhaar verify route error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
