import { PrismaClient } from '@prisma/client';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });
const prisma = new PrismaClient();

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}
const auth = getAuth();

async function deleteUser() {
  const phone1 = "6302662448";
  const phone2 = "+916302662448";
  
  const user = await prisma.profile.findFirst({
    where: { OR: [{ phone_number: phone1 }, { phone_number: phone2 }] }
  });

  if (!user) {
    console.log('User not found in database.');
  } else {
    console.log(`Found user ${user.id} in DB. Deleting...`);
    await prisma.profile.delete({ where: { id: user.id } });
    console.log('Deleted from DB.');
    
    try {
      await auth.deleteUser(user.id);
      console.log('Deleted from Firebase Auth (by ID).');
    } catch (e: any) {
      console.log('Firebase auth delete by ID failed:', e.message);
    }
  }

  try {
    const fbUser1 = await auth.getUserByPhoneNumber(phone1).catch(() => null);
    if (fbUser1) {
      await auth.deleteUser(fbUser1.uid);
      console.log(`Deleted ${phone1} from Firebase Auth.`);
    }
    const fbUser2 = await auth.getUserByPhoneNumber(phone2).catch(() => null);
    if (fbUser2) {
      await auth.deleteUser(fbUser2.uid);
      console.log(`Deleted ${phone2} from Firebase Auth.`);
    }
  } catch (e: any) {
    console.log('Error checking Firebase Auth:', e.message);
  }
}

deleteUser().finally(() => prisma.$disconnect());
