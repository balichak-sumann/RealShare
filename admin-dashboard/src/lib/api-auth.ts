"use client";
import { auth } from "@/lib/firebase";

/**
 * Returns a real Firebase Authorization header for the currently signed-in
 * admin user, or null if nobody is signed in. Never falls back to a fake
 * token — callers should treat null as "not authenticated" and stop.
 */
export async function getAuthHeader(): Promise<{ Authorization: string } | null> {
  const user = auth.currentUser;
  if (!user) return null;
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}
