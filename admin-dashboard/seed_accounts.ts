import 'dotenv/config';
import { auth } from './src/lib/firebase-admin.ts';
import prisma from './src/lib/prisma.ts';

async function main() {
  console.log('Seeding 5 Demo Accounts...');

  const accounts = [
    { email: 'admin@realshare.com', role: 'admin', name: 'Admin Demo' },
    { email: 'emp@realshare.com', role: 'employee', name: 'Employee Demo' },
    { email: 'investor@realshare.com', role: 'investor', name: 'Investor Demo' },
    { email: 'agent@realshare.com', role: 'agent', name: 'Agent Demo' },
    { email: 'builder@realshare.com', role: 'builder', name: 'Builder Demo' },
  ];

  const password = 'Password@123';

  for (const acc of accounts) {
    let firebaseUser;
    
    try {
      firebaseUser = await auth.getUserByEmail(acc.email);
      console.log(`User ${acc.email} already exists in Firebase. Updating password...`);
      await auth.updateUser(firebaseUser.uid, { password });
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') {
        console.log(`Creating ${acc.email} in Firebase...`);
        firebaseUser = await auth.createUser({
          email: acc.email,
          password: password,
          displayName: acc.name,
          emailVerified: true
        });
      } else {
        console.error(`Error with Firebase user ${acc.email}:`, e);
        continue;
      }
    }

    // Sync to Postgres
    console.log(`Syncing ${acc.email} to Postgres...`);
    await prisma.profile.upsert({
      where: { id: firebaseUser.uid },
      update: {
        role: acc.role,
        full_name: acc.name,
      },
      create: {
        id: firebaseUser.uid,
        email: acc.email,
        full_name: acc.name,
        role: acc.role,
      }
    });

    console.log(`✅ Finished setting up ${acc.email} as ${acc.role}\n`);
  }

  console.log('Done!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
