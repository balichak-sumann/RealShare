import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Test 1: Basic connection
    const propertyCount = await prisma.property.count();
    const imageCount = await prisma.propertyImage.count();
    const devCount = await prisma.developer.count();

    return NextResponse.json({
      status: 'ok',
      database_url_set: !!process.env.DATABASE_URL,
      database_url_prefix: process.env.DATABASE_URL?.substring(0, 30) + '...',
      properties: propertyCount,
      images: imageCount,
      developers: devCount,
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: error?.message || String(error),
      code: error?.code,
      name: error?.name,
      database_url_set: !!process.env.DATABASE_URL,
      database_url_prefix: process.env.DATABASE_URL?.substring(0, 30) + '...',
    }, { status: 500 });
  }
}
