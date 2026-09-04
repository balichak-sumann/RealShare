"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { disconnectSocket } from '@/lib/socket';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, logout: async () => {} });

const publicPaths = ['/login', '/signup', '/agent-login'];
// Pages that manage their own unauthenticated-access flow (exempted from the
// pre-auth redirect below) and are an authenticated agent's home base.
const agentPaths = ['/agent-login', '/agent-portal'];
// Everywhere an authenticated agent is allowed to browse -- agentPaths plus
// the shared Messages inbox, so an agent can reply to their investors'
// advisor conversations from desktop without being bounced back to the
// portal. Deliberately does NOT include /tickets or other admin-only pages.
const agentAllowedPaths = [...agentPaths, '/messages'];

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
          // If they are on the signup page, the profile is currently being created by
          // /api/users/sync. Do not interrupt it. The signup page will redirect them.
          if (pathname === '/signup') return;
          
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
          if (!agentAllowedPaths.includes(pathname)) {
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
    disconnectSocket();
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
