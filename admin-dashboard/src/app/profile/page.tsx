"use client";

import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import AdminLayout from "@/components/layout/AdminLayout";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { userProfile, user, logout } = useAuth();
  const router = useRouter();

  if (!userProfile && !user) {
    return (
      <AdminLayout title="Profile">
        <div style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>
          Loading profile...
        </div>
      </AdminLayout>
    );
  }

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      await logout();
      router.push('/login');
    }
  };

  const hasAvatar = !!userProfile?.avatar_url;
  const initial = user?.email?.[0]?.toUpperCase() || "A";

  return (
    <AdminLayout title="My Profile">
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{
          backgroundColor: '#fff',
          borderRadius: 16,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          overflow: 'hidden'
        }}>
          {/* Header Background */}
          <div style={{
            height: 120,
            background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
          }} />
          
          <div style={{ padding: '0 32px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: -60 }}>
            {/* Avatar */}
            <div style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: '#fff',
              border: '4px solid #fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              overflow: 'hidden',
              marginBottom: 16
            }}>
              {hasAvatar ? (
                <img 
                  src={userProfile.avatar_url} 
                  alt="Profile" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#f1f5f9',
                  border: '2px dashed #cbd5e1',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 48,
                  color: '#94a3b8'
                }}>
                  👤
                </div>
              )}
            </div>

            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1e293b', margin: '0 0 4px 0' }}>
              {userProfile?.full_name || user?.email?.split('@')[0] || 'Unknown User'}
            </h2>
            <p style={{ fontSize: 14, color: '#64748b', textTransform: 'capitalize', margin: 0, fontWeight: 500 }}>
              {userProfile?.role === 'superadmin' ? 'Super Administrator' : userProfile?.role || 'Administrator'}
              {userProfile?.employee_department && ` • ${userProfile.employee_department}`}
            </p>

            <div style={{ width: '100%', marginTop: 32 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '16px 0',
                borderBottom: '1px solid #e2e8f0'
              }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 16, fontSize: 20 }}>
                  ✉️
                </div>
                <div>
                  <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 2px 0', fontWeight: 600, textTransform: 'uppercase' }}>Email ID</p>
                  <p style={{ fontSize: 15, color: '#1e293b', margin: 0, fontWeight: 500 }}>{userProfile?.email || user?.email || 'Not provided'}</p>
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '16px 0',
                borderBottom: '1px solid #e2e8f0'
              }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 16, fontSize: 20 }}>
                  📞
                </div>
                <div>
                  <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 2px 0', fontWeight: 600, textTransform: 'uppercase' }}>Phone Number</p>
                  <p style={{ fontSize: 15, color: '#1e293b', margin: 0, fontWeight: 500 }}>{userProfile?.phone_number || 'Not provided'}</p>
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '16px 0',
                borderBottom: '1px solid #e2e8f0'
              }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 16, fontSize: 20 }}>
                  #️⃣
                </div>
                <div>
                  <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 2px 0', fontWeight: 600, textTransform: 'uppercase' }}>Employee ID</p>
                  <p style={{ fontSize: 15, color: '#1e293b', margin: 0, fontWeight: 500, fontFamily: 'monospace' }}>{userProfile?.id || 'N/A'}</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              style={{
                marginTop: 40,
                width: '100%',
                padding: '16px',
                backgroundColor: '#fef2f2',
                color: '#ef4444',
                border: '1px solid #fca5a5',
                borderRadius: 12,
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#fee2e2';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#fef2f2';
              }}
            >
              🚪 Sign Out
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
