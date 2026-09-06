import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/require-admin';

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    // Fetch all investor/client profiles (excluding admin/employee/builder internal roles)
    const investors = await prisma.profile.findMany({
      where: {
        OR: [
          { role: { in: ['investor', 'user', 'customer', 'client', 'member', ''] } },
          {
            role: {
              notIn: ['admin', 'employee', 'sales', 'support', 'accounts', 'builder', 'developer'],
            },
          },
        ],
      },
      include: {
        kyc_documents: true,
        investments: {
          include: {
            property: {
              select: {
                id: true,
                title: true,
                locality: true,
                district: true,
                state: true,
                price_per_fraction: true,
                assured_yield: true,
                images: {
                  where: { is_primary: true },
                  take: 1,
                  select: { image_url: true },
                },
              },
            },
          },
          orderBy: { created_at: 'desc' },
        },
        transactions: {
          orderBy: { created_at: 'desc' },
          take: 10,
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const shaped = investors.map((inv) => {
      const totalInvested = inv.investments.reduce(
        (sum, i) => sum + Number(i.total_amount || 0),
        0
      );
      const totalFractions = inv.investments.reduce(
        (sum, i) => sum + (i.fractions_bought || 0),
        0
      );

      return {
        id: inv.id,
        full_name: inv.full_name || inv.email?.split('@')[0] || 'Investor',
        email: inv.email || '—',
        phone_number: inv.phone_number || '—',
        wallet_balance: Number(inv.wallet_balance || 0),
        referral_code: inv.referral_code || '—',
        referred_by_code: inv.referred_by_code || '—',
        full_address: inv.full_address || '—',
        bank_account_name: inv.bank_account_name || '—',
        bank_account_number: inv.bank_account_number || '—',
        bank_ifsc: inv.bank_ifsc || '—',
        kyc_status: inv.kyc_status || 'not_submitted',
        kyc_rejection_reason: inv.kyc_rejection_reason || null,
        is_active: inv.is_active,
        is_banned: inv.is_banned,
        created_at: inv.created_at,
        updated_at: inv.updated_at,
        total_invested: totalInvested,
        total_fractions: totalFractions,
        investments: inv.investments.map((invItem) => ({
          id: invItem.id,
          property_id: invItem.property_id,
          property_title: invItem.property?.title || 'Property Asset',
          locality: invItem.property?.locality || '—',
          district: invItem.property?.district || '—',
          state: invItem.property?.state || '—',
          thumbnail: invItem.property?.images?.[0]?.image_url || null,
          fractions_bought: invItem.fractions_bought,
          total_amount: Number(invItem.total_amount || 0),
          booking_amount_paid: Number(invItem.booking_amount_paid || 0),
          ownership_percentage: Number(invItem.ownership_percentage || 0),
          certificate_number: invItem.certificate_number || null,
          status: invItem.status,
          assured_yield: Number(invItem.property?.assured_yield || 0),
          created_at: invItem.created_at,
        })),
        transactions: inv.transactions.map((tx) => ({
          id: tx.id,
          amount: Number(tx.amount || 0),
          currency: tx.currency,
          transaction_type: tx.transaction_type,
          payment_gateway: tx.payment_gateway,
          payment_status: tx.payment_status,
          gateway_txn_id: tx.gateway_txn_id,
          created_at: tx.created_at,
        })),
        kyc_documents: inv.kyc_documents.map((d) => ({
          id: d.id,
          document_type: d.document_type,
          document_number: d.document_number,
          document_front_url: d.document_front_url,
          document_back_url: d.document_back_url,
          verification_status: d.verification_status,
          rejection_reason: d.rejection_reason,
          created_at: d.created_at,
        })),
      };
    });

    return NextResponse.json(shaped);
  } catch (error: any) {
    console.error('Failed to fetch investors:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch investors' }, { status: 500 });
  }
}

// POST: Admin creates a new investor directly
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const {
      full_name,
      email,
      phone_number,
      full_address,
      wallet_balance,
      bank_account_name,
      bank_account_number,
      bank_ifsc,
      referral_code,
    } = body;

    if (!full_name || !email) {
      return NextResponse.json(
        { error: 'Full name and email are required.' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existing = await prisma.profile.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'An investor with this email already exists.' },
        { status: 409 }
      );
    }

    const generatedId = `inv_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const refCode =
      referral_code ||
      `RS-${full_name.split(' ')[0].toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newInvestor = await prisma.profile.create({
      data: {
        id: generatedId,
        full_name: full_name.trim(),
        email: email.trim().toLowerCase(),
        phone_number: phone_number?.trim() || null,
        full_address: full_address?.trim() || null,
        role: 'investor',
        kyc_status: 'not_submitted',
        wallet_balance: Number(wallet_balance || 0),
        bank_account_name: bank_account_name?.trim() || null,
        bank_account_number: bank_account_number?.trim() || null,
        bank_ifsc: bank_ifsc?.trim() || null,
        referral_code: refCode,
        is_active: true,
        is_banned: false,
      },
      include: {
        kyc_documents: true,
        investments: true,
        transactions: true,
      },
    });

    return NextResponse.json(newInvestor, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create investor:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create investor' },
      { status: 500 }
    );
  }
}
