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
    const uid = decodedToken.uid;

    const body = await req.json();
    const { bank_account_name, bank_account_number, bank_ifsc } = body;

    // Optional validation
    if (!bank_account_name || !bank_account_number || !bank_ifsc) {
      return NextResponse.json({ error: 'Missing required bank details' }, { status: 400 });
    }

    const updatedProfile = await prisma.profile.update({
      where: { id: uid },
      data: {
        bank_account_name,
        bank_account_number,
        bank_ifsc,
      }
    });

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (error: any) {
    console.error('Error saving bank details:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
