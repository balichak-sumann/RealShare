"use client";
import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import styles from "./Dashboard.module.css";
import { getAuthHeader } from "@/lib/api-auth";

interface Summary {
  kpis: {
    totalProperties: number;
    activeInvestors: number;
    totalInvestments: number;
    avgYield: number;
  };
  topProperties: {
    id: string;
    name: string;
    investors: number;
    raised: number;
    progress: number;
  }[];
  recentActivity: {
    id: string;
    user: string;
    action: string;
    target: string;
    amount: number;
    status: string;
    time: string;
  }[];
}

function formatInr(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function Home() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const authHeader = await getAuthHeader();
      if (!authHeader) { setLoading(false); return; }
      try {
        const res = await fetch('/api/dashboard/summary', { headers: authHeader });
        if (res.ok) setSummary(await res.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const kpis = summary?.kpis;

  return (
    <AdminLayout title="Overview Dashboard">
      {/* KPI Cards */}
      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.cardIcon} style={{ background: "rgba(37, 99, 235, 0.1)", color: "#2563EB" }}>🏢</div>
          <div>
            <div className={styles.cardTitle}>Total Properties</div>
            <div className={styles.cardValue}>{loading ? '…' : kpis?.totalProperties ?? 0}</div>
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardIcon} style={{ background: "rgba(124, 58, 237, 0.1)", color: "#7C3AED" }}>👥</div>
          <div>
            <div className={styles.cardTitle}>Active Investors</div>
            <div className={styles.cardValue}>{loading ? '…' : kpis?.activeInvestors ?? 0}</div>
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardIcon} style={{ background: "rgba(5, 150, 105, 0.1)", color: "#059669" }}>💰</div>
          <div>
            <div className={styles.cardTitle}>Total Investments</div>
            <div className={styles.cardValue}>{loading ? '…' : formatInr(kpis?.totalInvestments ?? 0)}</div>
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardIcon} style={{ background: "rgba(217, 119, 6, 0.1)", color: "#D97706" }}>📈</div>
          <div>
            <div className={styles.cardTitle}>Avg. Yield</div>
            <div className={styles.cardValue}>{loading ? '…' : `${kpis?.avgYield ?? 0}%`}</div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className={styles.twoCol}>
        {/* Top Properties */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>Top Performing Properties</div>
          </div>
          <div className={styles.propertyList}>
            {!loading && (summary?.topProperties.length ?? 0) === 0 && (
              <div style={{ padding: 16, color: '#94A3B8', fontSize: 14 }}>No properties yet.</div>
            )}
            {summary?.topProperties.map((prop) => (
              <div key={prop.id} className={styles.propertyRow}>
                <div className={styles.propertyInfo}>
                  <div className={styles.propertyName}>{prop.name}</div>
                  <div className={styles.propertyMeta}>{prop.investors} investors • {formatInr(prop.raised)} raised</div>
                </div>
                <div className={styles.progressContainer}>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${prop.progress}%` }} />
                  </div>
                  <span className={styles.progressLabel}>{prop.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>Recent Activity</div>
          </div>
          <div className={styles.activityList}>
            {!loading && (summary?.recentActivity.length ?? 0) === 0 && (
              <div style={{ padding: 16, color: '#94A3B8', fontSize: 14 }}>No recent activity yet.</div>
            )}
            {summary?.recentActivity.map((act) => (
              <div key={act.id} className={styles.activityRow}>
                <div className={styles.activityAvatar} style={{ background: "#2563EB" }}>
                  {act.user.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div className={styles.activityContent}>
                  <div className={styles.activityText}>
                    <strong>{act.user}</strong> {act.action} <strong>{act.target}</strong>
                  </div>
                  <div className={styles.activityMeta}>{formatInr(act.amount)} • {act.status} • {timeAgo(act.time)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
