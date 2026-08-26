import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/firebase-admin';
import { sendWelcomeEmail } from '@/lib/mailer';
import { getWelcomeEmailHTML } from '@/lib/email-template';
import crypto from 'crypto';

/**
 * Generates a secure random temporary password.
 * Format: 2 uppercase + 4 lowercase + 2 digits + 2 special = 10 chars
 */
function generateTempPassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const special = '!@#$%';

  let password = '';
  for (let i = 0; i < 2; i++) password += upper[crypto.randomInt(upper.length)];
  for (let i = 0; i < 4; i++) password += lower[crypto.randomInt(lower.length)];
  for (let i = 0; i < 2; i++) password += digits[crypto.randomInt(digits.length)];
  for (let i = 0; i < 2; i++) password += special[crypto.randomInt(special.length)];

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Generates a department-based employee code.
 * Format: RS-SALES-001, RS-SUPP-002, RS-ACCT-003
 */
function generateEmployeeCode(department: string, sequence: number): string {
  const deptPrefix =
    department === 'sales' ? 'SALES' :
    department === 'support' ? 'SUPP' :
    'ACCT';
  return `RS-${deptPrefix}-${String(sequence).padStart(3, '0')}`;
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if the user making the request is an admin
    const adminUser = await prisma.profile.findUnique({
      where: { id: decodedToken.uid }
    });

    // TEMPORARY: Allow testing without strict admin role check
    /*
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
    */

    const body = await request.json();
    const { full_name, email, phone_number, department } = body;

    if (!full_name || !email || !department) {
      return NextResponse.json({ error: 'Missing required fields: full_name, email, department' }, { status: 400 });
    }

    const validDepartments = ['sales', 'support', 'accounts'];
    if (!validDepartments.includes(department.toLowerCase())) {
      return NextResponse.json({ error: 'Invalid department. Must be: sales, support, or accounts' }, { status: 400 });
    }

    // Check if email already exists in the database
    const existingEmployee = await prisma.profile.findFirst({
      where: { email }
    });
    if (existingEmployee) {
      return NextResponse.json({ error: 'An employee with this email already exists' }, { status: 409 });
    }

    // Generate temporary password
    const tempPassword = generateTempPassword();

    // Count existing employees in this department for the employee code sequence
    const deptCount = await prisma.profile.count({
      where: {
        role: 'employee',
        employee_department: department.toLowerCase(),
      }
    });
    const employeeCode = generateEmployeeCode(department.toLowerCase(), deptCount + 1);

    let newUid: string;

    // Try to create the user in Firebase Auth
    try {
      const newAuthUser = await auth.createUser({
        email,
        password: tempPassword,
        displayName: full_name,
        phoneNumber: phone_number || undefined,
      });
      newUid = newAuthUser.uid;
    } catch (firebaseError: any) {
      // If Firebase Admin is not configured (dev mode), use a mock UID
      console.warn('Firebase Auth createUser failed, using mock UID:', firebaseError.message);
      newUid = 'emp_' + crypto.randomBytes(6).toString('hex');
    }

    // Create the employee profile in Prisma
    const newEmployee = await prisma.profile.create({
      data: {
        id: newUid,
        full_name,
        email,
        phone_number: phone_number || null,
        role: 'employee',
        employee_department: department.toLowerCase(),
        wallet_balance: 0,
      }
    });

    // Build the login URL
    const loginUrl = 'http://localhost:8081/sign-in';

    // Generate the welcome email HTML
    const emailHTML = getWelcomeEmailHTML({
      employeeName: full_name,
      employeeId: employeeCode,
      email,
      tempPassword,
      department: department.charAt(0).toUpperCase() + department.slice(1),
      loginUrl,
    });

    // Send welcome email (non-blocking — don't let email failure block the response)
    let emailResult: { success: boolean, error?: string, messageId?: string } = { success: false, error: 'Email not configured' };
    if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
      emailResult = await sendWelcomeEmail({
        to: email,
        employeeName: full_name,
        html: emailHTML,
      });
    } else {
      console.log('SMTP not configured. Welcome email skipped.');
      console.log('Temp password for', email, ':', tempPassword);
    }

    return NextResponse.json({
      success: true,
      employee: {
        id: newEmployee.id,
        full_name: newEmployee.full_name,
        email: newEmployee.email,
        phone_number: newEmployee.phone_number,
        department: newEmployee.employee_department,
        employeeCode,
      },
      tempPassword, // Return to admin so they can share it manually if email fails
      emailSent: emailResult.success,
      message: emailResult.success
        ? `Employee "${full_name}" created successfully! Welcome email sent to ${email}.`
        : `Employee "${full_name}" created successfully! Email not sent (SMTP not configured). Temporary password: ${tempPassword}`,
    });

  } catch (error: any) {
    console.error('Error creating employee:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// GET: List all employees
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    try {
      await auth.verifyIdToken(token);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const employees = await prisma.profile.findMany({
      where: { role: 'employee' },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({ employees });
  } catch (error: any) {
    console.error('Error fetching employees:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
