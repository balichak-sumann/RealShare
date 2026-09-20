"use client";

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';

export default function AuditLogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/audit', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await res.json();
        
        if (data.success) {
          setLogs(data.logs);
        } else {
          setError(data.error || 'Failed to load audit logs.');
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchLogs();
  }, [user]);

  return (
    <AdminLayout title="Employee Audit Logs">
      <div style={{ background: '#FFF', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <h2 style={{ margin: '0 0 20px 0', color: '#1E293B', fontSize: '18px' }}>Action History</h2>
        
        {error && <div style={{ color: 'red', marginBottom: '16px' }}>{error}</div>}
        
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>Loading logs...</div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>No audit logs found. Actions performed by employees will appear here.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #E2E8F0' }}>
                  <th style={{ padding: '12px', color: '#475569', fontWeight: 600 }}>Date & Time</th>
                  <th style={{ padding: '12px', color: '#475569', fontWeight: 600 }}>Employee</th>
                  <th style={{ padding: '12px', color: '#475569', fontWeight: 600 }}>Action</th>
                  <th style={{ padding: '12px', color: '#475569', fontWeight: 600 }}>Entity</th>
                  <th style={{ padding: '12px', color: '#475569', fontWeight: 600 }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '12px', color: '#64748B', whiteSpace: 'nowrap' }}>
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px', color: '#334155', fontWeight: 500 }}>
                      {log.employee?.full_name || 'Unknown'} <br/>
                      <span style={{ fontSize: '12px', color: '#94A3B8' }}>{log.employee?.email}</span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ background: '#E0F2FE', color: '#0369A1', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: '#334155' }}>
                      {log.entity_type} <br/>
                      <span style={{ fontSize: '12px', color: '#94A3B8', fontFamily: 'monospace' }}>{log.entity_id}</span>
                    </td>
                    <td style={{ padding: '12px', color: '#64748B', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <pre style={{ margin: 0, fontSize: '12px', background: '#F8FAFC', padding: '8px', borderRadius: '4px', whiteSpace: 'pre-wrap' }}>
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
