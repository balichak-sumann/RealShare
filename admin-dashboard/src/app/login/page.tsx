"use client";

import React, { useState } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // AuthContext will handle redirect
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address first to reset your password.');
      return;
    }
    
    setResetLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(`Password reset link sent to ${email}`);
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email');
    } finally {
      setResetLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
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
          <h2 style={{ fontSize: '18px', color: '#475569', margin: 0 }}>Admin Portal Login</h2>
        </div>

        {error && (
          <div style={{ background: '#FEF2F2', color: '#DC2626', padding: '12px', borderRadius: '8px', fontSize: '14px', marginBottom: '20px', border: '1px solid #FCA5A5' }}>
            {error}
          </div>
        )}
        
        {success && (
          <div style={{ background: '#ECFDF5', color: '#059669', padding: '12px', borderRadius: '8px', fontSize: '14px', marginBottom: '20px', border: '1px solid #6EE7B7' }}>
            {success}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Email Address</label>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>Password</label>
              <button 
                type="button" 
                onClick={handleForgotPassword}
                disabled={resetLoading}
                style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: '13px', fontWeight: 600, cursor: resetLoading ? 'not-allowed' : 'pointer', padding: 0 }}
              >
                {resetLoading ? 'Sending...' : 'Forgot Password?'}
              </button>
            </div>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '15px' }}
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ marginTop: '10px', width: '100%', padding: '14px', background: '#1E40AF', color: '#FFF', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }}></div>
          <span style={{ padding: '0 12px', color: '#64748B', fontSize: '14px', fontWeight: 500 }}>OR</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }}></div>
        </div>

        <button 
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{ width: '100%', padding: '14px', background: '#FFF', color: '#334155', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Sign in with Google
        </button>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: '#64748B' }}>
          Need to set up the first admin? <Link href="/signup" style={{ color: '#2563EB', fontWeight: 600, textDecoration: 'none' }}>Create Account</Link>
        </div>
      </div>
    </div>
  );
}
