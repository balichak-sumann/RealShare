import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import prisma from '@/lib/prisma';
import { sendOtpEmail } from '@/lib/email';

interface OtpEntry {
  otp: string;
  expiresAt: number;
}

declare global {
  var __couponOtpStore: Map<string, OtpEntry> | undefined;
}

function getOtpStore(): Map<string, OtpEntry> {
  if (!globalThis.__couponOtpStore) {
    globalThis.__couponOtpStore = new Map();
  }
  return globalThis.__couponOtpStore;
}

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function verifyAdmin(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await auth.verifyIdToken(token);
    const profile = await prisma.profile.findUnique({
      where: { id: decodedToken.uid },
      select: { role: true, email: true }
    });
    if (profile?.role === 'admin') {
       return { uid: decodedToken.uid, email: profile.email || decodedToken.email };
    }
  } catch (e) {
    return null;
  }
  return null;
}

export async function GET(req: Request) {
  try {
    const admin = await verifyAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const coupons = await prisma.discountCoupon.findMany({
      orderBy: { created_at: 'desc' }
    });

    return NextResponse.json(coupons);
  } catch (error: any) {
    console.error('Error fetching admin coupons:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await verifyAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action, otp, ...couponData } = body;

    const store = getOtpStore();
    const adminEmail = admin.email;

    if (!adminEmail) {
       return NextResponse.json({ error: 'Admin email not found. Cannot send OTP.' }, { status: 400 });
    }

    if (action === 'send-otp') {
      const newOtp = generateOtp();
      store.set(adminEmail, {
        otp: newOtp,
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 mins
      });

      // Send OTP via email using existing utility
      // Note: we can reuse sendServiceInquiryEmail or create a generic one. For now, sending a raw email via transporter.
      // A better approach is to add a generic sendEmail function in lib/email.ts, but let's mock it or use the transporter directly if possible.
      // Since sendOtpEmail might exist (it was referenced in /api/otp/send-email/route.ts), let's use it if imported.
      // Actually, sendOtpEmail is imported at the top.
      
      const success = await sendOtpEmail(adminEmail, newOtp);
      if (!success) {
         return NextResponse.json({ error: 'Failed to send OTP email.' }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'OTP sent successfully.' });
    }

    if (action === 'create') {
      if (!otp) return NextResponse.json({ error: 'OTP is required.' }, { status: 400 });

      const entry = store.get(adminEmail);
      if (!entry || entry.expiresAt < Date.now()) {
        return NextResponse.json({ error: 'OTP expired or not requested.' }, { status: 400 });
      }

      if (entry.otp !== otp) {
        return NextResponse.json({ error: 'Invalid OTP.' }, { status: 400 });
      }

      // OTP verified, create coupon
      store.delete(adminEmail);

      const existingCoupon = await prisma.discountCoupon.findUnique({
        where: { code: couponData.code.toUpperCase() }
      });

      if (existingCoupon) {
         return NextResponse.json({ error: 'Coupon code already exists.' }, { status: 400 });
      }

      const newCoupon = await prisma.discountCoupon.create({
        data: {
          ...couponData,
          code: couponData.code.toUpperCase(),
          created_by: admin.uid,
          valid_from: new Date(couponData.valid_from),
          valid_until: new Date(couponData.valid_until),
        }
      });

      return NextResponse.json({ success: true, coupon: newCoupon });
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });

  } catch (error: any) {
    console.error('Error managing coupon:', error);
    return NextResponse.json({ error: 'Failed to process request.' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const admin = await verifyAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { id, ...data } = body;

    if (!id) return NextResponse.json({ error: 'Coupon ID required' }, { status: 400 });

    if (data.valid_from) data.valid_from = new Date(data.valid_from);
    if (data.valid_until) data.valid_until = new Date(data.valid_until);

    const updatedCoupon = await prisma.discountCoupon.update({
      where: { id },
      data
    });

    return NextResponse.json(updatedCoupon);
  } catch (error: any) {
    console.error('Error updating coupon:', error);
    return NextResponse.json({ error: 'Failed to update coupon' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const admin = await verifyAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Coupon ID required' }, { status: 400 });

    const deletedCoupon = await prisma.discountCoupon.delete({
      where: { id }
    });

    return NextResponse.json(deletedCoupon);
  } catch (error: any) {
    console.error('Error deleting coupon:', error);
    return NextResponse.json({ error: 'Failed to delete coupon' }, { status: 500 });
  }
}
