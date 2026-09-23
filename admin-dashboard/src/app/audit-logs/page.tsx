"use client";

import React, { useCallback, useEffect, useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';

interface AuditRow {
  seq: number;
  id: string;
  employee_id: string | null;
  actor_email: string | null;
  actor_name: string | null;
  actor_role: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  outcome: string;
  before: any;
  after: any;
  details: any;
  ip_address: string | null;
  request_id: string | null;
  created_at: string;
}

const EMPTY_FILTERS = { actor: '', action: '', entityType: '', outcome: '', from: '', to: '' };

export default function AuditLogsPage() {
  const { user, userProfile } = useAuth();
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<any>(null);

  // The API is the real gate (superadmin only); this avoids firing a request
  // guaranteed to 403 and showing an admin a raw error.
  const isSuperAdmin = userProfile?.role === 'superadmin';
  const profileLoaded = !!userProfile;

  const buildQuery = useCallback(
    (cursor?: number | null) => {
      const q = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => v && q.set(k, v));
      if (cursor) q.set('cursor', String(cursor));
      q.set('limit', '100');
      return q.toString();
    },
    [filters]
  );

  const load = useCallback(
    async (cursor?: number | null) => {
      if (!user || !isSuperAdmin) return;
      setLoading(true);
      setError('');
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/audit?${buildQuery(cursor)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setLogs((prev) => (cursor ? [...prev, ...data.logs] : data.logs));
          setNextCursor(data.nextCursor ?? null);
        } else {
          setError(data.error || 'Failed to load audit logs.');
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred.');
      } finally {
        setLoading(false);
      }
    },
    [user, isSuperAdmin, buildQuery]
  );

  useEffect(() => {
    if (profileLoaded && !isSuperAdmin) {
      setLoading(false);
      return;
    }
    load(null);
    // Re-run when identity resolves; filters are applied via the Search button
    // so typing does not fire a request per keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isSuperAdmin, profileLoaded]);

  const runVerify = async () => {
    if (!user) return;
    setVerifying(true);
    setVerifyResult(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/audit/verify', { headers: { Authorization: `Bearer ${token}` } });
      setVerifyResult(await res.json());
    } catch (err: any) {
      setVerifyResult({ success: false, error: err.message });
    } finally {
      setVerifying(false);
    }
  };

  const exportCsv = async () => {
    if (!user) return;
    const token = await user.getIdToken();
    const res = await fetch(`/api/audit?${buildQuery()}&format=csv`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const field: React.CSSProperties = {
    padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 6,
    fontSize: 14, minWidth: 0, width: '100%',
  };
  const btn = (bg: string): React.CSSProperties => ({
    padding: '9px 16px', background: bg, color: '#fff', border: 'none',
    borderRadius: 6, fontWeight: 600, fontSize: 14, cursor: 'pointer',
  });

  if (profileLoaded && !isSuperAdmin) {
    return (
      <AdminLayout title="Employee Audit Logs">
        <div style={{ background: '#FFF', padding: 24, borderRadius: 12, textAlign: 'center', color: '#64748B' }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>🔒</div>
          <div style={{ color: '#1E293B', fontWeight: 600, marginBottom: 6 }}>Restricted</div>
          Audit logs are visible to superadmins only.
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Employee Audit Logs">
      <div style={{ background: '#FFF', padding: 24, borderRadius: 12, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <h2 style={{ margin: 0, color: '#1E293B', fontSize: 18 }}>Action History</h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={runVerify} disabled={verifying} style={btn('#7C3AED')}>
              {verifying ? 'Verifying…' : 'Verify chain integrity'}
            </button>
            <button onClick={exportCsv} style={btn('#0F766E')}>Export CSV</button>
          </div>
        </div>

        {verifyResult && (
          <div style={{
            marginBottom: 16, padding: 12, borderRadius: 8, fontSize: 14,
            background: verifyResult.intact ? '#ECFDF5' : '#FEF2F2',
            color: verifyResult.intact ? '#065F46' : '#991B1B',
            border: `1px solid ${verifyResult.intact ? '#A7F3D0' : '#FECACA'}`,
          }}>
            {verifyResult.intact
              ? `Chain intact — ${verifyResult.checked} entries verified, no alterations or gaps.`
              : `TAMPERING DETECTED — ${verifyResult.problems?.length ?? '?'} problem(s) across ${verifyResult.checked} entries: ` +
                (verifyResult.problems ?? []).slice(0, 5).map((p: any) => `#${p.seq} ${p.status}`).join(', ')}
          </div>
        )}

        <div className="rs-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 12 }}>
          <input style={field} placeholder="Actor (name or email)" value={filters.actor}
            onChange={(e) => setFilters({ ...filters, actor: e.target.value })} />
          <input style={field} placeholder="Action contains…" value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value })} />
          <input style={field} placeholder="Entity type (e.g. Property)" value={filters.entityType}
            onChange={(e) => setFilters({ ...filters, entityType: e.target.value })} />
          <select style={field} value={filters.outcome}
            onChange={(e) => setFilters({ ...filters, outcome: e.target.value })}>
            <option value="">Any outcome</option>
            <option value="success">success</option>
            <option value="denied">denied</option>
            <option value="failure">failure</option>
          </select>
          <input style={field} type="date" value={filters.from}
            onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
          <input style={field} type="date" value={filters.to}
            onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
          <button onClick={() => load(null)} style={btn('#1A56DB')}>Search</button>
          <button onClick={() => { setFilters(EMPTY_FILTERS); setTimeout(() => load(null), 0); }}
            style={{ ...btn('#F1F5F9'), color: '#475569' }}>Clear</button>
        </div>

        {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}

        {loading && logs.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>Loading logs…</div>
        ) : logs.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>No audit entries match these filters.</div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #E2E8F0' }}>
                    <th style={{ padding: 12, color: '#475569', fontWeight: 600 }}>#</th>
                    <th style={{ padding: 12, color: '#475569', fontWeight: 600 }}>Date &amp; Time</th>
                    <th style={{ padding: 12, color: '#475569', fontWeight: 600 }}>Actor</th>
                    <th style={{ padding: 12, color: '#475569', fontWeight: 600 }}>Action</th>
                    <th style={{ padding: 12, color: '#475569', fontWeight: 600 }}>Entity</th>
                    <th style={{ padding: 12, color: '#475569', fontWeight: 600 }}>Source</th>
                    <th style={{ padding: 12, color: '#475569', fontWeight: 600 }}>Change</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: 12, color: '#94A3B8', fontFamily: 'monospace' }}>{log.seq}</td>
                      <td style={{ padding: 12, color: '#64748B', whiteSpace: 'nowrap' }}>
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td style={{ padding: 12, color: '#334155', fontWeight: 500 }}>
                        {log.actor_name || 'Unknown'}
                        {!log.employee_id && (
                          <span style={{ fontSize: 11, color: '#B45309', marginLeft: 6 }}>(account deleted)</span>
                        )}
                        <br />
                        <span style={{ fontSize: 12, color: '#94A3B8' }}>{log.actor_email}</span>
                        {log.actor_role && <span style={{ fontSize: 11, color: '#94A3B8' }}> · {log.actor_role}</span>}
                      </td>
                      <td style={{ padding: 12 }}>
                        <span style={{
                          background: log.outcome === 'denied' ? '#FEE2E2' : log.outcome === 'failure' ? '#FEF3C7' : '#E0F2FE',
                          color: log.outcome === 'denied' ? '#B91C1C' : log.outcome === 'failure' ? '#B45309' : '#0369A1',
                          padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600,
                        }}>
                          {log.action}
                        </span>
                        {log.outcome !== 'success' && (
                          <div style={{ fontSize: 11, color: '#B91C1C', marginTop: 4 }}>{log.outcome}</div>
                        )}
                      </td>
                      <td style={{ padding: 12, color: '#334155' }}>
                        {log.entity_type}<br />
                        <span style={{ fontSize: 12, color: '#94A3B8', fontFamily: 'monospace' }}>{log.entity_id}</span>
                      </td>
                      <td style={{ padding: 12, color: '#64748B', fontSize: 12, fontFamily: 'monospace' }}>
                        {log.ip_address || '—'}
                      </td>
                      <td style={{ padding: 12 }}>
                        <button
                          onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                          style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: 4, padding: '4px 8px', fontSize: 12, cursor: 'pointer', color: '#475569' }}
                        >
                          {expanded === log.id ? 'Hide' : 'Before / After'}
                        </button>
                        {expanded === log.id && (
                          <pre style={{ margin: '8px 0 0', fontSize: 11, background: '#F8FAFC', padding: 8, borderRadius: 4, whiteSpace: 'pre-wrap', maxWidth: 420, overflowX: 'auto' }}>
{JSON.stringify({ before: log.before, after: log.after, details: log.details, request: log.request_id }, null, 2)}
                          </pre>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
              <span style={{ color: '#94A3B8', fontSize: 13 }}>{logs.length} entries shown</span>
              {nextCursor && (
                <button onClick={() => load(nextCursor)} disabled={loading} style={btn('#1A56DB')}>
                  {loading ? 'Loading…' : 'Load more'}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
