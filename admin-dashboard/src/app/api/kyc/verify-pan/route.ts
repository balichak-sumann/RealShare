import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import { verifyPan } from '@/lib/kyc-provider';
import prisma from '@/lib/prisma';
/**
 * POST /api/kyc/verify-pan
 * Instantly verifies a PAN number via Surepass API
 * Body: { pan_number: "ABCDE1234F" }
 */
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const { pan_number } = await req.json();
    if (!pan_number || pan_number.length !== 10) {
      return NextResponse.json({ error: 'Invalid PAN number. Must be 10 characters.' }, { status: 400 });
    }

    // Call Surepass API
    const result = await verifyPan(pan_number.toUpperCase());

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'PAN verification failed' }, { status: 400 });
    }

    // Store verified PAN in DB
    const existingKyc = await prisma.kycDocument.findFirst({
      where: { user_id: userId, document_type: 'pan' },
    });

    if (existingKyc) {
      await prisma.kycDocument.update({
        where: { id: existingKyc.id },
        data: {
          document_number: pan_number.toUpperCase(),
          verification_status: 'verified',
          verified_at: new Date(),
        }
      });
    } else {
      await prisma.kycDocument.create({
        data: {
          user_id: userId,
          document_type: 'pan',
          document_number: pan_number.toUpperCase(),
          document_front_url: '',
          verification_status: 'verified',
          verified_at: new Date(),
        }
      });
    }

    return NextResponse.json({
      success: true,
      pan_name: result.data?.full_name,
      pan_status: result.data?.status,
      category: result.data?.category,
    });
  } catch (error: any) {
    console.error('[KYC] PAN verify route error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
