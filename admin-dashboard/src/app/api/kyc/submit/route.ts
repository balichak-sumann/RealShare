import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';

import prisma from '@/lib/prisma';
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const body = await req.json();
    const { document_type, document_number, document_front_url, document_back_url } = body;

    if (!document_type || !document_number || !document_front_url) {
      return NextResponse.json({ error: 'Missing required document fields' }, { status: 400 });
    }

    // Upsert the KYC Document
    const kycDoc = await prisma.kycDocument.create({
      data: {
        user_id: userId,
        document_type,
        document_number,
        document_front_url,
        document_back_url,
        verification_status: 'verified', // Simulated instant verification for beta
        verified_at: new Date()
      }
    });

    // Update User Profile KYC Status
    await prisma.profile.update({
      where: { user_id: userId },
      data: { kyc_status: 'verified' }
    });

    return NextResponse.json({ success: true, kycDocumentId: kycDoc.id });
  } catch (error: any) {
    console.error('Error submitting KYC:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
