"use client";

import React, { Suspense, useState, useEffect } from 'react';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function EmployeeLoginForm() {
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const router = useRouter();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 2 && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEmail = identifier.includes('@');
    
    if (isEmail) {
      if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(identifier)) {
        setError('Please enter a valid email address.');
        return;
      }
    } else {
      const cleanedPhone = identifier.replace(/\D/g, '').slice(-10);
      if (cleanedPhone.length !== 10 || !/^[6-9]/.test(cleanedPhone)) {
        setError('Please enter a valid 10-digit mobile number.');
        return;
      }
    }
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const endpoint = isEmail ? '/api/otp/send-email' : '/api/otp/send';
      const payload = isEmail ? { email: identifier.trim(), action: 'login' } : { phone: identifier.replace(/\D/g, '').slice(-10), action: 'login' };
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to send OTP.');
      }
      
      setSuccess('OTP sent successfully!');
      setStep(2);
      setResendTimer(60);
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
      const payloadId = identifier.includes('@') ? identifier.trim() : identifier.replace(/\D/g, '').slice(-10);
      const res = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: payloadId, otp }),
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
        if (roleData.profile.role === 'employee' || roleData.profile.role === 'admin' || roleData.profile.role === 'superadmin') {
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
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', padding: '16px' }}>
      <div style={{ background: '#FFF', padding: 'clamp(22px, 6vw, 40px)', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', width: '100%', maxWidth: '400px' }}>
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
                  placeholder="email@example.com or 9876543210"
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={loading || !identifier}
              style={{ marginTop: '10px', width: '100%', padding: '14px', background: '#059669', color: '#FFF', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 700, cursor: loading || !identifier ? 'not-allowed' : 'pointer', opacity: loading || !identifier ? 0.7 : 1 }}
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
              Change Email / Mobile Number
            </button>

            <button
              type="button"
              onClick={handleSendOtp}
              disabled={resendTimer > 0 || loading}
              style={{ background: 'none', border: 'none', color: resendTimer > 0 ? '#94A3B8' : '#059669', fontSize: '14px', cursor: resendTimer > 0 ? 'not-allowed' : 'pointer', marginTop: '4px', fontWeight: resendTimer > 0 ? 'normal' : 'bold' }}
            >
              {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : "Didn't receive the OTP? Resend"}
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
