"use client";
import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import styles from "../properties/Properties.module.css";

interface Agent {
  id: string;
  name: string;
  agency: string;
  email: string;
  phone: string;
  referralCode: string;
  commissionRatePct: number;
  totalInvestorsReferred: number;
  totalSalesVolume: string;
  commissionEarned: string;
  commissionPending: string;
  bankName: string | null;
  bankAcc: string | null;
  bankIfsc: string | null;
  status: "Active" | "Pending Approval" | "Suspended";
  joinedDate: string;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/agents')
      .then(res => res.json())
      .then(data => {
        const mapped = data.map((d: any) => {
          let earned = 0;
          let pending = 0;
          const commissions = d.agent_commissions || [];
          commissions.forEach((c: any) => {
             const amt = Number(c.commission_amount);
             if (c.status === 'paid') earned += amt;
             else if (c.status === 'pending_clearance') pending += amt;
          });

          return {
            id: d.id,
            name: d.full_name,
            agency: 'Independent',
            email: d.email || '',
            phone: d.phone_number || '',
            referralCode: d.referral_code || '',
            commissionRatePct: 2.5,
            totalInvestorsReferred: commissions.length,
            totalSalesVolume: `₹${(earned * 40 + pending * 40).toLocaleString('en-IN')}`,
            commissionEarned: `₹${earned.toLocaleString('en-IN')}`,
            commissionPending: `₹${pending.toLocaleString('en-IN')}`,
            bankName: d.bank_account_name || null,
            bankAcc: d.bank_account_number || null,
            bankIfsc: d.bank_ifsc || null,
            status: d.is_active ? "Active" : "Suspended",
            joinedDate: new Date(d.created_at).toLocaleDateString()
          };
        });
        setAgents(mapped);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);
  const [search, setSearch] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [editCommissionRate, setEditCommissionRate] = useState<number>(2.0);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleApproveAgent = (id: string) => {
    setAgents((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "Active" } : a))
    );
    showToast(`Agent ${id} approved successfully.`);
  };

  const handleUpdateCommission = () => {
    if (!selectedAgent) return;
    setAgents((prev) =>
      prev.map((a) =>
        a.id === selectedAgent.id ? { ...a, commissionRatePct: editCommissionRate } : a
      )
    );
    setSelectedAgent(null);
    showToast(`Custom commission rate updated to ${editCommissionRate}% for ${selectedAgent.name}`);
  };

  const handleDisburseCommission = async (id: string) => {
    try {
      const res = await fetch(`/api/agents/${id}/disburse`, { method: 'POST' });
      if (res.ok) {
        setAgents((prev) =>
          prev.map((a) =>
            a.id === id
              ? {
                  ...a,
                  commissionEarned: `₹${(
                    parseInt(a.commissionEarned.replace(/[^0-9]/g, "")) +
                    parseInt(a.commissionPending.replace(/[^0-9]/g, ""))
                  ).toLocaleString("en-IN")}`,
                  commissionPending: "₹0",
                }
              : a
          )
        );
        showToast(`Pending commission paid and ledger updated for Agent ${id}!`);
      } else {
        showToast(`Failed to disburse commission for Agent ${id}`);
      }
    } catch (e) {
      showToast(`Error disbursing commission`);
    }
  };

  const filtered = agents.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.agency.toLowerCase().includes(search.toLowerCase()) ||
      a.referralCode.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <AdminLayout title="Agent & Channel Partner Management"><div>Loading...</div></AdminLayout>;

  return (
    <AdminLayout title="Agent & Channel Partner Management">
      {/* Toast Alert */}
      {toastMsg && (
        <div
          style={{
            background: "linear-gradient(135deg, #059669, #10B981)",
            color: "#fff",
            padding: "14px 20px",
            borderRadius: "10px",
            marginBottom: "20px",
            fontWeight: 600,
            boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>✓ {toastMsg}</span>
          <button
            onClick={() => setToastMsg(null)}
            style={{
              background: "transparent",
              border: "none",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "18px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            borderRadius: "12px",
            padding: "18px",
          }}
        >
          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase" }}>
            Total Registered Agents
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "6px" }}>
            {agents.length} Partners
          </div>
        </div>

        <div
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            borderRadius: "12px",
            padding: "18px",
          }}
        >
          <div style={{ fontSize: "0.75rem", color: "#2563EB", fontWeight: 600, textTransform: "uppercase" }}>
            Agent-Driven Sales Volume
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "6px", color: "#2563EB" }}>
            ₹8.15 Cr
          </div>
        </div>

        <div
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            borderRadius: "12px",
            padding: "18px",
          }}
        >
          <div style={{ fontSize: "0.75rem", color: "#16A34A", fontWeight: 600, textTransform: "uppercase" }}>
            Total Commissions Paid
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "6px", color: "#16A34A" }}>
            ₹18.45 L
          </div>
        </div>

        <div
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            borderRadius: "12px",
            padding: "18px",
          }}
        >
          <div style={{ fontSize: "0.75rem", color: "#D97706", fontWeight: 600, textTransform: "uppercase" }}>
            Pending Commission Payouts
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "6px", color: "#D97706" }}>
            ₹2.00 L
          </div>
        </div>
      </div>

      {/* Header controls */}
      <div className={styles.header}>
        <div className={styles.title}>All Real Estate Agents & Affiliates ({filtered.length})</div>
        <div className={styles.headerRight}>
          <button className={styles.addButton} onClick={() => {
            const headers = ["Agent Name", "Agency", "Email", "Phone", "Referral Code", "Commission Rate (%)", "Investors Referred", "Sales Volume", "Commission Earned", "Commission Pending", "Status", "Joined"];
            const rows = filtered.map(a => [a.name, a.agency, a.email, a.phone, a.referralCode, a.commissionRatePct, a.totalInvestorsReferred, a.totalSalesVolume, a.commissionEarned, a.commissionPending, a.status, a.joinedDate]);
            const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `agent_commission_report_${new Date().toISOString().split("T")[0]}.csv`;
            link.click();
            URL.revokeObjectURL(url);
          }}>📥 Export Agent Commission Report</button>
        </div>
      </div>

      <div className={styles.searchBar}>
        <span>🔍</span>
        <input
          type="text"
          placeholder="Search by agent name, agency, or referral code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Agents Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Agent & Agency</th>
              <th className={styles.th}>Referral Code</th>
              <th className={styles.th}>Custom Commission Rate</th>
              <th className={styles.th}>Investors</th>
              <th className={styles.th}>Sales Volume</th>
              <th className={styles.th}>Commissions</th>
              <th className={styles.th}>Payout Bank Details</th>
              <th className={styles.th}>Status</th>
              <th className={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((agent) => (
              <tr key={agent.id} className={styles.tr}>
                <td className={styles.td}>
                  <strong>{agent.name}</strong>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                    {agent.agency} • {agent.phone}
                  </div>
                </td>
                <td className={styles.td}>
                  <code style={{ background: "#EFF6FF", color: "#2563EB", padding: "4px 8px", borderRadius: 4, fontWeight: 700 }}>
                    {agent.referralCode}
                  </code>
                </td>
                <td className={styles.td}>
                  <strong style={{ fontSize: "0.95rem" }}>{agent.commissionRatePct}%</strong>
                  <button
                    onClick={() => {
                      setSelectedAgent(agent);
                      setEditCommissionRate(agent.commissionRatePct);
                    }}
                    style={{
                      marginLeft: "8px",
                      padding: "2px 6px",
                      fontSize: "0.7rem",
                      borderRadius: 4,
                      border: "1px solid #CBD5E1",
                      background: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    ✏️ Edit Rate
                  </button>
                </td>
                <td className={styles.td}>
                  <strong>{agent.totalInvestorsReferred}</strong> Users
                </td>
                <td className={styles.td}>
                  <strong>{agent.totalSalesVolume}</strong>
                </td>
                <td className={styles.td}>
                  <div style={{ color: "#16A34A", fontWeight: 700 }}>{agent.commissionEarned} Paid</div>
                  {agent.commissionPending !== "₹0" && (
                    <div style={{ color: "#D97706", fontSize: "0.75rem", fontWeight: 600 }}>
                      {agent.commissionPending} Pending
                    </div>
                  )}
                </td>
                <td className={styles.td}>
                  {agent.bankAcc ? (
                    <div>
                      <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155" }}>{agent.bankName}</div>
                      <div style={{ fontSize: "0.75rem", color: "#64748B" }}>A/C: {agent.bankAcc}</div>
                      <div style={{ fontSize: "0.75rem", color: "#64748B" }}>IFSC: {agent.bankIfsc}</div>
                    </div>
                  ) : (
                    <span style={{ fontSize: "0.75rem", color: "#94A3B8", fontStyle: "italic" }}>Not provided</span>
                  )}
                </td>
                <td className={styles.td}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      background: agent.status === "Active" ? "#DCFCE7" : "#FEF3C7",
                      color: agent.status === "Active" ? "#15803D" : "#B45309",
                    }}
                  >
                    {agent.status}
                  </span>
                </td>
                <td className={styles.td}>
                  <div style={{ display: "flex", gap: "6px" }}>
                    {agent.status === "Pending Approval" ? (
                      <button
                        onClick={() => handleApproveAgent(agent.id)}
                        style={{
                          padding: "4px 10px",
                          borderRadius: 6,
                          background: "#16A34A",
                          color: "#fff",
                          border: "none",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        ✓ Approve
                      </button>
                    ) : null}
                    {agent.commissionPending !== "₹0" && (
                      <button
                        onClick={() => handleDisburseCommission(agent.id)}
                        style={{
                          padding: "4px 8px",
                          borderRadius: 6,
                          background: "#2563EB",
                          color: "#fff",
                          border: "none",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                        title="Disburse pending commission"
                      >
                        💸 Pay Out
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Commission Rate Modal */}
      {selectedAgent && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.7)",
            backdropFilter: "blur(4px)",
            zIndex: 100,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "460px",
              padding: "28px",
            }}
          >
            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0F172A", marginBottom: "8px" }}>
              Configure Custom Commission Structure
            </h3>
            <p style={{ fontSize: "0.85rem", color: "#64748B", marginBottom: "16px" }}>
              Adjust commission percentage for <strong>{selectedAgent.name}</strong> ({selectedAgent.agency})
            </p>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>
                Commission Percentage on Completed Fraction Sales (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={editCommissionRate}
                onChange={(e) => setEditCommissionRate(Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid #CBD5E1",
                  marginTop: "6px",
                  fontSize: "1rem",
                  fontWeight: 700,
                }}
              />
              <span style={{ fontSize: "0.75rem", color: "#64748B", display: "block", marginTop: 4 }}>
                Default standard rate is 2.0%. High-volume channel partners can be offered up to 3.5%.
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                onClick={() => setSelectedAgent(null)}
                style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #CBD5E1", background: "#fff", cursor: "pointer", fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateCommission}
                style={{ padding: "8px 20px", borderRadius: "8px", background: "#2563EB", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700 }}
              >
                Save Rate
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
