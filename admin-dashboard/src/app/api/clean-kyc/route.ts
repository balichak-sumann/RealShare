import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const latestInvestor = await prisma.profile.findFirst({
      where: { role: 'investor' },
      orderBy: { created_at: 'desc' }
    });

    if (!latestInvestor) {
      return NextResponse.json({ error: 'No investor found.' });
    }

    // Delete the injected documents
    await prisma.kycDocument.deleteMany({
      where: { user_id: latestInvestor.id }
    });

    // Reset status back to not_submitted
    await prisma.profile.update({
      where: { id: latestInvestor.id },
      data: { kyc_status: 'not_submitted' }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Removed fake KYC docs from ${latestInvestor.email}` 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
