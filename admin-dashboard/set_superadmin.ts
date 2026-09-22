import prisma from './src/lib/prisma';
import { auth } from './src/lib/firebase-admin';

async function main() {
  const targetInput = process.argv[2] || '+916302662448';
  console.log(`Searching for user with identifier: ${targetInput}...`);

  let profile = null;

  // 1. Try finding by email
  if (targetInput.includes('@')) {
    profile = await prisma.profile.findFirst({
      where: { email: { equals: targetInput, mode: 'insensitive' } }
    });
  } else {
    // 2. Try finding by phone number or ID
    const cleanPhone = targetInput.replace('+91', '').trim();
    profile = await prisma.profile.findFirst({
      where: {
        OR: [
          { id: targetInput },
          { phone_number: cleanPhone },
          { phone_number: targetInput }
        ]
      }
    });
  }

  if (!profile) {
    console.error(`❌ Profile not found in database for identifier: ${targetInput}`);
    console.log(`Searching all admin users to help you pick...`);
    const admins = await prisma.profile.findMany({
      where: { OR: [{ role: 'admin' }, { role: 'superadmin' }] },
      select: { id: true, email: true, phone_number: true, full_name: true, role: true }
    });
    console.log('Current Admins/Superadmins:', admins);
    process.exit(1);
  }

  console.log(`Found profile: ID=${profile.id}, Name=${profile.full_name}, Current Role=${profile.role}`);

  const updated = await prisma.profile.update({
    where: { id: profile.id },
    data: { role: 'superadmin', is_approved: true }
  });

  console.log(`✅ SUCCESS: Upgraded user ${updated.full_name || updated.email || updated.id} to role 'superadmin'!`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
