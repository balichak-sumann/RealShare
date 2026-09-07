import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Force ALL documents to update, ignoring where clause
    const updated = await prisma.kycDocument.updateMany({
      data: {
        document_front_url: 'https://placehold.co/600x400.png?text=Uploaded+Document'
      }
    });

    return NextResponse.json({ success: true, count: updated.count });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
