"use client";

import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bootstrapSecret, setBootstrapSecret] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();

      // Register this user as an ADMIN in the database. The server only grants
      // the admin role here if the bootstrap secret matches — this page is for
      // setting up the very first admin account only. Every admin after that
      // must be created from inside the dashboard by an existing admin.
      const res = await fetch('/api/users/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-admin-bootstrap-secret': bootstrapSecret,
        },
        body: JSON.stringify({ role: 'admin' })
      });
      const data = await res.json().catch(() => null);
      if (data?.profile?.role !== 'admin') {
        setError('Bootstrap secret was incorrect, so an admin account was not created. Ask an existing admin to add you from Employees instead.');
        setLoading(false);
        return;
      }

      // AuthContext will handle redirect to dashboard
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    setError('');

    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const token = await userCredential.user.getIdToken();

      const res = await fetch('/api/users/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-admin-bootstrap-secret': bootstrapSecret,
        },
        body: JSON.stringify({ role: 'admin' })
      });
      const data = await res.json().catch(() => null);
      if (data?.profile?.role !== 'admin') {
        setError('Bootstrap secret was incorrect, so an admin account was not created. Ask an existing admin to add you from Employees instead.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign up with Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
      <div style={{ background: '#FFF', padding: '40px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
            <img src="/logo.png" alt="RealShare Logo" style={{ height: '48px', objectFit: 'contain' }} />
          </div>
          <h2 style={{ fontSize: '18px', color: '#475569', margin: 0 }}>Create Admin Account</h2>
        </div>

        {error && (
          <div style={{ background: '#FEF2F2', color: '#DC2626', padding: '12px', borderRadius: '8px', fontSize: '14px', marginBottom: '20px', border: '1px solid #FCA5A5' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Admin Email Address</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '15px' }}
              placeholder="admin@realshare.com"
            />
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Secure Password</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '15px' }}
              placeholder="••••••••"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Bootstrap Secret</label>
            <input
              type="password"
              required
              value={bootstrapSecret}
              onChange={(e) => setBootstrapSecret(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '15px' }}
              placeholder="Provided out-of-band by RealShare"
            />
            <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '6px' }}>
              This page only creates the first admin account. It matches against the server's ADMIN_BOOTSTRAP_SECRET env var — without it, no admin role is granted.
            </p>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ marginTop: '10px', width: '100%', padding: '14px', background: '#1E40AF', color: '#FFF', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Creating Account...' : 'Create Admin Account'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }}></div>
          <span style={{ padding: '0 12px', color: '#64748B', fontSize: '14px', fontWeight: 500 }}>OR</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }}></div>
        </div>

        <button 
          onClick={handleGoogleSignup}
          disabled={loading}
          style={{ width: '100%', padding: '14px', background: '#FFF', color: '#334155', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Sign up with Google
        </button>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: '#64748B' }}>
          Already have an admin account? <Link href="/login" style={{ color: '#2563EB', fontWeight: 600, textDecoration: 'none' }}>Sign In</Link>
        </div>
      </div>
    </div>
  );
}
