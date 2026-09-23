import { PrismaClient } from '@prisma/client';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

// Initialize Firebase Admin if not already initialized
if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Replace literal \n with actual newline characters
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const auth = getAuth();

async function cleanupDeletedUsers() {
  console.log('Starting cleanup of deleted users...');
  
  // Calculate date 30 days ago
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  try {
    // Find all users who were deleted more than 30 days ago
    const usersToDelete = await prisma.profile.findMany({
      where: {
        deleted_at: {
          not: null,
          lt: thirtyDaysAgo
        }
      }
    });

    if (usersToDelete.length === 0) {
      console.log('No users found pending permanent deletion.');
      return;
    }

    console.log(`Found ${usersToDelete.length} users to permanently delete.`);

    let successCount = 0;
    let failCount = 0;

    for (const user of usersToDelete) {
      try {
        console.log(`Permanently deleting user: ${user.id} (${user.email || user.phone_number})`);
        
        // 1. Delete from database
        await prisma.profile.delete({
          where: { id: user.id }
        });

        // 2. Delete from Firebase Auth
        try {
          await auth.deleteUser(user.id);
        } catch (fbError: any) {
          // If user doesn't exist in Firebase, ignore
          if (fbError.code !== 'auth/user-not-found') {
            console.error(`Failed to delete user ${user.id} from Firebase:`, fbError.message);
          }
        }

        successCount++;
      } catch (err: any) {
        console.error(`Failed to delete user ${user.id}:`, err.message);
        failCount++;
      }
    }

    console.log(`Cleanup complete. Successfully deleted: ${successCount}. Failed: ${failCount}.`);
  } catch (error) {
    console.error('Fatal error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
cleanupDeletedUsers();
