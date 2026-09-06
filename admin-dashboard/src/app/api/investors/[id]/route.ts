import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/require-admin';

// GET: Full details for a single investor
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const { id } = await context.params;

    const investor = await prisma.profile.findUnique({
      where: { id },
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
        },
      },
    });

    if (!investor) {
      return NextResponse.json({ error: 'Investor not found' }, { status: 404 });
    }

    return NextResponse.json(investor);
  } catch (error: any) {
    console.error('Failed to fetch investor details:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch investor details' },
      { status: 500 }
    );
  }
}

// PATCH: Admin actions on an investor — profile updates, wallet adjustment, KYC approval/rejection/offline verification, status toggle.
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
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
      kyc_action,
      rejection_reason,
      is_active,
      is_banned,
      wallet_adjustment, // { amount: number, type: 'credit' | 'debit', reason: string }
    } = body;

    // 1. Handle KYC actions
    if (kyc_action) {
      if (!['approve', 'reject', 'mark_offline_verified'].includes(kyc_action)) {
        return NextResponse.json({ error: 'Invalid kyc_action' }, { status: 400 });
      }

      const status =
        kyc_action === 'reject'
          ? 'rejected'
          : 'verified';

      // Update documents if any exist
      await prisma.kycDocument.updateMany({
        where: { user_id: id },
        data: {
          verification_status: status,
          verified_by: auth.uid,
          verified_at: new Date(),
          rejection_reason:
            kyc_action === 'reject'
              ? rejection_reason || 'Rejected by administrator'
              : null,
        },
      });

      await prisma.profile.update({
        where: { id },
        data: {
          kyc_status: status,
          kyc_rejection_reason:
            kyc_action === 'reject'
              ? rejection_reason || 'Rejected by administrator'
              : null,
        },
      });
    }

    // 2. Handle Wallet Balance Adjustments
    if (wallet_adjustment && typeof wallet_adjustment.amount === 'number') {
      const adjAmount = Math.abs(wallet_adjustment.amount);
      const isCredit = wallet_adjustment.type !== 'debit';
      const delta = isCredit ? adjAmount : -adjAmount;

      const profile = await prisma.profile.findUnique({
        where: { id },
        select: { wallet_balance: true },
      });

      const currentBal = Number(profile?.wallet_balance || 0);
      const newBal = Math.max(0, currentBal + delta);

      await prisma.profile.update({
        where: { id },
        data: { wallet_balance: newBal },
      });

      // Record audit transaction
      await prisma.transaction.create({
        data: {
          user_id: id,
          transaction_type: isCredit ? 'admin_credit' : 'admin_debit',
          amount: adjAmount,
          currency: 'INR',
          payment_gateway: 'Admin Adjustment',
          payment_status: 'completed',
          metadata: {
            reason: wallet_adjustment.reason || 'Admin manual balance adjustment',
            adjusted_by: auth.uid,
            previous_balance: currentBal,
            new_balance: newBal,
          },
        },
      });
    }

    // 3. Handle Profile and Status Field Updates
    const updateData: any = {};
    if (full_name !== undefined) updateData.full_name = full_name.trim();
    if (email !== undefined) updateData.email = email.trim().toLowerCase();
    if (phone_number !== undefined) updateData.phone_number = phone_number.trim() || null;
    if (full_address !== undefined) updateData.full_address = full_address.trim() || null;
    if (referral_code !== undefined) updateData.referral_code = referral_code.trim() || null;
    if (bank_account_name !== undefined) updateData.bank_account_name = bank_account_name.trim() || null;
    if (bank_account_number !== undefined) updateData.bank_account_number = bank_account_number.trim() || null;
    if (bank_ifsc !== undefined) updateData.bank_ifsc = bank_ifsc.trim() || null;
    if (typeof is_active === 'boolean') updateData.is_active = is_active;
    if (typeof is_banned === 'boolean') updateData.is_banned = is_banned;

    if (Object.keys(updateData).length > 0) {
      await prisma.profile.update({
        where: { id },
        data: updateData,
      });
    }

    // Return the updated profile with deep relations
    const updated = await prisma.profile.findUnique({
      where: { id },
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
                images: { where: { is_primary: true }, take: 1 },
              },
            },
          },
        },
        transactions: { orderBy: { created_at: 'desc' }, take: 10 },
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Failed to update investor:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update investor' },
      { status: 500 }
    );
  }
}
