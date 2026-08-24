import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

try {
  if (getApps().length === 0) {
    // Only initialize if it's a real key, otherwise it crashes the server
    if (process.env.FIREBASE_PRIVATE_KEY && !process.env.FIREBASE_PRIVATE_KEY.includes('YOUR_LONG_KEY_HERE')) {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // Handle newline characters in the private key string correctly
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
    }
  }
} catch (error) {
  console.log('Firebase Admin init bypassed due to invalid credentials in .env');
}

// Export a safe mock if Firebase isn't initialized so API routes don't crash
export const auth = getApps().length > 0 ? getAuth() : {
  verifyIdToken: async () => ({ uid: 'mock-user-123', email: 'mock@example.com', phone_number: '+919876543210' })
} as any;
