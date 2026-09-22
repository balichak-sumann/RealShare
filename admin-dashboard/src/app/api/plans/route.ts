import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const roleType = searchParams.get('role');

    // Get plans status from global settings
    const settings = await prisma.platformSetting.findUnique({ where: { id: 'global' } });
    const plansEnabled = settings?.values ? (settings.values as any).plansEnabled !== false : true;

    if (!plansEnabled) {
      return NextResponse.json({ enabled: false, plans: [] });
    }

    const whereClause: any = { is_active: true };
    if (roleType) {
      whereClause.role_type = roleType;
    }

    const plans = await prisma.subscriptionPlan.findMany({
      where: whereClause,
      orderBy: { sort_order: 'asc' },
    });

    return NextResponse.json({ enabled: true, plans });
  } catch (error: any) {
    console.error('Failed to fetch subscription plans:', error);
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 });
  }
}
