import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/require-admin';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const { id } = await context.params;
    const body = await request.json();
    const {
      full_name,
      email,
      phone_number,
      full_address,
      referral_code,
      bank_account_name,
      bank_account_number,
      bank_ifsc,
      is_active,
      commission_rate_pct,
    } = body;

    const data: any = {};
    if (full_name !== undefined) data.full_name = full_name.trim();
    if (email !== undefined) data.email = email.trim().toLowerCase();
    if (phone_number !== undefined) data.phone_number = phone_number.trim() || null;
    if (full_address !== undefined) data.full_address = full_address.trim() || null;
    if (referral_code !== undefined) data.referral_code = referral_code.trim() || null;
    if (bank_account_name !== undefined) data.bank_account_name = bank_account_name.trim() || null;
    if (bank_account_number !== undefined) data.bank_account_number = bank_account_number.trim() || null;
    if (bank_ifsc !== undefined) data.bank_ifsc = bank_ifsc.trim() || null;
    if (typeof is_active === 'boolean') data.is_active = is_active;

    if (typeof commission_rate_pct === 'number') {
      if (commission_rate_pct < 0 || commission_rate_pct > 100) {
        return NextResponse.json(
          { error: 'commission_rate_pct must be between 0 and 100' },
          { status: 400 }
        );
      }
      data.commission_rate_pct = commission_rate_pct;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    const updated = await prisma.profile.update({
      where: { id },
      data,
      include: {
        agent_commissions: true,
        agent_clients: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Failed to update agent:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update agent' },
      { status: 500 }
    );
  }
}
