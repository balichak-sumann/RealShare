"use client";

import React, { useState } from 'react';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Signup() {
  const [identifier, setIdentifier] = useState('');
  const [bootstrapSecret, setBootstrapSecret] = useState('');
  const [role, setRole] = useState<'admin' | 'superadmin'>('admin');
  
  const [otp, setOtp] = useState('');
  
  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSendOtps = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEmail = identifier.includes('@');
    if (isEmail) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
        setError('Please enter a valid email address.');
        return;
      }
    } else {
      const cleanPhone = identifier.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        setError('Please enter a valid 10-digit mobile number.');
        return;
      }
    }
    
    if (!bootstrapSecret) {
      setError('Bootstrap Secret is required.');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isEmail) {
        const emailRes = await fetch('/api/otp/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: identifier.trim() }),
        });
        const emailData = await emailRes.json();
        if (!emailData.success) throw new Error(emailData.error || 'Failed to send Email OTP.');
      } else {
        const phoneRes = await fetch('/api/otp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: identifier.replace(/\D/g, '').slice(-10) }),
        });
        const phoneData = await phoneRes.json();
        if (!phoneData.success) throw new Error(phoneData.error || 'Failed to send Phone OTP.');
      }

      setSuccess(`OTP sent successfully to your ${isEmail ? 'email' : 'mobile'}!`);
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit OTP.');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      // Verify OTP and create Firebase User
      const res = await fetch('/api/auth/signup-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier,
          otp: otp,
          role: role,
          fullName: role === 'superadmin' ? 'Super Admin User' : 'Admin User'
        }),
      });
      const data = await res.json();
      
      if (!data.success || !data.firebaseToken) {
        throw new Error(data.error || 'Failed to verify OTP or create account.');
      }

      // Sign in with the returned custom token
      const userCredential = await signInWithCustomToken(auth, data.firebaseToken);
      const token = await userCredential.user.getIdToken();

      // Register this user as an ADMIN in the database.
      const syncRes = await fetch('/api/users/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-admin-bootstrap-secret': bootstrapSecret,
        },
        body: JSON.stringify({ role })
      });
      
      const syncData = await syncRes.json().catch(() => null);
      if (syncData?.profile?.role !== role) {
        setError('Bootstrap secret was incorrect, so the account was not created. Ask an existing admin to add you from Employees instead.');
        await auth.signOut();
        return;
      }

      // AuthContext will not redirect us away immediately, so we explicitly redirect
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
      <div style={{ background: '#FFF', padding: '40px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
            <img src="/logo.png" alt="Realshare Logo" style={{ height: '48px', objectFit: 'contain' }} />
          </div>
          <h2 style={{ fontSize: '18px', color: '#475569', margin: 0 }}>Create Account</h2>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: '#F1F5F9', padding: '4px', borderRadius: '8px' }}>
          <button
            onClick={() => setRole('admin')}
            style={{
              flex: 1, padding: '8px', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
              background: role === 'admin' ? '#FFF' : 'transparent',
              color: role === 'admin' ? '#1E40AF' : '#64748B',
              boxShadow: role === 'admin' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            Admin
          </button>
          <button
            onClick={() => setRole('superadmin')}
            style={{
              flex: 1, padding: '8px', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
              background: role === 'superadmin' ? '#FFF' : 'transparent',
              color: role === 'superadmin' ? '#1E40AF' : '#64748B',
              boxShadow: role === 'superadmin' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            Super Admin
          </button>
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

        {step === 1 ? (
          <form onSubmit={handleSendOtps} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Email or Mobile Number</label>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #CBD5E1', borderRadius: '8px', overflow: 'hidden' }}>
                {!identifier.includes('@') && identifier.length > 0 && /^[0-9]+$/.test(identifier) && (
                  <div style={{ padding: '12px', background: '#F1F5F9', color: '#64748B', fontWeight: 600, fontSize: '15px', borderRight: '1px solid #CBD5E1' }}>
                    +91
                  </div>
                )}
                <input 
                  type="text" 
                  required 
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', border: 'none', outline: 'none', fontSize: '15px' }}
                  placeholder="admin@realshare.com or 9876543210"
                />
              </div>
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Bootstrap Secret</label>
              <input
                type="password"
                required
                value={bootstrapSecret}
                onChange={(e) => setBootstrapSecret(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '15px' }}
                placeholder="Provided out-of-band by Realshare"
              />
              <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '6px' }}>
                This page only creates the first admin account. It matches against the server's ADMIN_BOOTSTRAP_SECRET env var — without it, no admin role is granted.
              </p>
            </div>

            <button 
              type="submit" 
              disabled={loading || !identifier}
              style={{ marginTop: '10px', width: '100%', padding: '14px', background: '#1E40AF', color: '#FFF', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Sending OTP...' : 'Continue'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifySignup} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Enter 6-digit OTP</label>
              <input 
                type="text" 
                required 
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '15px', letterSpacing: '2px', textAlign: 'center', fontWeight: 'bold' }}
                placeholder="000000"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading || otp.length !== 6}
              style={{ marginTop: '10px', width: '100%', padding: '14px', background: '#1E40AF', color: '#FFF', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Creating Account...' : 'Verify & Create Admin'}
            </button>
            
            <button
              type="button"
              onClick={() => { setStep(1); setOtp(''); setError(''); setSuccess(''); }}
              style={{ background: 'none', border: 'none', color: '#64748B', fontSize: '14px', cursor: 'pointer', marginTop: '8px' }}
            >
              Go Back
            </button>
          </form>
        )}

        <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }}></div>
          <span style={{ padding: '0 12px', color: '#64748B', fontSize: '14px', fontWeight: 500 }}>OR</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }}></div>
        </div>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: '#64748B' }}>
          Already have an admin account? <Link href="/login" style={{ color: '#2563EB', fontWeight: 600, textDecoration: 'none' }}>Sign In</Link>
        </div>
      </div>
    </div>
  );
}
