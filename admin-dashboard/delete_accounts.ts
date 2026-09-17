import prisma from './src/lib/prisma';
import { auth } from './src/lib/firebase-admin';

async function main() {
  const users = await prisma.profile.findMany({
    where: {
      OR: [
        { phone_number: { contains: '9988776655' } },
        { id: { contains: '9988776655' } }
      ]
    }
  });

  console.log(`Found ${users.length} users to delete.`);

  for (const user of users) {
    try {
      // 1. Delete from Firebase if it exists
      await auth.deleteUser(user.id);
      console.log(`Deleted user ${user.id} from Firebase.`);
    } catch (e: any) {
      console.log(`Failed to delete user ${user.id} from Firebase: ${e.message}`);
    }

    // 2. Delete related records in DB (transactions, investments, etc.)
    await prisma.transaction.deleteMany({ where: { user_id: user.id } });
    await prisma.investment.deleteMany({ where: { user_id: user.id } });
    // Note: notification doesn't have user_id, chatMessage might exist
    // Let's just catch errors on DB deletes in case of other relations
    try {
      await prisma.profile.delete({ where: { id: user.id } });
      console.log(`Deleted user ${user.id} from PostgreSQL.`);
    } catch (dbErr: any) {
      console.error(`Error deleting user ${user.id} from PostgreSQL: ${dbErr.message}`);
    }
  }

  console.log('Cleanup complete.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
