import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/firebase-admin';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    
    // Check if the user is an admin
    const profile = await prisma.profile.findUnique({
      where: { id: decodedToken.uid }
    });
    
    if (profile?.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden. Only admins can view audit logs.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    
    const logs = await prisma.auditLog.findMany({
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        employee: {
          select: {
            full_name: true,
            email: true,
            employee_department: true
          }
        }
      }
    });

    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    console.error('Audit Log GET Error:', error.message);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
