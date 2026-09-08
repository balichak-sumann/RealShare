import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/require-admin';

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const { propertyId, investorId, saleAmount } = body;

    if (!propertyId || !investorId) {
      return NextResponse.json(
        { error: 'propertyId and investorId are required.' },
        { status: 400 }
      );
    }

    // Validate property exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: { images: { take: 1, orderBy: { is_primary: 'desc' } } },
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found.' }, { status: 404 });
    }

    if (property.is_sold_out) {
      return NextResponse.json({ error: 'This property is already sold out.' }, { status: 400 });
    }

    // Validate investor exists
    const investor = await prisma.profile.findUnique({
      where: { id: investorId },
    });

    if (!investor) {
      return NextResponse.json({ error: 'Investor not found.' }, { status: 404 });
    }

    const totalFractions = property.total_fractions || 1;
    const pricePerFraction = Number(property.price_per_fraction) || 0;
    const totalAmount = saleAmount
      ? Number(saleAmount)
      : pricePerFraction * totalFractions;

    const certNumber = `RS-CERT-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Execute the entire sale in a single atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Investment record
      const investment = await tx.investment.create({
        data: {
          user_id: investorId,
          property_id: propertyId,
          fractions_bought: totalFractions,
          total_amount: totalAmount,
          booking_amount_paid: totalAmount,
          ownership_percentage: 100.0,
          certificate_number: certNumber,
          status: 'completed',
        },
      });

      // 2. Create Transaction record
      await tx.transaction.create({
        data: {
          user_id: investorId,
          property_id: propertyId,
          investment_id: investment.id,
          transaction_type: 'admin_sale',
          amount: totalAmount,
          currency: 'INR',
          payment_gateway: 'Offline / Admin',
          payment_status: 'completed',
          metadata: {
            sold_by_admin: auth.uid,
            note: 'Property sold via admin dashboard (third-party / offline sale)',
          },
        },
      });

      // 3. Mark property as sold out
      const updatedProperty = await tx.property.update({
        where: { id: propertyId },
        data: {
          is_sold_out: true,
          sold_fractions: totalFractions,
          available_fractions: 0,
        },
        include: {
          images: { orderBy: [{ is_primary: 'desc' }, { created_at: 'asc' }] },
          developer: true,
          profile: { select: { full_name: true, role: true } },
        },
      });

      return { investment, property: updatedProperty };
    });

    return NextResponse.json({
      success: true,
      message: `Property "${property.title}" sold to ${investor.full_name}.`,
      investment: {
        id: result.investment.id,
        certificate_number: certNumber,
        fractions_bought: totalFractions,
        total_amount: totalAmount,
        ownership_percentage: 100,
      },
      property: result.property,
      investor: {
        id: investor.id,
        full_name: investor.full_name,
        email: investor.email,
      },
    });
  } catch (error: any) {
    console.error('Failed to sell property:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process sale' },
      { status: 500 }
    );
  }
}
