'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

interface Profile {
  id: string;
  full_name: string;
  role: string;
  phone_number?: string;
  email?: string;
  deleted_at: string;
}

export default function DeletedUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchDeletedUsers();
  }, []);

  const getAuthHeader = async () => {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      router.push('/employee-login');
      return null;
    }
    return { 'Authorization': `Bearer ${token}` };
  };

  const fetchDeletedUsers = async () => {
    setLoading(true);
    const headers = await getAuthHeader();
    if (!headers) return;

    try {
      const res = await fetch('/api/users/deleted', { headers });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        showMessage('Failed to load deleted users', 'error');
      }
    } catch (e) {
      showMessage('An error occurred', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleRevoke = async (id: string) => {
    if (!window.confirm('Are you sure you want to revoke deletion for this user? They will be able to log in again.')) return;
    
    const headers = await getAuthHeader();
    if (!headers) return;

    try {
      const res = await fetch(`/api/users/deleted/${id}/revoke`, {
        method: 'POST',
        headers
      });
      if (res.ok) {
        showMessage('Account restored successfully', 'success');
        setUsers(users.filter(u => u.id !== id));
      } else {
        showMessage('Failed to restore account', 'error');
      }
    } catch (e) {
      showMessage('An error occurred', 'error');
    }
  };

  const handlePermanentDelete = async (id: string) => {
    if (!window.confirm('WARNING: This will permanently delete the user and all their data from the database and Firebase. This action CANNOT BE UNDONE. Are you sure?')) return;
    
    const headers = await getAuthHeader();
    if (!headers) return;

    try {
      const res = await fetch(`/api/users/deleted/${id}`, {
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        showMessage('Account permanently deleted', 'success');
        setUsers(users.filter(u => u.id !== id));
      } else {
        showMessage('Failed to delete account', 'error');
      }
    } catch (e) {
      showMessage('An error occurred', 'error');
    }
  };

  const calculateDaysRemaining = (deletedAtStr: string) => {
    const deletedAt = new Date(deletedAtStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - deletedAt.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, 30 - diffDays);
  };

  return (
    <AdminLayout title="Deleted Accounts (Soft Deletions)">
      {message && (
        <div style={{ background: message.type === 'success' ? '#16A34A' : '#DC2626', color: '#fff', padding: '12px 20px', borderRadius: 8, marginBottom: 20, fontWeight: 600 }}>
          {message.text}
        </div>
      )}

      <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
        <h4 style={{ color: '#991B1B', margin: '0 0 8px 0' }}>About Account Deletions</h4>
        <p style={{ color: '#7F1D1D', margin: 0, fontSize: '0.9rem' }}>
          When a user deletes their account from the app, they are soft-deleted and placed here. Their login is disabled. 
          You have 30 days to revoke the deletion if they contact support. After 30 days, you can permanently delete them, or set up a background job to do it automatically.
        </p>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Loading deleted accounts...</p>
      ) : users.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: 16, border: '1px dashed var(--border-color)' }}>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>No pending account deletions.</p>
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--bg-secondary)', borderRadius: 12, overflow: 'hidden' }}>
          <thead>
            <tr style={{ background: 'var(--bg-tertiary)', textAlign: 'left' }}>
              <th style={{ padding: 16, color: 'var(--text-secondary)', fontWeight: 600 }}>User Info</th>
              <th style={{ padding: 16, color: 'var(--text-secondary)', fontWeight: 600 }}>Role</th>
              <th style={{ padding: 16, color: 'var(--text-secondary)', fontWeight: 600 }}>Deleted On</th>
              <th style={{ padding: 16, color: 'var(--text-secondary)', fontWeight: 600 }}>Days Left</th>
              <th style={{ padding: 16, color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: 16 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user.full_name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {user.phone_number || user.email || 'No contact info'}
                  </div>
                </td>
                <td style={{ padding: 16, color: 'var(--text-primary)', textTransform: 'capitalize' }}>{user.role}</td>
                <td style={{ padding: 16, color: 'var(--text-secondary)' }}>
                  {new Date(user.deleted_at).toLocaleDateString()}
                </td>
                <td style={{ padding: 16 }}>
                  {calculateDaysRemaining(user.deleted_at) <= 5 ? (
                     <span style={{ color: '#DC2626', fontWeight: 600 }}>{calculateDaysRemaining(user.deleted_at)} Days (Critical)</span>
                  ) : (
                     <span style={{ color: '#D97706', fontWeight: 600 }}>{calculateDaysRemaining(user.deleted_at)} Days</span>
                  )}
                </td>
                <td style={{ padding: 16, textAlign: 'right' }}>
                  <button 
                    onClick={() => handleRevoke(user.id)}
                    style={{ background: '#10B981', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 6, fontWeight: 600, cursor: 'pointer', marginRight: 8 }}
                  >
                    Revoke
                  </button>
                  <button 
                    onClick={() => handlePermanentDelete(user.id)}
                    style={{ background: '#DC2626', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Delete Now
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </AdminLayout>
  );
}
