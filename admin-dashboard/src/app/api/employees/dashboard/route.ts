import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth as adminAuth } from '@/lib/firebase-admin';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Get the employee's profile
    const employeeProfile = await prisma.profile.findUnique({
      where: { email: decodedToken.email }
    });

    if (!employeeProfile || employeeProfile.role !== 'employee') {
      return NextResponse.json({ error: 'Unauthorized, must be an employee' }, { status: 403 });
    }

    const department = employeeProfile.employee_department || 'sales';

    // Different data payloads based on department
    if (department === 'sales') {
      // Return investors and their investments
      const investors = await prisma.profile.findMany({
        where: { 
          role: 'user',
          assigned_sales_rep_id: employeeProfile.id
        },
        take: 10,
        orderBy: { created_at: 'desc' }
      });
      
      const salesClients = await Promise.all(investors.map(async (inv) => {
        const investments = await prisma.investment.findMany({
          where: { user_id: inv.id },
          include: { property: true }
        });
        
        let latestProperty = 'None';
        let fractions = 0;
        let value = 0;
        
        if (investments.length > 0) {
          latestProperty = investments[0].property.title;
          fractions = investments.reduce((sum, i) => sum + i.fractions_bought, 0);
          value = investments.reduce((sum, i) => sum + Number(i.total_amount), 0);
        }
        
        return {
          name: inv.full_name,
          phone: inv.phone_number || 'No Phone',
          property: latestProperty,
          fractions: fractions,
          value: `₹${value.toLocaleString('en-IN')}`,
          status: investments.length > 0 ? 'Active Investor' : 'Lead'
        };
      }));
      
      return NextResponse.json({ salesClients });
    } 
    
    if (department === 'support') {
      // Mocked tickets (since there's no actual Ticket schema yet, but in a real app this would query a tickets table)
      return NextResponse.json({ 
        supportTickets: [
          { ticketId: 'TCK-101', user: 'Vikram Singh', query: 'Aadhaar upload failing due to blur image', priority: 'High', status: 'Open' },
          { ticketId: 'TCK-102', user: 'Anjali Desai', query: 'Question regarding rental yield distribution bank account', priority: 'Medium', status: 'In Progress' },
          { ticketId: 'TCK-103', user: 'Meera Nair', query: 'Request for digital share certificate duplicate', priority: 'Low', status: 'Resolved' },
        ]
      });
    }

    if (department === 'accounts') {
      // Return actual transactions
      const transactions = await prisma.transaction.findMany({
        take: 10,
        orderBy: { created_at: 'desc' },
        include: { profile: true }
      });
      
      const accountsLedger = transactions.map(txn => ({
        ref: txn.id.substring(0, 8).toUpperCase(),
        user: txn.profile?.full_name || 'System',
        type: txn.transaction_type,
        amount: `₹${Number(txn.amount).toLocaleString('en-IN')}`,
        verified: txn.payment_status === 'completed'
      }));
      
      return NextResponse.json({ accountsLedger });
    }

    return NextResponse.json({ error: 'Unknown department' }, { status: 400 });

  } catch (error: any) {
    console.error('Employee dashboard API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
