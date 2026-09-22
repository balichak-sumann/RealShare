import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/firebase-admin';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get('phone');

  if (!phone) {
    return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
  }

  try {
    const users = await prisma.profile.findMany({
      where: {
        phone_number: { contains: phone }
      }
    });

    const deletedIds = [];
    for (const user of users) {
      try {
        await auth.deleteUser(user.id);
      } catch (e: any) {
        console.error(`Firebase delete failed for ${user.id}:`, e.message);
      }

      await prisma.transaction.deleteMany({ where: { user_id: user.id } });
      await prisma.investment.deleteMany({ where: { user_id: user.id } });
      await prisma.profile.delete({ where: { id: user.id } });
      deletedIds.push(user.id);
    }

    return NextResponse.json({ success: true, deleted: deletedIds });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
