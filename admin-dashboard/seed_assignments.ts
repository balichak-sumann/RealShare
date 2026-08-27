import 'dotenv/config';
import prisma from './src/lib/prisma';

async function main() {
  console.log('Assigning users to emp@realshare.com...');

  const employee = await prisma.profile.findUnique({
    where: { email: 'emp@realshare.com' }
  });

  if (!employee) {
    console.error('Employee emp@realshare.com not found!');
    return;
  }

  // Get some users
  const users = await prisma.profile.findMany({
    where: { role: 'user' },
    take: 5
  });

  for (const user of users) {
    await prisma.profile.update({
      where: { id: user.id },
      data: { assigned_sales_rep_id: employee.id }
    });
    console.log(`Assigned user ${user.full_name} to emp@realshare.com`);
  }

  console.log('Assignment complete!');
}

main().catch(console.error);
