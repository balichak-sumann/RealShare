"use client";

import React, { useEffect, useState } from 'react';

import AdminLayout from '@/components/layout/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import styles from './Activities.module.css';
import Link from 'next/link';

const ACTIVITY_TYPE_ICONS: Record<string, string> = {
  transaction: '💳',
  kyc: '📄',
  signup: '👤',
  property: '🏢',
  support: '🎫',
  inquiry: '❓',
};

const ACTIVITY_TYPE_COLORS: Record<string, string> = {
  transaction: '#E0E7FF',
  kyc: '#FEF3C7',
  signup: '#DCFCE7',
  property: '#FCE7F3',
  support: '#FEE2E2',
  inquiry: '#F3E8FF',
};

const formatInr = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function ActivitiesPage() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadActivities = async () => {
      setLoading(true);
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const token = await user.getIdToken();
        const authHeader = { Authorization: `Bearer ${token}` };
        
        fetch("/api/activities", { headers: authHeader })
          .then((res) => res.json())
          .then((data) => {
            setActivities(Array.isArray(data.activities) ? data.activities : []);
            setLoading(false);
          })
          .catch((err) => {
            console.error("Failed to load activities", err);
            setLoading(false);
          });
      } catch (err) {
        console.error("Failed to get token", err);
        setLoading(false);
      }
    };
    loadActivities();
  }, [user]);

  const filteredActivities = activities.filter((act) => {
    if (typeFilter !== "All" && act.type !== typeFilter) return false;
    
    if (search.trim()) {
      const s = search.toLowerCase();
      return (
        act.user?.toLowerCase().includes(s) ||
        act.action?.toLowerCase().includes(s) ||
        act.target?.toLowerCase().includes(s) ||
        act.id?.toLowerCase().includes(s)
      );
    }
    return true;
  });

  return (
    <AdminLayout title="Platform Activity Feed">
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.pageTitle}>Live Recent Activity</h1>
            <p className={styles.pageSubtitle}>A unified feed of all platform events</p>
          </div>
        </div>

        <div className={styles.controlsBar}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search user, action, target..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className={styles.filtersGroup}>
            <select
              className={styles.filterSelect}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="All">All Types</option>
              <option value="signup">Signups</option>
              <option value="transaction">Transactions</option>
              <option value="kyc">KYC</option>
              <option value="property">Listings</option>
              <option value="support">Support Tickets</option>
              <option value="inquiry">Service Inquiries</option>
            </select>
          </div>
        </div>

        <div className={styles.tableCard}>
          {loading ? (
            <div className={styles.emptyState}>Loading activity feed...</div>
          ) : filteredActivities.length === 0 ? (
            <div className={styles.emptyState}>
              No activity found matching your filters.
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Target / Amount</th>
                    <th>Status</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredActivities.map((act) => (
                    <tr key={act.id}>
                      <td>
                        <div 
                          className={styles.typeIcon} 
                          style={{ backgroundColor: ACTIVITY_TYPE_COLORS[act.type] || '#F1F5F9' }}
                          title={act.type}
                        >
                          {ACTIVITY_TYPE_ICONS[act.type] || '✨'}
                        </div>
                      </td>
                      <td>
                        <div className={styles.userName}>{act.user}</div>
                      </td>
                      <td>
                        <div className={styles.actionText}>{act.action}</div>
                        <div className={styles.idText}>{act.id}</div>
                      </td>
                      <td>
                        <div className={styles.targetText}>{act.target}</div>
                        {act.amount !== null && act.amount > 0 && (
                          <div className={styles.amountText}>{formatInr(act.amount)}</div>
                        )}
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles[act.status.toLowerCase()] || styles.defaultBadge}`}>
                          {act.status}
                        </span>
                      </td>
                      <td className={styles.timeCell}>
                        {new Date(act.time).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
