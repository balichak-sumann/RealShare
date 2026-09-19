import prisma from './src/lib/prisma';
import { auth } from './src/lib/firebase-admin';

async function main() {
  const phoneNumber = '+916302662448';
  let uid = '';

  try {
    // Check if user exists in Firebase
    const userRecord = await auth.getUserByPhoneNumber(phoneNumber);
    uid = userRecord.uid;
    console.log(`User already exists in Firebase with UID: ${uid}`);
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      // Create user in Firebase
      console.log(`User not found in Firebase. Creating new user...`);
      const newUser = await auth.createUser({
        phoneNumber: phoneNumber,
        displayName: 'Admin User'
      });
      uid = newUser.uid;
      console.log(`Created Firebase user with UID: ${uid}`);
    } else {
      throw error;
    }
  }

  // Check if user exists in PostgreSQL
  const existingProfile = await prisma.profile.findUnique({
    where: { id: uid }
  });

  if (existingProfile) {
    console.log(`Profile already exists in PostgreSQL. Updating role to admin...`);
    await prisma.profile.update({
      where: { id: uid },
      data: { role: 'admin', is_approved: true, phone_number: phoneNumber.replace('+91', '') }
    });
    console.log(`Updated profile to admin.`);
  } else {
    console.log(`Profile not found in PostgreSQL. Creating new admin profile...`);
    await prisma.profile.create({
      data: {
        id: uid,
        phone_number: phoneNumber.replace('+91', ''),
        full_name: 'Admin User',
        role: 'admin',
        is_approved: true
      }
    });
    console.log(`Created new admin profile in PostgreSQL.`);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
