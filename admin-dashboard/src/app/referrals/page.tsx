"use client";
import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import styles from "../properties/Properties.module.css";

interface ReferralData {
  agentId: string;
  agentName: string;
  agentEmail: string;
  referralCode: string;
  joinedAt: string;
  investorsReferred: number;
  referredInvestors: { id: string; full_name: string; email: string; created_at: string }[];
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
    fetch("/api/referrals")
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
  }, []);

  const totalReferrals = referrals.reduce((sum, r) => sum + r.investorsReferred, 0);
  const totalVolume = referrals.reduce((sum, r) => sum + r.totalInvestmentVolume, 0);
  const totalCommissions = referrals.reduce((sum, r) => sum + r.totalCommission, 0);
  const avgConversion = referrals.length > 0
    ? Math.round(referrals.reduce((sum, r) => sum + r.conversionRate, 0) / referrals.length)
    : 0;

  const filtered = referrals.filter((r) => {
    const searchStr = `${r.agentName} ${r.agentEmail} ${r.referralCode}`.toLowerCase();
    return searchStr.includes(search.toLowerCase());
  });

  const handleExportCSV = () => {
    const headers = ["Agent Name", "Email", "Referral Code", "Investors Referred", "Investment Volume (₹)", "Total Commission (₹)", "Paid (₹)", "Pending (₹)", "Conversion Rate (%)"];
    const rows = filtered.map((r) => [
      r.agentName,
      r.agentEmail || "",
      r.referralCode || "",
      r.investorsReferred,
      r.totalInvestmentVolume,
      r.totalCommission,
      r.paidCommission,
      r.pendingCommission,
      r.conversionRate,
    ]);
    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `referral_report_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <AdminLayout title="Referral Tracking & Analytics">
        <div>Loading referral data...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Referral Tracking & Analytics">
      {/* KPI Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18, marginBottom: 24 }}>
        <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 18 }}>
          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600, marginBottom: 6 }}>
            Total Referrals
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--text-primary)" }}>
            {totalReferrals}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: 4 }}>
            From {referrals.length} agents
          </div>
        </div>

        <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 18 }}>
          <div style={{ fontSize: "0.75rem", color: "#2563EB", textTransform: "uppercase", fontWeight: 600, marginBottom: 6 }}>
            Investment Volume
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#2563EB" }}>
            ₹{(totalVolume / 100000).toFixed(2)} L
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: 4 }}>
            Via referral links
          </div>
        </div>

        <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 18 }}>
          <div style={{ fontSize: "0.75rem", color: "#16A34A", textTransform: "uppercase", fontWeight: 600, marginBottom: 6 }}>
            Total Commissions
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#16A34A" }}>
            ₹{totalCommissions.toLocaleString("en-IN")}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: 4 }}>
            Earned by agents
          </div>
        </div>

        <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 18 }}>
          <div style={{ fontSize: "0.75rem", color: "#D97706", textTransform: "uppercase", fontWeight: 600, marginBottom: 6 }}>
            Avg. Conversion Rate
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#D97706" }}>
            {avgConversion}%
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: 4 }}>
            Referral → Investment
          </div>
        </div>
      </div>

      {/* Header with Search & Export */}
      <div className={styles.header}>
        <div className={styles.title}>Agent Referral Performance</div>
        <div className={styles.headerRight}>
          <button className={styles.addButton} onClick={handleExportCSV}>
            📥 Export CSV
          </button>
        </div>
      </div>

      <div className={styles.searchBar}>
        <span>🔍</span>
        <input
          type="text"
          placeholder="Search by agent name, email, or referral code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Agent</th>
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
                <td className={styles.td} colSpan={8} style={{ textAlign: "center", padding: 40, color: "var(--text-secondary)" }}>
                  {referrals.length === 0 ? "No referral data yet. Agents will appear here once they register and share referral links." : "No results match your search."}
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <React.Fragment key={r.agentId}>
                  <tr className={styles.tr}>
                    <td className={styles.td}>
                      <div>
                        <strong>{r.agentName}</strong>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{r.agentEmail}</div>
                      </div>
                    </td>
                    <td className={styles.td}>
                      <span style={{ fontFamily: "monospace", fontWeight: 700, background: "#EFF6FF", color: "#2563EB", padding: "3px 8px", borderRadius: 4 }}>
                        {r.referralCode}
                      </span>
                    </td>
                    <td className={styles.td}>
                      <strong>{r.investorsReferred}</strong>
                    </td>
                    <td className={styles.td}>
                      <strong>₹{r.totalInvestmentVolume.toLocaleString("en-IN")}</strong>
                    </td>
                    <td className={styles.td}>
                      <strong style={{ color: "#16A34A" }}>₹{r.totalCommission.toLocaleString("en-IN")}</strong>
                    </td>
                    <td className={styles.td}>
                      <span style={{ color: "#16A34A", fontWeight: 600 }}>₹{r.paidCommission.toLocaleString("en-IN")}</span>
                      {" / "}
                      <span style={{ color: "#D97706", fontWeight: 600 }}>₹{r.pendingCommission.toLocaleString("en-IN")}</span>
                    </td>
                    <td className={styles.td}>
                      <span
                        className={styles.badge}
                        style={{
                          background: r.conversionRate >= 50 ? "#DCFCE715" : "#FEF3C715",
                          color: r.conversionRate >= 50 ? "#16A34A" : "#D97706",
                        }}
                      >
                        {r.conversionRate}%
                      </span>
                    </td>
                    <td className={styles.td}>
                      <button
                        onClick={() => setExpandedAgent(expandedAgent === r.agentId ? null : r.agentId)}
                        style={{
                          background: "transparent",
                          border: "1px solid var(--border-color)",
                          borderRadius: 6,
                          padding: "4px 10px",
                          cursor: "pointer",
                          fontWeight: 600,
                          fontSize: "0.8rem",
                        }}
                      >
                        {expandedAgent === r.agentId ? "Hide ▲" : "View ▼"}
                      </button>
                    </td>
                  </tr>
                  {/* Expanded row: referred investors */}
                  {expandedAgent === r.agentId && r.referredInvestors.length > 0 && (
                    <tr>
                      <td colSpan={8} style={{ background: "#F8FAFC", padding: "12px 20px" }}>
                        <div style={{ fontSize: "0.8rem", fontWeight: 700, marginBottom: 8, color: "#475569" }}>
                          Referred Investors ({r.referredInvestors.length})
                        </div>
                        <div style={{ display: "grid", gap: 6 }}>
                          {r.referredInvestors.map((inv) => (
                            <div
                              key={inv.id}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                background: "#fff",
                                borderRadius: 8,
                                padding: "8px 14px",
                                border: "1px solid #E2E8F0",
                              }}
                            >
                              <div>
                                <strong style={{ fontSize: "0.85rem" }}>{inv.full_name}</strong>
                                <div style={{ fontSize: "0.75rem", color: "#64748B" }}>{inv.email}</div>
                              </div>
                              <div style={{ fontSize: "0.75rem", color: "#64748B" }}>
                                Joined: {new Date(inv.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          ))}
                        </div>
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
