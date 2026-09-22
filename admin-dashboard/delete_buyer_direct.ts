import { config } from 'dotenv';
config();
import { PrismaClient } from '@prisma/client';
import { auth } from './src/lib/firebase-admin';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.profile.findMany({
    where: {
      phone_number: { contains: '7569314202' }
    }
  });

  console.log(`Found ${users.length} users to delete.`);

  for (const user of users) {
    try {
      await auth.deleteUser(user.id);
      console.log(`Deleted user ${user.id} from Firebase.`);
    } catch (e: any) {
      console.log(`Failed to delete user ${user.id} from Firebase: ${e.message}`);
    }

    await prisma.transaction.deleteMany({ where: { user_id: user.id } });
    await prisma.investment.deleteMany({ where: { user_id: user.id } });
    try {
      await prisma.profile.delete({ where: { id: user.id } });
      console.log(`Deleted user ${user.id} from PostgreSQL.`);
    } catch (dbErr: any) {
      console.error(`Error deleting user ${user.id} from PostgreSQL: ${dbErr.message}`);
    }
  }

  console.log('Cleanup complete.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
