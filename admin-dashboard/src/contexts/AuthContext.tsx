"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, logout: async () => {} });

const publicPaths = ['/login', '/signup', '/agent-login'];
const agentPaths = ['/agent-login', '/agent-portal'];

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Pre-auth redirect: unauthenticated visitors get sent to /login (unchanged behavior).
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      if (!firebaseUser && !publicPaths.includes(pathname) && !agentPaths.includes(pathname)) {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [pathname, router]);

  // Post-auth role gate: once we have a signed-in Firebase user, look up their
  // profile role and route them to the portal that matches it. Agents never
  // land in the admin dashboard, and non-admin/employee/agent roles (investor,
  // builder, no profile at all) are not authorized for either portal and get
  // signed out.
  useEffect(() => {
    if (loading || !user) return;

    // Let the agent-login page run its own role check/sign-out flow without
    // us racing it (it already verifies role via /api/users/sync).
    if (pathname === '/agent-login') return;

    let cancelled = false;

    (async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (cancelled) return;

        if (!res.ok) {
          // No profile (or lookup failed) - not authorized for this portal.
          // Safe to always sign out here: once signed out, `user` becomes
          // null and this effect no-ops on the next run, so there's no
          // redirect loop even if we're already sitting on /login.
          await signOut(auth);
          router.push('/login?unauthorized=1');
          return;
        }

        const profile = await res.json();
        const role = profile?.role;

        if (role === 'admin' || role === 'employee') {
          if (pathname === '/login' || pathname === '/signup') {
            router.push('/');
          }
        } else if (role === 'agent') {
          if (!agentPaths.includes(pathname)) {
            router.push('/agent-portal');
          }
        } else {
          // investor, builder, or any other role not permitted in this dashboard
          await signOut(auth);
          router.push('/login?unauthorized=1');
        }
      } catch (e) {
        if (cancelled) return;
        await signOut(auth);
        router.push('/login?unauthorized=1');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, loading, pathname, router]);

  const logout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
