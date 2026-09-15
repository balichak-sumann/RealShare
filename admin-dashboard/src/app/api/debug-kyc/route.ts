import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const docs = await prisma.kycDocument.findMany({
      select: {
        id: true,
        document_type: true,
        document_number: true,
        document_front_url: true,
        document_back_url: true,
        user_id: true,
        profile: {
          select: { full_name: true, role: true, email: true }
        }
      },
      orderBy: { created_at: 'desc' },
      take: 20,
    });
    return NextResponse.json({ documents: docs }, { 
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
