import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';

import prisma from '@/lib/prisma';
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
    }
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const body = await req.json();
    const { document_type, document_number, document_front_url, document_back_url } = body;

    if (!document_type || !document_number || !document_front_url) {
      return NextResponse.json({ error: 'Missing required document fields' }, { status: 400, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
    }

    // Upsert the KYC Document
    const kycDoc = await prisma.kycDocument.upsert({
      where: {
        user_id_document_type: {
          user_id: userId,
          document_type,
        }
      },
      update: {
        document_number,
        document_front_url,
        document_back_url,
        verification_status: 'pending',
        verified_at: null
      },
      create: {
        user_id: userId,
        document_type,
        document_number,
        document_front_url,
        document_back_url,
        verification_status: 'pending',
        verified_at: null
      }
    });

    // Update User Profile KYC Status - stays pending until an admin reviews
    // and approves/rejects it via the existing KYC review flow.
    await prisma.profile.update({
      where: { id: userId },
      data: { kyc_status: 'pending' }
    });

    return NextResponse.json(
      { success: true, kycDocumentId: kycDoc.id },
      { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } }
    );
  } catch (error: any) {
    console.error('Error submitting KYC:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } }
    );
  }
}

export async function OPTIONS(req: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
