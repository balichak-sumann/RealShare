import 'dotenv/config'; // Load .env before everything else!
import prisma from './src/lib/prisma';
import { auth } from './src/lib/firebase-admin';

async function main() {
  const phone = '+916302662448';
  
  console.log(`Starting deletion for ${phone}...`);
  
  // 1. Delete from Firebase Auth
  try {
    const userRecord = await auth.getUserByPhoneNumber(phone);
    console.log(`Found in Firebase (UID: ${userRecord.uid}). Deleting...`);
    await auth.deleteUser(userRecord.uid);
    console.log(`Deleted from Firebase Auth.`);
  } catch (err: any) {
    if (err.code === 'auth/user-not-found') {
      console.log('Not found in Firebase Auth.');
    } else {
      console.error('Error deleting from Firebase:', err);
    }
  }

  // 2. Delete from Prisma
  try {
    const profile = await prisma.profile.findFirst({
      where: { phone_number: phone }
    });
    
    if (profile) {
      console.log(`Found in Prisma (ID: ${profile.id}). Deleting...`);
      await prisma.profile.delete({ where: { id: profile.id } });
      console.log(`Deleted from Prisma.`);
    } else {
      console.log(`Not found in Prisma.`);
    }
  } catch (err) {
    console.error('Error deleting from Prisma:', err);
  }
}

main().catch(console.error);
