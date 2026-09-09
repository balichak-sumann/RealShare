"use client";
import { auth } from "@/lib/firebase";

/**
 * Returns a real Firebase Authorization header for the currently signed-in
 * admin user, or null if nobody is signed in.
 *
 * This correctly waits for Firebase auth to rehydrate its persisted session
 * before checking — fixing the race condition where auth.currentUser is null
 * on mount even though the user is logged in.
 */
export async function getAuthHeader(): Promise<{ Authorization: string } | null> {
  // Fast path: if auth is already hydrated and current user is present
  if (auth.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      return { Authorization: `Bearer ${token}` };
    } catch {
      return null;
    }
  }

  // Otherwise wait for Firebase auth to rehydrate persisted session
  return new Promise((resolve) => {
    let resolved = false;

    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(null);
      }
    }, 6000);

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      unsubscribe();
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);

      if (!user) {
        resolve(null);
        return;
      }
      try {
        const token = await user.getIdToken();
        resolve({ Authorization: `Bearer ${token}` });
      } catch {
        resolve(null);
      }
    });
  });
}
