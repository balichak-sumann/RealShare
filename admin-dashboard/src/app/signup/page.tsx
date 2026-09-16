"use client";

import React, { useState } from 'react';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Signup() {
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [bootstrapSecret, setBootstrapSecret] = useState('');
  
  const [phoneOtp, setPhoneOtp] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  
  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSendOtps = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!bootstrapSecret) {
      setError('Bootstrap Secret is required.');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Send Phone OTP
      const phoneRes = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const phoneData = await phoneRes.json();
      if (!phoneData.success) throw new Error(phoneData.error || 'Failed to send Phone OTP.');

      // Send Email OTP
      const emailRes = await fetch('/api/otp/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const emailData = await emailRes.json();
      if (!emailData.success) throw new Error(emailData.error || 'Failed to send Email OTP.');

      setSuccess('OTPs sent successfully to your mobile and email!');
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTPs');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneOtp || phoneOtp.length !== 6 || !emailOtp || emailOtp.length !== 6) {
      setError('Please enter both 6-digit OTPs.');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      // Verify both OTPs and create Firebase User
      const res = await fetch('/api/auth/signup-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          phoneOtp,
          email,
          emailOtp,
          role: 'admin',
          fullName: 'Admin User'
        }),
      });
      const data = await res.json();
      
      if (!data.success || !data.firebaseToken) {
        throw new Error(data.error || 'Failed to verify OTPs or create account.');
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
        body: JSON.stringify({ role: 'admin' })
      });
      
      const syncData = await syncRes.json().catch(() => null);
      if (syncData?.profile?.role !== 'admin') {
        setError('Bootstrap secret was incorrect, so an admin account was not created. Ask an existing admin to add you from Employees instead.');
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
          <h2 style={{ fontSize: '18px', color: '#475569', margin: 0 }}>Create Admin Account</h2>
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
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Mobile Number</label>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #CBD5E1', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ padding: '12px', background: '#F1F5F9', color: '#64748B', fontWeight: 600, fontSize: '15px', borderRight: '1px solid #CBD5E1' }}>
                  +91
                </div>
                <input 
                  type="tel" 
                  required 
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                  style={{ width: '100%', padding: '12px 16px', border: 'none', outline: 'none', fontSize: '15px' }}
                  placeholder="9876543210"
                />
              </div>
            </div>

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
              disabled={loading || phone.length !== 10 || !email}
              style={{ marginTop: '10px', width: '100%', padding: '14px', background: '#1E40AF', color: '#FFF', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Sending OTPs...' : 'Continue'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifySignup} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Mobile OTP (Sent to {phone})</label>
              <input 
                type="text" 
                required 
                maxLength={6}
                value={phoneOtp}
                onChange={(e) => setPhoneOtp(e.target.value.replace(/[^0-9]/g, ''))}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '15px', letterSpacing: '2px', textAlign: 'center', fontWeight: 'bold' }}
                placeholder="000000"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Email OTP (Sent to {email})</label>
              <input 
                type="text" 
                required 
                maxLength={6}
                value={emailOtp}
                onChange={(e) => setEmailOtp(e.target.value.replace(/[^0-9]/g, ''))}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '15px', letterSpacing: '2px', textAlign: 'center', fontWeight: 'bold' }}
                placeholder="000000"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading || phoneOtp.length !== 6 || emailOtp.length !== 6}
              style={{ marginTop: '10px', width: '100%', padding: '14px', background: '#1E40AF', color: '#FFF', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Creating Account...' : 'Verify & Create Admin'}
            </button>
            
            <button
              type="button"
              onClick={() => { setStep(1); setPhoneOtp(''); setEmailOtp(''); setError(''); setSuccess(''); }}
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
