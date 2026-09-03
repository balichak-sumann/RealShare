import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/require-admin';

const DEFAULT_SETTINGS = {
  platformName: 'RealShare',
  supportEmail: 'support@realshare.in',
  supportPhone: '+91 1800 123 4567',
  defaultCurrency: 'INR',
  minKycLevel: 'Full',
  adminSessionTimeoutMinutes: 30,
  secondaryMarketplaceEnabled: true,
  holidayBookingEnabled: false,
  autoYieldDistributionEnabled: true,
  virtualToursEnabled: true,
  emailAlertsForInvestments: true,
  smsAlertsForKyc: false,
  weeklySummaryReport: true,
};

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;
    const row = await prisma.platformSetting.findUnique({ where: { id: 'global' } });
    return NextResponse.json(row ? { ...DEFAULT_SETTINGS, ...(row.values as object) } : DEFAULT_SETTINGS);
  } catch (error: any) {
    console.error('Failed to fetch settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;
    const body = await request.json();
    const updated = await prisma.platformSetting.upsert({
      where: { id: 'global' },
      update: { values: body },
      create: { id: 'global', values: body },
    });
    return NextResponse.json(updated.values);
  } catch (error: any) {
    console.error('Failed to save settings:', error);
    return NextResponse.json({ error: error.message || 'Failed to save settings' }, { status: 500 });
  }
}
