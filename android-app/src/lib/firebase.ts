import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, initializeAuth, browserLocalPersistence, GoogleAuthProvider, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase — wrapped in try-catch so the app doesn't crash
// if Firebase config is missing or invalid.
let app: FirebaseApp;
let auth: Auth;
let storage: FirebaseStorage;

try {
  const isNewApp = !getApps().length;
  app = isNewApp ? initializeApp(firebaseConfig) : getApp();

  // On web, use initializeAuth with browserLocalPersistence to avoid
  // Safari's "Advanced Privacy Protections" warning.  The default
  // getAuth() uses indexedDB persistence which can trigger cross-origin
  // storage issues under Safari's Intelligent Tracking Prevention (ITP).
  if (Platform.OS === 'web') {
    if (isNewApp) {
      auth = initializeAuth(app, {
        persistence: browserLocalPersistence,
      });
    } else {
      auth = getAuth(app);
    }
  } else {
    // For Native (iOS/Android), use AsyncStorage for persistence
    if (isNewApp) {
      const { getReactNativePersistence } = require('firebase/auth');
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } else {
      auth = getAuth(app);
    }
  }

  storage = getStorage(app);
} catch (e) {
  console.error('Firebase init failed (non-fatal):', e);
  // Create fallback — the app will run but auth features won't work
  app = null as any;
  auth = null as any;
  storage = null as any;
}

export { app, auth, storage };
export const googleProvider = new GoogleAuthProvider();
