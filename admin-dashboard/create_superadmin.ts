import 'dotenv/config';
import prisma from './src/lib/prisma';
import { auth } from './src/lib/firebase-admin';

async function main() {
  const phone = '+916302662448';
  let uid = '';

  console.log(`Starting Super Admin creation for ${phone}...`);

  // 1. Create in Firebase Auth
  try {
    const userRecord = await auth.createUser({
      phoneNumber: phone,
      displayName: 'Super Admin',
    });
    uid = userRecord.uid;
    console.log(`Created Firebase user with UID: ${uid}`);
  } catch (err: any) {
    if (err.code === 'auth/phone-number-already-exists') {
      console.log('Phone number already exists in Firebase Auth. Fetching UID...');
      const userRecord = await auth.getUserByPhoneNumber(phone);
      uid = userRecord.uid;
      console.log(`Fetched Firebase user with UID: ${uid}`);
    } else {
      console.error('Error creating Firebase user:', err);
      return;
    }
  }

  // 2. Create in Prisma
  try {
    // Check if exists
    const existing = await prisma.profile.findFirst({ where: { phone_number: phone } });
    if (existing) {
      console.log('Profile already exists in Prisma. Upgrading role...');
      await prisma.profile.update({
        where: { id: existing.id },
        data: { role: 'superadmin', is_approved: true }
      });
      console.log('Upgraded existing profile to superadmin.');
    } else {
      console.log('Creating new profile in Prisma...');
      await prisma.profile.create({
        data: {
          id: uid,
          phone_number: phone,
          full_name: 'Super Admin',
          role: 'superadmin',
          is_approved: true,
          kyc_status: 'approved',
        }
      });
      console.log('Created new Prisma profile as superadmin.');
    }
  } catch (err) {
    console.error('Error in Prisma:', err);
  }
  
  console.log('Process complete!');
}

main().catch(console.error);
