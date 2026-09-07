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

    return NextResponse.json({ 
      name: latestInvestor.full_name,
      email: latestInvestor.email,
      phone: latestInvestor.phone_number
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
