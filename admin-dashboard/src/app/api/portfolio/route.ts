import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // In a real app, you would get the user ID from the session/token
    // Here we'll just fetch the first user or create a dummy one for demonstration
    let user = await prisma.profile.findFirst();
    
    if (!user) {
       user = await prisma.profile.create({
         data: {
           full_name: 'Rahul',
           email: 'rahul@realshare.com',
         }
       })
    }

    const investments = await prisma.investment.findMany({
      where: { user_id: user.id },
      include: {
        property: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return NextResponse.json({
      user,
      investments,
    });
  } catch (error) {
    console.error('Failed to fetch portfolio:', error);
    return NextResponse.json({ error: 'Failed to fetch portfolio' }, { status: 500 });
  }
}
