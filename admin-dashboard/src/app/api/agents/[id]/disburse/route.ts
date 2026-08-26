import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const agentId = params.id;

    // Disburse all pending commissions for this agent
    const updated = await prisma.agentCommission.updateMany({
      where: {
        agent_id: agentId,
        status: 'pending_clearance'
      },
      data: {
        status: 'paid',
        paid_at: new Date()
      }
    });

    return NextResponse.json({ success: true, count: updated.count });
  } catch (error: any) {
    console.error('Failed to disburse commissions:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
