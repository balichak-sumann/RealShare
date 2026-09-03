import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/require-admin';

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const investors = await prisma.profile.findMany({
      where: { role: 'investor' },
      include: {
        kyc_documents: true,
        investments: { select: { total_amount: true, fractions_bought: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    const shaped = investors.map((inv) => ({
      id: inv.id,
      full_name: inv.full_name,
      email: inv.email,
      phone_number: inv.phone_number,
      kyc_status: inv.kyc_status,
      is_active: inv.is_active,
      is_banned: inv.is_banned,
      created_at: inv.created_at,
      total_invested: inv.investments.reduce((sum, i) => sum + Number(i.total_amount), 0),
      total_fractions: inv.investments.reduce((sum, i) => sum + i.fractions_bought, 0),
      kyc_documents: inv.kyc_documents.map((d) => ({
        id: d.id,
        document_type: d.document_type,
        document_number: d.document_number,
        document_front_url: d.document_front_url,
        document_back_url: d.document_back_url,
        verification_status: d.verification_status,
        rejection_reason: d.rejection_reason,
      })),
    }));

    return NextResponse.json(shaped);
  } catch (error: any) {
    console.error('Failed to fetch investors:', error);
    return NextResponse.json({ error: 'Failed to fetch investors' }, { status: 500 });
  }
}
