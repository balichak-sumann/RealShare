"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface ClientLead {
  id: string;
  name: string;
  property: string;
  fractions: number;
  commission: string;
  status: string;
  date: string;
}

interface DashboardData {
  agentName: string;
  agencyName: string;
  commissionRate: string;
  referralCode: string;
  totalEarned: string;
  pendingPayout: string;
  clientLeads: ClientLead[];
  monthlyTrends: {
    labels: string[];
    data: number[];
  };
}

export default function AgentPortal() {
  const { user, logout } = useAuth();
  const router = useRouter();
  
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const token = await user?.getIdToken();
      const res = await fetch('/api/agents/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const fetchedData = await res.json();
        setData(fetchedData);
      } else {
        router.push('/');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    const link = `https://realshare.com/register?ref=${data?.referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading || !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#F8FAFC' }}>
        <div style={{ fontSize: '18px', color: '#64748B' }}>Loading Agent Portal...</div>
      </div>
    );
  }

  // Calculate max for bar chart (never divide by zero when every month is ₹0)
  const trendData = data.monthlyTrends?.data || [];
  const trendLabels = data.monthlyTrends?.labels || [];
  const maxSale = Math.max(1, ...trendData);
  const totalSalesCount = data.clientLeads?.length || 0;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', padding: '20px 40px' }}>
      {/* Top Navbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', paddingBottom: '20px', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img src="/logo.png" alt="Logo" style={{ height: '36px' }} />
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1E293B', margin: 0 }}>Wealth Partner Portal</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 600, color: '#334155' }}>{data.agentName}</div>
            <div style={{ fontSize: '13px', color: '#64748B' }}>{data.agencyName}</div>
          </div>
          <button 
            onClick={logout}
            style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #EF4444', color: '#EF4444', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <div style={{ background: '#FFF', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '14px', color: '#64748B', fontWeight: 600, marginBottom: '8px' }}>TOTAL COMMISSION EARNED</div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#1E293B' }}>{data.totalEarned}</div>
        </div>
        <div style={{ background: '#FFF', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '14px', color: '#64748B', fontWeight: 600, marginBottom: '8px' }}>PENDING PAYOUTS</div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#D97706' }}>{data.pendingPayout}</div>
        </div>
        <div style={{ background: '#FFF', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '14px', color: '#64748B', fontWeight: 600, marginBottom: '8px' }}>TOTAL SALES</div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#1E293B' }}>{totalSalesCount} <span style={{ fontSize: '16px', color: '#10B981' }}>properties</span></div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '32px' }}>
        
        {/* Sales Analytics (PDF Requirement) */}
        <div style={{ background: '#FFF', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1E293B', marginTop: 0, marginBottom: '24px' }}>Sales Analytics (6 Months)</h2>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', height: '200px', paddingTop: '20px' }}>
            {trendData.length === 0 && (
              <div style={{ width: '100%', textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>No sales data yet</div>
            )}
            {trendData.map((val, idx) => {
              const heightPct = (val / maxSale) * 100;
              return (
                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'flex-end', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: '100%', height: `${heightPct}%`, background: '#D97706', transition: 'height 0.5s ease' }} />
                  </div>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>{trendLabels[idx] || `M${idx + 1}`}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Referral Management (PDF Requirement) */}
        <div style={{ background: '#FFF', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1E293B', marginTop: 0, marginBottom: '16px' }}>Referral Management</h2>
          <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '24px' }}>
            Share your unique referral link with potential investors. You will earn a <strong>{data.commissionRate}</strong> commission on all their property fraction purchases.
          </p>
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
            <span style={{ fontSize: '14px', color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              realshare.com/register?ref={data.referralCode}
            </span>
            <button 
              onClick={copyReferralLink}
              style={{ padding: '6px 12px', background: copied ? '#10B981' : '#E2E8F0', color: copied ? '#FFF' : '#334155', border: 'none', borderRadius: '4px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      </div>

      {/* Commission Earnings Pipeline (PDF Requirement) */}
      <div style={{ background: '#FFF', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid #E2E8F0' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1E293B', margin: 0 }}>Client Pipeline & Commissions</h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Client Name</th>
                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Property Invested</th>
                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Fractions</th>
                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Commission</th>
                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.clientLeads?.map((lead, i) => (
                <tr key={i} style={{ borderTop: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: 500, color: '#1E293B' }}>{lead.name}</td>
                  <td style={{ padding: '16px 24px', fontSize: '14px', color: '#334155' }}>{lead.property}</td>
                  <td style={{ padding: '16px 24px', fontSize: '14px', color: '#64748B' }}>{lead.fractions}</td>
                  <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: 600, color: '#1E293B' }}>{lead.commission}</td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '9999px', 
                      fontSize: '12px', 
                      fontWeight: 600,
                      background: lead.status === 'Commission Paid' ? '#D1FAE5' : lead.status === 'Pending Payout' ? '#FEF3C7' : '#E0E7FF',
                      color: lead.status === 'Commission Paid' ? '#065F46' : lead.status === 'Pending Payout' ? '#92400E' : '#3730A3'
                    }}>
                      {lead.status}
                    </span>
                  </td>
                </tr>
              ))}
              {(!data.clientLeads || data.clientLeads.length === 0) && (
                <tr>
                  <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#64748B' }}>No client leads yet. Share your referral link to get started!</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
