import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const DEFAULT_CONFIG = {
  requireKycOnSignup: true,
  plansEnabled: true,
};

export async function GET() {
  try {
    const row = await prisma.platformSetting.findUnique({ where: { id: 'global' } });
    if (row && row.values) {
      const values = row.values as any;
      return NextResponse.json({
        requireKycOnSignup: values.requireKycOnSignup !== undefined ? values.requireKycOnSignup : DEFAULT_CONFIG.requireKycOnSignup,
        plansEnabled: values.plansEnabled !== undefined ? values.plansEnabled : DEFAULT_CONFIG.plansEnabled,
      });
    }
    return NextResponse.json(DEFAULT_CONFIG);
  } catch (error: any) {
    console.error('Failed to fetch public config:', error);
    return NextResponse.json(DEFAULT_CONFIG); // fallback to defaults instead of erroring for sign-up flow
  }
}
