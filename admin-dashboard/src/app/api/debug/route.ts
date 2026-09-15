import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const users = await prisma.profile.findMany({
    where: { full_name: 'rishi' },
    include: { kyc_documents: true },
  });
  return NextResponse.json(users);
}
