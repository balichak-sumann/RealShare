"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import AdminLayout from "@/components/layout/AdminLayout";
import styles from "./Dashboard.module.css";
import { getAuthHeader } from "@/lib/api-auth";

interface Summary {
  kpis: {
    totalProperties: number;
    activeProperties: number;
    pendingProperties: number;
    activeInvestors: number;
    verifiedInvestors: number;
    pendingKyc: number;
    totalInvestments: number;
    avgYield: number;
    avgIrr: number;
    activeAgents: number;
    openTickets: number;
    totalInquiries: number;
  };
  topProperties: {
    id: string;
    name: string;
    locality: string;
    district: string;
    state: string;
    property_type: string;
    listing_type: string;
    views: number;
    investors: number;
    raised: number;
    total_fractions: number;
    sold_fractions: number;
    available_fractions: number;
    price_per_fraction: number;
    assured_yield: number;
    target_irr: number;
    progress: number;
    image: string | null;
    developerName?: string | null;
    approval_status: string;
  }[];
  recentActivity: {
    id: string;
    type: "transaction" | "kyc" | "signup" | "property";
    user: string;
    action: string;
    target: string;
    amount: number | null;
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
  try {
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return "Recently";
  }
}

function getActivityBadgeClass(status: string) {
  const s = (status || "").toLowerCase();
  if (s.includes("completed") || s.includes("paid") || s.includes("success")) return styles.statusCompleted;
  if (s.includes("verified")) return styles.statusVerified;
  if (s.includes("approved")) return styles.statusApproved;
  if (s.includes("pending") || s.includes("review")) return styles.statusPending;
  return styles.statusDefault;
}

function getActivityAvatarColor(type: string) {
  switch (type) {
    case "transaction":
      return "#059669"; // Emerald
    case "kyc":
      return "#7C3AED"; // Purple
    case "property":
      return "#2563EB"; // Blue
    case "signup":
      return "#D97706"; // Amber
    default:
      return "#475569";
  }
}

function getActivityTypeIcon(type: string) {
  switch (type) {
    case "transaction":
      return "💰";
    case "kyc":
      return "🛡️";
    case "property":
      return "🏢";
    case "signup":
      return "👤";
    default:
      return "⚡";
  }
}

export default function Home() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const authHeader = await getAuthHeader();
      if (!authHeader) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch("/api/dashboard/summary", { headers: authHeader });
        if (res.ok) {
          const data = await res.json();
          setSummary(data);
        } else {
          const errData = await res.json().catch(() => ({}));
          console.error("Dashboard summary API error:", res.status, errData);
        }
      } catch (e) {
        console.error("Dashboard summary fetch error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);


  const kpis = summary?.kpis;
  const pendingActionsCount = (kpis?.pendingKyc || 0) + (kpis?.pendingProperties || 0);

  return (
    <AdminLayout title="Overview Dashboard">
      <div className={styles.container}>
        {/* High-priority Attention / Alert Banner */}
        {!loading && pendingActionsCount > 0 && (
          <div className={styles.alertBar}>
            <div className={styles.alertContent}>
              <span className={styles.alertIcon}>⚠️</span>
              <div>
                <strong>Action Required:</strong> You have{" "}
                {kpis?.pendingKyc ? `${kpis.pendingKyc} pending KYC submission(s)` : ""}
                {kpis?.pendingKyc && kpis?.pendingProperties ? " and " : ""}
                {kpis?.pendingProperties ? `${kpis.pendingProperties} property awaiting approval` : ""}.
              </div>
            </div>
            <div className={styles.alertActions}>
              {kpis?.pendingKyc ? (
                <Link href="/investors" className={styles.alertBtn}>
                  Review KYC ({kpis.pendingKyc})
                </Link>
              ) : null}
              {kpis?.pendingProperties ? (
                <Link href="/properties" className={styles.alertBtn}>
                  Review Properties ({kpis.pendingProperties})
                </Link>
              ) : null}
            </div>
          </div>
        )}

        {/* Quick Actions Shortcuts Bar */}
        <div className={styles.quickActionsBar}>
          <Link href="/properties" className={styles.quickActionBtn}>
            <span>🏢</span> Manage Properties
          </Link>
          <Link href="/investors" className={styles.quickActionBtn}>
            <span>👥</span> Investors & KYC
          </Link>
          <Link href="/ledger" className={styles.quickActionBtn}>
            <span>💰</span> Financial Ledger
          </Link>
          <Link href="/agents" className={styles.quickActionBtn}>
            <span>🤝</span> Agents & Network
          </Link>
          <Link href="/notifications" className={styles.quickActionBtn}>
            <span>📢</span> Send Broadcast
          </Link>
          <Link href="/tickets" className={styles.quickActionBtn}>
            <span>🎫</span> Support Tickets
          </Link>
        </div>

        {/* Primary KPI Cards Grid */}
        <div className={styles.grid}>
          {/* Card 1: Total Properties */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Total Properties</span>
              <div className={styles.cardIcon} style={{ background: "rgba(37, 99, 235, 0.1)", color: "#2563EB" }}>
                🏢
              </div>
            </div>
            <div>
              <div className={styles.cardValue}>{loading ? "…" : kpis?.totalProperties ?? 0}</div>
            </div>
            <div className={styles.cardSub}>
              <span>🟢 {kpis?.activeProperties ?? 0} active</span>
              <span>•</span>
              <span>🟡 {kpis?.pendingProperties ?? 0} pending review</span>
            </div>
          </div>

          {/* Card 2: Active Investors */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Active Investors</span>
              <div className={styles.cardIcon} style={{ background: "rgba(124, 58, 237, 0.1)", color: "#7C3AED" }}>
                👥
              </div>
            </div>
            <div>
              <div className={styles.cardValue}>{loading ? "…" : kpis?.activeInvestors ?? 0}</div>
            </div>
            <div className={styles.cardSub}>
              <span>🛡️ {kpis?.verifiedInvestors ?? 0} verified</span>
              <span>•</span>
              <span>⏳ {kpis?.pendingKyc ?? 0} KYC pending</span>
            </div>
          </div>

          {/* Card 3: Total Investments */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Total Investments</span>
              <div className={styles.cardIcon} style={{ background: "rgba(5, 150, 105, 0.1)", color: "#059669" }}>
                💰
              </div>
            </div>
            <div>
              <div className={styles.cardValue}>{loading ? "…" : formatInr(kpis?.totalInvestments ?? 0)}</div>
            </div>
            <div className={styles.cardSub}>
              <span>📊 Fractional & Outright Assets</span>
            </div>
          </div>

          {/* Card 4: Avg. Assured Yield */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Avg. Assured Yield</span>
              <div className={styles.cardIcon} style={{ background: "rgba(217, 119, 6, 0.1)", color: "#D97706" }}>
                📈
              </div>
            </div>
            <div>
              <div className={styles.cardValue}>{loading ? "…" : `${kpis?.avgYield ?? 0}%`}</div>
            </div>
            <div className={styles.cardSub}>
              <span>🎯 Target IRR: ~{kpis?.avgIrr ?? 0}%</span>
            </div>
          </div>
        </div>

        {/* Secondary Operational Stats Bar */}
        <div className={styles.secondaryStats}>
          <Link href="/agents" className={styles.statChip}>
            <div className={styles.statChipLeft}>
              <span className={styles.statChipIcon}>🤝</span>
              <span className={styles.statChipLabel}>Active Sales Agents</span>
            </div>
            <span className={styles.statChipValue}>{loading ? "…" : kpis?.activeAgents ?? 0}</span>
          </Link>

          <Link href="/tickets" className={styles.statChip}>
            <div className={styles.statChipLeft}>
              <span className={styles.statChipIcon}>🎫</span>
              <span className={styles.statChipLabel}>Open Support Tickets</span>
            </div>
            <span className={styles.statChipValue}>{loading ? "…" : kpis?.openTickets ?? 0}</span>
          </Link>

          <Link href="/services" className={styles.statChip}>
            <div className={styles.statChipLeft}>
              <span className={styles.statChipIcon}>🛎️</span>
              <span className={styles.statChipLabel}>Service Inquiries</span>
            </div>
            <span className={styles.statChipValue}>{loading ? "…" : kpis?.totalInquiries ?? 0}</span>
          </Link>
        </div>

        {/* Two Column Layout: Top/Most Viewed Properties + Live Activity */}
        <div className={styles.twoCol}>
          {/* Top / Most Viewed Properties Section */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleGroup}>
                <div className={styles.sectionTitle}>
                  <span>🔥</span> Most Viewed Properties
                </div>
                <div className={styles.sectionSubtitle}>
                  Ranked by investor views, search traction & interest
                </div>
              </div>
              <Link href="/properties" className={styles.viewAllBtn}>
                Manage All →
              </Link>
            </div>

            <div className={styles.propertyList}>
              {!loading && (summary?.topProperties.length ?? 0) === 0 && (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>🏢</div>
                  <div>No properties listed yet.</div>
                </div>
              )}

              {summary?.topProperties.map((prop, idx) => (
                <Link key={prop.id} href="/properties" className={styles.propertyRow}>
                  {/* Rank Badge */}
                  <div className={`${styles.rankBadge} ${idx === 0 ? styles.rankBadgeTop : ""}`}>
                    #{idx + 1}
                  </div>

                  {/* Thumbnail */}
                  {prop.image ? (
                    <img src={prop.image} alt={prop.name} className={styles.propertyThumb} />
                  ) : (
                    <div className={styles.propertyThumbPlaceholder}>🏢</div>
                  )}

                  {/* Property Details */}
                  <div className={styles.propertyInfo}>
                    <div className={styles.propertyHeaderLine}>
                      <span className={styles.propertyName}>{prop.name}</span>
                      <span className={styles.typeBadge}>{prop.property_type || "Commercial"}</span>
                    </div>

                    <div className={styles.propertyLocality}>
                      📍 {prop.locality ? `${prop.locality}, ` : ""}{prop.district || prop.state}
                    </div>

                    <div className={styles.propertyMetricsRow}>
                      <span className={styles.viewsPill}>
                        👁️ {prop.views.toLocaleString("en-IN")} views
                      </span>
                      {prop.assured_yield > 0 && (
                        <span className={styles.yieldPill}>
                          📈 {prop.assured_yield}% Yield
                        </span>
                      )}
                      <span className={styles.propertyMetaText}>
                        {formatInr(prop.price_per_fraction)} / share
                      </span>
                    </div>
                  </div>

                  {/* Progress & Raised */}
                  <div className={styles.progressContainer}>
                    <div className={styles.progressMeta}>
                      <span>{prop.progress}% sold</span>
                      <span>{prop.investors} inv.</span>
                    </div>
                    <div className={styles.progressBar}>
                      <div className={styles.progressFill} style={{ width: `${Math.max(prop.progress, 4)}%` }} />
                    </div>
                    <div className={styles.progressMeta} style={{ fontSize: "0.7rem", color: "#94A3B8" }}>
                      {formatInr(prop.raised)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Live Recent Activity Feed Section */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleGroup}>
                <div className={styles.sectionTitle}>
                  <span>⚡</span> Live Recent Activity
                </div>
                <div className={styles.sectionSubtitle}>
                  Real-time events across investments, KYC & listings
                </div>
              </div>
              <Link href="/ledger" className={styles.viewAllBtn}>
                Full Ledger →
              </Link>
            </div>

            <div className={styles.activityList}>
              {!loading && (summary?.recentActivity.length ?? 0) === 0 && (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>⏳</div>
                  <div>No recent platform activity yet.</div>
                </div>
              )}

              {summary?.recentActivity.map((act) => (
                <div key={act.id} className={styles.activityRow}>
                  {/* Category Avatar */}
                  <div
                    className={styles.activityAvatar}
                    style={{ background: getActivityAvatarColor(act.type) }}
                    title={act.type}
                  >
                    {getActivityTypeIcon(act.type)}
                  </div>

                  {/* Activity Content */}
                  <div className={styles.activityContent}>
                    <div className={styles.activityText}>
                      <span className={styles.activityUser}>{act.user}</span> {act.action}{" "}
                      <span className={styles.activityTarget}>{act.target}</span>
                    </div>

                    <div className={styles.activityMetaLine}>
                      {act.amount !== null && act.amount > 0 && (
                        <span className={styles.activityAmount}>{formatInr(act.amount)}</span>
                      )}
                      <span className={`${styles.statusPill} ${getActivityBadgeClass(act.status)}`}>
                        {act.status}
                      </span>
                      <span className={styles.activityTime}>{timeAgo(act.time)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
