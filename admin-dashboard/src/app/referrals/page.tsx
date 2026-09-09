"use client";

import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { getAuthHeader } from "@/lib/api-auth";
import styles from "../properties/Properties.module.css";

function formatInr(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

interface ReferredInvestorItem {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  joined_at: string;
  total_invested: number;
  fractions_bought: number;
  status: string;
  properties: string[];
}

interface ReferralData {
  agentId: string;
  agentName: string;
  agentEmail: string;
  referralCode: string;
  joinedAt: string;
  investorsReferred: number;
  referredInvestors: ReferredInvestorItem[];
  totalInvestmentVolume: number;
  totalCommission: number;
  paidCommission: number;
  pendingCommission: number;
  conversionRate: number;
}

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<ReferralData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const authHeader = await getAuthHeader();
      if (!authHeader) {
        setLoading(false);
        return;
      }
      fetch("/api/referrals", { headers: authHeader })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setReferrals(data);
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    })();
  }, []);

  const totalReferrals = referrals.reduce(
    (sum, r) => sum + (r.investorsReferred || 0),
    0
  );
  const totalVolume = referrals.reduce(
    (sum, r) => sum + (r.totalInvestmentVolume || 0),
    0
  );
  const totalCommissions = referrals.reduce(
    (sum, r) => sum + (r.totalCommission || 0),
    0
  );
  const activeReferrers = referrals.filter((r) => r.investorsReferred > 0);
  const avgConversion =
    activeReferrers.length > 0
      ? Math.round(
          activeReferrers.reduce((sum, r) => sum + r.conversionRate, 0) /
            activeReferrers.length
        )
      : referrals.length > 0
      ? Math.round(
          referrals.reduce((sum, r) => sum + r.conversionRate, 0) /
            referrals.length
        )
      : 0;

  const filtered = referrals.filter((r) => {
    const searchStr = `${r.agentName} ${r.agentEmail} ${r.referralCode}`.toLowerCase();
    return searchStr.includes(search.toLowerCase());
  });

  const handleExportCSV = () => {
    const headers = [
      "Referrer Name",
      "Email",
      "Referral Code",
      "Investors Referred",
      "Investment Volume (INR)",
      "Total Commission (INR)",
      "Paid Commission (INR)",
      "Pending Commission (INR)",
      "Conversion Rate (%)",
    ];
    const rows = filtered.map((r) => [
      `"${r.agentName}"`,
      `"${r.agentEmail || ""}"`,
      `"${r.referralCode || ""}"`,
      r.investorsReferred,
      r.totalInvestmentVolume,
      r.totalCommission,
      r.paidCommission,
      r.pendingCommission,
      r.conversionRate,
    ]);
    const csvContent =
      [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `referral_tracking_report_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <AdminLayout title="Referral Tracking & Analytics">
        <div style={{ padding: "40px", textAlign: "center" }}>
          Loading referral performance metrics...
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Referral Tracking & Analytics">
      {/* KPI Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 18,
          marginBottom: 26,
        }}
      >
        {/* Card 1: Total Referrals */}
        <div
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            borderRadius: 14,
            padding: 20,
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              color: "var(--text-secondary)",
              textTransform: "uppercase",
              fontWeight: 700,
              letterSpacing: "0.5px",
              marginBottom: 6,
            }}
          >
            Total Referrals
          </div>
          <div
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              color: "var(--text-primary)",
            }}
          >
            {totalReferrals}
          </div>
          <div
            style={{
              fontSize: "0.75rem",
              color: "var(--text-secondary)",
              marginTop: 4,
            }}
          >
            Across {referrals.length} active referrers
          </div>
        </div>

        {/* Card 2: Investment Volume */}
        <div
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            borderRadius: 14,
            padding: 20,
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              color: "#2563EB",
              textTransform: "uppercase",
              fontWeight: 700,
              letterSpacing: "0.5px",
              marginBottom: 6,
            }}
          >
            Investment Volume
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#2563EB" }}>
            {formatInr(totalVolume)}
          </div>
          <div
            style={{
              fontSize: "0.75rem",
              color: "var(--text-secondary)",
              marginTop: 4,
            }}
          >
            Driven via referral links
          </div>
        </div>

        {/* Card 3: Total Commissions */}
        <div
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            borderRadius: 14,
            padding: 20,
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              color: "#16A34A",
              textTransform: "uppercase",
              fontWeight: 700,
              letterSpacing: "0.5px",
              marginBottom: 6,
            }}
          >
            Total Commissions
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#16A34A" }}>
            ₹{totalCommissions.toLocaleString("en-IN")}
          </div>
          <div
            style={{
              fontSize: "0.75rem",
              color: "var(--text-secondary)",
              marginTop: 4,
            }}
          >
            Earned by partner network
          </div>
        </div>

        {/* Card 4: Avg. Conversion Rate */}
        <div
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            borderRadius: 14,
            padding: 20,
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              color: "#D97706",
              textTransform: "uppercase",
              fontWeight: 700,
              letterSpacing: "0.5px",
              marginBottom: 6,
            }}
          >
            Avg. Conversion Rate
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#D97706" }}>
            {avgConversion}%
          </div>
          <div
            style={{
              fontSize: "0.75rem",
              color: "var(--text-secondary)",
              marginTop: 4,
            }}
          >
            Referral Signups → Active Investments
          </div>
        </div>
      </div>

      {/* Header with Search & Export */}
      <div className={styles.header}>
        <div className={styles.title}>
          Referral Performance & Analytics ({filtered.length})
        </div>
        <div className={styles.headerRight}>
          <button className={styles.addButton} onClick={handleExportCSV}>
            📥 Export CSV Report
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className={styles.searchBar}>
        <span>🔍</span>
        <input
          type="text"
          placeholder="Search by referrer name, email, or referral code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Referrer</th>
              <th className={styles.th}>Referral Code</th>
              <th className={styles.th}>Investors Referred</th>
              <th className={styles.th}>Investment Volume</th>
              <th className={styles.th}>Commission Earned</th>
              <th className={styles.th}>Paid / Pending</th>
              <th className={styles.th}>Conversion</th>
              <th className={styles.th}>Details</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  className={styles.td}
                  colSpan={8}
                  style={{
                    textAlign: "center",
                    padding: 40,
                    color: "var(--text-secondary)",
                  }}
                >
                  {referrals.length === 0
                    ? "No referral data yet. Referrers will appear here once they share their referral link."
                    : "No results match your search."}
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <React.Fragment key={r.agentId}>
                  <tr className={styles.tr}>
                    <td className={styles.td}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 10,
                            background: "linear-gradient(135deg, #2563EB, #0F172A)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            fontWeight: 800,
                            fontSize: "0.8rem",
                            flexShrink: 0,
                          }}
                        >
                          {r.agentName
                            .split(" ")
                            .map((p) => p[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </div>
                        <div>
                          <strong style={{ fontSize: "0.95rem" }}>{r.agentName}</strong>
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--text-secondary)",
                              marginTop: "2px",
                            }}
                          >
                            {r.agentEmail}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className={styles.td}>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontWeight: 800,
                          background: "#EFF6FF",
                          color: "#2563EB",
                          padding: "4px 8px",
                          borderRadius: 6,
                          fontSize: "0.85rem",
                        }}
                      >
                        {r.referralCode}
                      </span>
                    </td>
                    <td className={styles.td}>
                      <strong style={{ fontSize: "0.95rem" }}>
                        {r.investorsReferred}
                      </strong>{" "}
                      <span style={{ fontSize: "0.75rem", color: "#64748B" }}>
                        Users
                      </span>
                    </td>
                    <td className={styles.td}>
                      <strong style={{ fontSize: "0.95rem" }}>
                        ₹{r.totalInvestmentVolume.toLocaleString("en-IN")}
                      </strong>
                    </td>
                    <td className={styles.td}>
                      <strong style={{ color: "#16A34A", fontSize: "0.95rem" }}>
                        ₹{r.totalCommission.toLocaleString("en-IN")}
                      </strong>
                    </td>
                    <td className={styles.td}>
                      <span style={{ color: "#16A34A", fontWeight: 700 }}>
                        ₹{r.paidCommission.toLocaleString("en-IN")}
                      </span>
                      {" / "}
                      <span
                        style={{
                          color: r.pendingCommission > 0 ? "#D97706" : "#64748B",
                          fontWeight: 700,
                        }}
                      >
                        ₹{r.pendingCommission.toLocaleString("en-IN")}
                      </span>
                    </td>
                    <td className={styles.td}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 8px",
                          borderRadius: "6px",
                          fontWeight: 700,
                          fontSize: "0.75rem",
                          background:
                            r.conversionRate >= 50 ? "#DCFCE7" : "#FEF3C7",
                          color:
                            r.conversionRate >= 50 ? "#15803D" : "#B45309",
                        }}
                      >
                        {r.conversionRate}%
                      </span>
                    </td>
                    <td className={styles.td}>
                      <button
                        onClick={() =>
                          setExpandedAgent(
                            expandedAgent === r.agentId ? null : r.agentId
                          )
                        }
                        style={{
                          background:
                            expandedAgent === r.agentId ? "#0F172A" : "#F1F5F9",
                          color:
                            expandedAgent === r.agentId ? "#FFFFFF" : "#1E293B",
                          border: "1px solid #CBD5E1",
                          borderRadius: 8,
                          padding: "6px 12px",
                          cursor: "pointer",
                          fontWeight: 700,
                          fontSize: "0.8rem",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {expandedAgent === r.agentId ? "Hide ▲" : "View ▼"}
                      </button>
                    </td>
                  </tr>

                  {/* Expanded row: referred investors */}
                  {expandedAgent === r.agentId && (
                    <tr>
                      <td
                        colSpan={8}
                        style={{
                          background: "#F8FAFC",
                          padding: "16px 24px",
                          borderTop: "1px dashed #E2E8F0",
                          borderBottom: "1px solid #CBD5E1",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.85rem",
                            fontWeight: 800,
                            marginBottom: 12,
                            color: "#1E293B",
                          }}
                        >
                          Referred Investors & Leads for {r.agentName} ({r.referredInvestors.length})
                        </div>

                        {r.referredInvestors.length === 0 ? (
                          <div
                            style={{
                              padding: "14px",
                              color: "#64748B",
                              fontSize: "0.85rem",
                              background: "#FFFFFF",
                              borderRadius: 8,
                              border: "1px solid #E2E8F0",
                            }}
                          >
                            No investor signups recorded for this code yet.
                          </div>
                        ) : (
                          <div style={{ display: "grid", gap: 10 }}>
                            {r.referredInvestors.map((inv) => (
                              <div
                                key={inv.id}
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  background: "#FFFFFF",
                                  borderRadius: 10,
                                  padding: "12px 18px",
                                  border: "1px solid #E2E8F0",
                                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                  <div
                                    style={{
                                      width: 32,
                                      height: 32,
                                      borderRadius: 8,
                                      background:
                                        inv.status === "Converted Investor"
                                          ? "#DCFCE7"
                                          : "#EFF6FF",
                                      color:
                                        inv.status === "Converted Investor"
                                          ? "#15803D"
                                          : "#2563EB",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontWeight: 800,
                                      fontSize: "0.75rem",
                                    }}
                                  >
                                    {inv.status === "Converted Investor" ? "✓" : "👤"}
                                  </div>
                                  <div>
                                    <strong style={{ fontSize: "0.9rem", color: "#0F172A" }}>
                                      {inv.full_name}
                                    </strong>
                                    <div
                                      style={{
                                        fontSize: "0.75rem",
                                        color: "#64748B",
                                        marginTop: 2,
                                      }}
                                    >
                                      {inv.email} {inv.phone !== "—" && `• ${inv.phone}`}
                                    </div>
                                    {inv.properties && inv.properties.length > 0 && (
                                      <div
                                        style={{
                                          fontSize: "0.7rem",
                                          color: "#2563EB",
                                          fontWeight: 600,
                                          marginTop: 2,
                                        }}
                                      >
                                        🏢 Invested in: {inv.properties.join(", ")}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div style={{ textAlign: "right" }}>
                                  <div
                                    style={{
                                      fontSize: "0.95rem",
                                      fontWeight: 800,
                                      color:
                                        inv.total_invested > 0
                                          ? "#16A34A"
                                          : "#64748B",
                                    }}
                                  >
                                    ₹{inv.total_invested.toLocaleString("en-IN")}
                                  </div>
                                  <span
                                    style={{
                                      display: "inline-block",
                                      marginTop: 4,
                                      padding: "2px 8px",
                                      borderRadius: 4,
                                      fontSize: "0.7rem",
                                      fontWeight: 700,
                                      background:
                                        inv.status === "Converted Investor"
                                          ? "#DCFCE7"
                                          : "#EFF6FF",
                                      color:
                                        inv.status === "Converted Investor"
                                          ? "#15803D"
                                          : "#2563EB",
                                    }}
                                  >
                                    {inv.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
