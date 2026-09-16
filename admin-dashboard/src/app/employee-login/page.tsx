"use client";

import React, { Suspense, useState } from 'react';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function EmployeeLoginForm() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to send OTP.');
      }
      
      setSuccess('OTP sent successfully!');
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP.');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // 1. Verify OTP with our backend
      const res = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: phone, otp }),
      });
      const data = await res.json();
      
      if (!data.success || !data.firebaseToken) {
        throw new Error(data.error || 'Failed to verify OTP.');
      }

      // 2. Sign in with the returned custom token
      const userCredential = await signInWithCustomToken(auth, data.firebaseToken);
      const token = await userCredential.user.getIdToken();
      
      // 3. Verify Employee Role
      const roleRes = await fetch('/api/users/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      const roleData = await roleRes.json();
      
      if (roleData.success && roleData.profile) {
        if (roleData.profile.role === 'employee' || roleData.profile.role === 'admin') {
          // Successfully authenticated as employee
          setSuccess('Login successful! Redirecting...');
          router.push('/');
        } else {
          await auth.signOut();
          setError('Access Denied. You do not have employee privileges.');
        }
      } else {
        await auth.signOut();
        setError('Failed to verify user profile.');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid OTP or authentication failed.');
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
          <h2 style={{ fontSize: '18px', color: '#475569', margin: 0 }}>Employee Login</h2>
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
          <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Employee Mobile Number</label>
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
            
            <button 
              type="submit" 
              disabled={loading || phone.length !== 10}
              style={{ 
                marginTop: '10px', 
                width: '100%', 
                padding: '14px', 
                backgroundColor: '#059669', // Emerald accent for Employees
                color: '#FFF', 
                border: 'none', 
                borderRadius: '8px', 
                fontSize: '15px', 
                fontWeight: 700, 
                cursor: loading || phone.length !== 10 ? 'not-allowed' : 'pointer', 
                opacity: loading || phone.length !== 10 ? 0.7 : 1 
              }}
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
              style={{ 
                marginTop: '10px', 
                width: '100%', 
                padding: '14px', 
                backgroundColor: '#059669', 
                color: '#FFF', 
                border: 'none', 
                borderRadius: '8px', 
                fontSize: '15px', 
                fontWeight: 700, 
                cursor: loading || otp.length !== 6 ? 'not-allowed' : 'pointer', 
                opacity: loading || otp.length !== 6 ? 0.7 : 1 
              }}
            >
              {loading ? 'Verifying...' : 'Sign In as Employee'}
            </button>
            
            <button
              type="button"
              onClick={() => { setStep(1); setOtp(''); setError(''); setSuccess(''); }}
              style={{ background: 'none', border: 'none', color: '#64748B', fontSize: '14px', cursor: 'pointer', marginTop: '8px' }}
            >
              Change Mobile Number
            </button>
          </form>
        )}

        <div style={{ marginTop: '24px', position: 'relative', textAlign: 'center' }}>
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, borderTop: '1px solid #E2E8F0' }}></div>
          <span style={{ background: '#FFF', padding: '0 12px', color: '#64748B', fontSize: '14px', position: 'relative' }}>OR</span>
        </div>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: '#64748B' }}>
          Are you an Admin? <Link href="/login" style={{ color: '#2563EB', fontWeight: 600, textDecoration: 'none' }}>Admin Login</Link>
        </div>
      </div>
    </div>
  );
}

export default function EmployeeLogin() {
  return (
    <Suspense fallback={null}>
      <EmployeeLoginForm />
    </Suspense>
  );
}
