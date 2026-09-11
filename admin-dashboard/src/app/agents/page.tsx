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

interface CommissionItem {
  id: string;
  property_title: string;
  locality: string;
  investor_name: string;
  investor_email: string;
  fractions_bought: number;
  investment_amount: number;
  commission_percentage: number;
  commission_amount: number;
  status: string;
  paid_at: string | null;
  created_at: string;
}

interface ClientLead {
  id: string;
  client_name: string;
  phone_number: string;
  target_budget: string;
  status: string;
  created_at: string;
}

interface ReferredInvestor {
  id: string;
  name: string;
  email: string;
  phone: string;
  total_invested: number;
  joined_date: string;
}

interface Agent {
  id: string;
  name: string;
  agency: string;
  email: string;
  phone: string;
  referralCode: string;
  commissionRatePct: number;
  totalInvestorsReferred: number;
  rawSalesVolume: number;
  totalSalesVolume: string;
  rawCommissionEarned: number;
  commissionEarned: string;
  rawCommissionPending: number;
  commissionPending: string;
  bankName: string | null;
  bankAcc: string | null;
  bankIfsc: string | null;
  status: "Active" | "Suspended";
  is_approved: boolean;
  joinedDate: string;
  commissions: CommissionItem[];
  clients: ClientLead[];
  referredInvestors: ReferredInvestor[];
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Selected Agent Drawer State
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "commissions" | "clients" | "bank">("profile");

  // Edit Partner Form State
  const [editName, setEditName] = useState("");
  const [editAgency, setEditAgency] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRefCode, setEditRefCode] = useState("");
  const [editRate, setEditRate] = useState<number>(2.5);
  const [editBankName, setEditBankName] = useState("");
  const [editBankAcc, setEditBankAcc] = useState("");
  const [editBankIfsc, setEditBankIfsc] = useState("");
  const [isSavingPartner, setIsSavingPartner] = useState(false);

  // Quick Rate Modal
  const [quickRateAgent, setQuickRateAgent] = useState<Agent | null>(null);
  const [quickRateVal, setQuickRateVal] = useState<number>(2.5);

  // Notifications
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastError, setToastError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const showError = (msg: string) => {
    setToastError(msg);
    setTimeout(() => setToastError(null), 4000);
  };

  const loadAgents = async () => {
    setLoading(true);
    try {
      const authHeader = await getAuthHeader();
      if (!authHeader) {
        setLoading(false);
        return;
      }
      const res = await fetch("/api/agents", { headers: authHeader });
      if (!res.ok) throw new Error("Failed to fetch agents");
      const data = await res.json();
      if (Array.isArray(data)) {
        const mapped = data.map((d: any) => {
          const earned = Number(d.commission_earned || 0);
          const pending = Number(d.commission_pending || 0);
          const salesVol = Number(d.total_sales_volume || 0);

          return {
            id: d.id,
            name: d.full_name,
            agency: d.full_address?.startsWith("Agency: ")
              ? d.full_address.replace("Agency: ", "")
              : d.full_address !== "—"
              ? d.full_address
              : "Independent Broker",
            email: d.email || "—",
            phone: d.phone_number || "—",
            referralCode: d.referral_code || "—",
            commissionRatePct:
              d.commission_rate_pct != null ? Number(d.commission_rate_pct) : 2.5,
            totalInvestorsReferred: Number(d.total_investors_referred || 0),
            rawSalesVolume: salesVol,
            totalSalesVolume: `₹${salesVol.toLocaleString("en-IN")}`,
            rawCommissionEarned: earned,
            commissionEarned: `₹${earned.toLocaleString("en-IN")}`,
            rawCommissionPending: pending,
            commissionPending: `₹${pending.toLocaleString("en-IN")}`,
            bankName: d.bank_account_name || null,
            bankAcc: d.bank_account_number || null,
            bankIfsc: d.bank_ifsc || null,
            status: (d.is_active ? "Active" : "Suspended") as "Active" | "Suspended",
            is_approved: d.is_approved ?? true,
            joinedDate: d.created_at
              ? new Date(d.created_at).toLocaleDateString()
              : "—",
            commissions: d.commissions || [],
            clients: d.clients || [],
            referredInvestors: d.referred_investors || [],
          };
        });
        setAgents(mapped);
      }
    } catch (err: any) {
      console.error(err);
      showError("Could not load agent records.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleApproval = async (id: string, is_approved: boolean) => {
    try {
      const authHeader = await getAuthHeader();
      if (!authHeader) return;
      const res = await fetch(`/api/investors/${id}`, {
        method: "PATCH",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ is_approved }),
      });
      if (!res.ok) throw new Error("Failed to update approval status");
      const updated = await res.json();
      setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, is_approved: updated.is_approved } : a)));
      showToast(`Agent ${updated.is_approved ? "Approved" : "Approval Revoked"}`);
      if (selectedAgent && selectedAgent.id === id) {
        setSelectedAgent((prev) => prev ? { ...prev, is_approved: updated.is_approved } : null);
      }
    } catch (err) {
      console.error(err);
      showError("Could not update approval status.");
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  const openPartnerDrawer = (agent: Agent) => {
    setSelectedAgent(agent);
    setEditName(agent.name);
    setEditAgency(agent.agency === "Independent Broker" ? "" : agent.agency);
    setEditPhone(agent.phone === "—" ? "" : agent.phone);
    setEditRefCode(agent.referralCode === "—" ? "" : agent.referralCode);
    setEditRate(agent.commissionRatePct);
    setEditBankName(agent.bankName || "");
    setEditBankAcc(agent.bankAcc || "");
    setEditBankIfsc(agent.bankIfsc || "");
    setActiveTab("profile");
  };

  // 1. Save Partner Profile Changes
  const handleSavePartner = async () => {
    if (!selectedAgent) return;
    setIsSavingPartner(true);
    try {
      const authHeader = await getAuthHeader();
      if (!authHeader) {
        showError("You must be logged in.");
        setIsSavingPartner(false);
        return;
      }
      const res = await fetch(`/api/agents/${selectedAgent.id}`, {
        method: "PATCH",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: editName,
          phone_number: editPhone,
          full_address: editAgency ? `Agency: ${editAgency}` : undefined,
          referral_code: editRefCode,
          commission_rate_pct: Number(editRate),
          bank_account_name: editBankName,
          bank_account_number: editBankAcc,
          bank_ifsc: editBankIfsc,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showError(err.error || "Failed to update partner.");
        setIsSavingPartner(false);
        return;
      }
      showToast(`Partner profile updated for ${editName}`);
      setSelectedAgent((prev) =>
        prev
          ? {
              ...prev,
              name: editName,
              agency: editAgency || "Independent Broker",
              phone: editPhone || "—",
              referralCode: editRefCode || "—",
              commissionRatePct: Number(editRate),
              bankName: editBankName || null,
              bankAcc: editBankAcc || null,
              bankIfsc: editBankIfsc || null,
            }
          : null
      );
      loadAgents();
    } catch (e) {
      console.error(e);
      showError("Error updating partner.");
    } finally {
      setIsSavingPartner(false);
    }
  };

  // 2. Toggle Partner Status (Active / Suspended)
  const handleToggleStatus = async (id: string, makeActive: boolean) => {
    try {
      const authHeader = await getAuthHeader();
      if (!authHeader) return;
      const res = await fetch(`/api/agents/${id}`, {
        method: "PATCH",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: makeActive }),
      });
      if (res.ok) {
        setAgents((prev) =>
          prev.map((a) =>
            a.id === id ? { ...a, status: makeActive ? "Active" : "Suspended" } : a
          )
        );
        if (selectedAgent?.id === id) {
          setSelectedAgent((prev) =>
            prev ? { ...prev, status: makeActive ? "Active" : "Suspended" } : null
          );
        }
        showToast(
          `Partner status changed to ${makeActive ? "Active" : "Suspended"}`
        );
      }
    } catch (e) {
      showError("Failed to update status.");
    }
  };

  // 3. Quick Update Commission Rate
  const handleQuickUpdateRate = async () => {
    if (!quickRateAgent) return;
    try {
      const authHeader = await getAuthHeader();
      if (!authHeader) return;
      const res = await fetch(`/api/agents/${quickRateAgent.id}`, {
        method: "PATCH",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ commission_rate_pct: quickRateVal }),
      });
      if (res.ok) {
        setAgents((prev) =>
          prev.map((a) =>
            a.id === quickRateAgent.id
              ? { ...a, commissionRatePct: quickRateVal }
              : a
          )
        );
        showToast(
          `Commission rate updated to ${quickRateVal}% for ${quickRateAgent.name}`
        );
        setQuickRateAgent(null);
      }
    } catch (e) {
      showError("Failed to update commission rate.");
    }
  };

  // 4. Disburse Pending Commission
  const handleDisburseCommission = async (id: string) => {
    try {
      const authHeader = await getAuthHeader();
      if (!authHeader) return;
      const res = await fetch(`/api/agents/${id}/disburse`, {
        method: "POST",
        headers: authHeader,
      });
      if (res.ok) {
        setAgents((prev) =>
          prev.map((a) => {
            if (a.id === id) {
              const newlyPaid = a.rawCommissionPending;
              return {
                ...a,
                rawCommissionEarned: a.rawCommissionEarned + newlyPaid,
                commissionEarned: `₹${(a.rawCommissionEarned + newlyPaid).toLocaleString("en-IN")}`,
                rawCommissionPending: 0,
                commissionPending: "₹0",
                commissions: a.commissions.map((c) => ({
                  ...c,
                  status: "paid",
                  paid_at: new Date().toISOString(),
                })),
              };
            }
            return a;
          })
        );
        if (selectedAgent?.id === id) {
          setSelectedAgent((prev) =>
            prev
              ? {
                  ...prev,
                  commissionPending: "₹0",
                  rawCommissionPending: 0,
                  commissions: prev.commissions.map((c) => ({
                    ...c,
                    status: "paid",
                    paid_at: new Date().toISOString(),
                  })),
                }
              : null
          );
        }
        showToast(`Commissions successfully disbursed and marked as PAID!`);
      } else {
        showError(`Failed to disburse commissions.`);
      }
    } catch (e) {
      showError(`Error disbursing commission`);
    }
  };

  // Filtering
  const filtered = agents.filter((a) => {
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      a.name.toLowerCase().includes(q) ||
      a.agency.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      a.phone.toLowerCase().includes(q) ||
      a.referralCode.toLowerCase().includes(q);

    let matchStatus = true;
    if (statusFilter === "Active") matchStatus = a.status === "Active";
    else if (statusFilter === "Suspended") matchStatus = a.status === "Suspended";
    else if (statusFilter === "Pending Payouts")
      matchStatus = a.rawCommissionPending > 0;

    return matchSearch && matchStatus;
  });

  const totalSalesVolumeSum = agents.reduce(
    (sum, a) => sum + (a.rawSalesVolume || 0),
    0
  );
  const totalCommissionPaidSum = agents.reduce(
    (sum, a) => sum + (a.rawCommissionEarned || 0),
    0
  );
  const totalCommissionPendingSum = agents.reduce(
    (sum, a) => sum + (a.rawCommissionPending || 0),
    0
  );

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
              fontSize: "1rem",
            }}
          >
            ✕
          </button>
        </div>
      )}

      {toastError && (
        <div
          style={{
            background: "linear-gradient(135deg, #DC2626, #EF4444)",
            color: "#fff",
            padding: "14px 20px",
            borderRadius: "10px",
            marginBottom: "20px",
            fontWeight: 600,
            boxShadow: "0 4px 12px rgba(239, 68, 68, 0.2)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>⚠️ {toastError}</span>
          <button
            onClick={() => setToastError(null)}
            style={{
              background: "transparent",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              fontSize: "1rem",
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
          marginBottom: "26px",
        }}
      >
        {/* Card 1: Total Registered Partners */}
        <div
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            borderRadius: "14px",
            padding: "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              color: "var(--text-secondary)",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Registered Partners
          </div>
          <div
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              marginTop: "8px",
              color: "var(--text-primary)",
            }}
          >
            {loading ? "…" : `${agents.length} Partners`}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: "4px" }}>
            {agents.filter((a) => a.status === "Active").length} Active in Network
          </div>
        </div>

        {/* Card 2: Sales Volume */}
        <div
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            borderRadius: "14px",
            padding: "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              color: "#2563EB",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Partner Sales Volume
          </div>
          <div
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              marginTop: "8px",
              color: "#2563EB",
            }}
          >
            {loading ? "…" : formatInr(totalSalesVolumeSum)}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: "4px" }}>
            Fractional Units Sold
          </div>
        </div>

        {/* Card 3: Commissions Paid */}
        <div
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            borderRadius: "14px",
            padding: "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              color: "#16A34A",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Commissions Paid
          </div>
          <div
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              marginTop: "8px",
              color: "#16A34A",
            }}
          >
            {loading ? "…" : formatInr(totalCommissionPaidSum)}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#16A34A", marginTop: "4px" }}>
            Disbursed to Bank Accounts
          </div>
        </div>

        {/* Card 4: Pending Payouts */}
        <div
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            borderRadius: "14px",
            padding: "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              color: "#D97706",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Pending Commission Payouts
          </div>
          <div
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              marginTop: "8px",
              color: "#D97706",
            }}
          >
            {loading ? "…" : formatInr(totalCommissionPendingSum)}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#D97706", marginTop: "4px" }}>
            Awaiting Clearance & Settlement
          </div>
        </div>
      </div>

      {/* Header Controls & Filters */}
      <div className={styles.header}>
        <div className={styles.title}>
          Channel Partner & Broker Directory ({filtered.length})
        </div>
        <div className={styles.headerRight}>
          <div className={styles.filterGroup}>
            {["All", "Active", "Pending Payouts", "Suspended"].map((k) => (
              <button
                key={k}
                className={`${styles.filterPill} ${
                  statusFilter === k ? styles.filterActive : ""
                }`}
                onClick={() => setStatusFilter(k)}
              >
                {k === "Pending Payouts"
                  ? `Pending Payouts (${agents.filter((a) => a.rawCommissionPending > 0).length})`
                  : k === "Active"
                  ? `Active (${agents.filter((a) => a.status === "Active").length})`
                  : k === "Suspended"
                  ? `Suspended (${agents.filter((a) => a.status === "Suspended").length})`
                  : `All (${agents.length})`}
              </button>
            ))}
          </div>

          <button
            className={styles.addButton}
            onClick={() => {
              const headers = [
                "Partner Name",
                "Agency / Firm",
                "Email",
                "Phone",
                "Referral Code",
                "Commission Rate (%)",
                "Investors Referred",
                "Sales Volume (INR)",
                "Commission Earned (INR)",
                "Commission Pending (INR)",
                "Bank Name",
                "Bank Account",
                "IFSC",
                "Status",
                "Joined Date",
              ];
              const rows = filtered.map((a) => [
                `"${a.name}"`,
                `"${a.agency}"`,
                `"${a.email}"`,
                `"${a.phone}"`,
                `"${a.referralCode}"`,
                a.commissionRatePct,
                a.totalInvestorsReferred,
                a.rawSalesVolume,
                a.rawCommissionEarned,
                a.rawCommissionPending,
                `"${a.bankName || "—"}"`,
                `"${a.bankAcc || "—"}"`,
                `"${a.bankIfsc || "—"}"`,
                `"${a.status}"`,
                `"${a.joinedDate}"`,
              ]);
              const csvContent =
                [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
              const blob = new Blob([csvContent], {
                type: "text/csv;charset=utf-8;",
              });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = `channel_partner_report_${new Date().toISOString().split("T")[0]}.csv`;
              link.click();
              URL.revokeObjectURL(url);
            }}
          >
            📥 Export CSV Report
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className={styles.searchBar}>
        <span>🔍</span>
        <input
          type="text"
          placeholder="Search by agent name, agency, referral code, email, or phone number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Agents Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Partner & Agency</th>
              <th className={styles.th}>Referral Code</th>
              <th className={styles.th}>Commission Rate</th>
              <th className={styles.th}>Referred Clients</th>
              <th className={styles.th}>Sales Volume</th>
              <th className={styles.th}>Commissions</th>
              <th className={styles.th}>Bank Account</th>
              <th className={styles.th}>Status</th>
              <th className={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className={styles.td} colSpan={9} style={{ textAlign: "center", padding: "40px" }}>
                  Loading registered channel partners...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className={styles.td} colSpan={9} style={{ textAlign: "center", padding: "40px" }}>
                  No channel partners found matching the filter.
                </td>
              </tr>
            ) : (
              filtered.map((agent) => (
                <tr key={agent.id} className={styles.tr}>
                  {/* Partner Name & Agency */}
                  <td className={styles.td}>
                    <div className={styles.propCell}>
                      <div
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 12,
                          background: "linear-gradient(135deg, #D4AF37, #0F172A)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontWeight: 800,
                          fontSize: "0.85rem",
                          flexShrink: 0,
                          boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                        }}
                      >
                        {agent.name
                          .split(" ")
                          .map((p) => p[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </div>
                      <div>
                        <strong style={{ fontSize: "0.95rem", color: "var(--text-primary)" }}>
                          {agent.name}
                        </strong>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                          🏢 {agent.agency} • 📞 {agent.phone}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Referral Code */}
                  <td className={styles.td}>
                    <code
                      style={{
                        background: "rgba(37, 99, 235, 0.08)",
                        color: "#2563EB",
                        padding: "5px 9px",
                        borderRadius: 6,
                        fontWeight: 800,
                        fontSize: "0.85rem",
                        fontFamily: "monospace",
                      }}
                    >
                      {agent.referralCode}
                    </code>
                  </td>

                  {/* Commission Rate */}
                  <td className={styles.td}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <strong style={{ fontSize: "0.95rem" }}>
                        {agent.commissionRatePct}%
                      </strong>
                      <button
                        onClick={() => {
                          setQuickRateAgent(agent);
                          setQuickRateVal(agent.commissionRatePct);
                        }}
                        style={{
                          padding: "2px 7px",
                          fontSize: "0.7rem",
                          borderRadius: 5,
                          border: "1px solid #CBD5E1",
                          background: "#F8FAFC",
                          cursor: "pointer",
                          fontWeight: 600,
                        }}
                        title="Edit commission percentage"
                      >
                        ✏️
                      </button>
                    </div>
                  </td>

                  {/* Referred Clients */}
                  <td className={styles.td}>
                    <strong style={{ fontSize: "0.95rem" }}>
                      {agent.totalInvestorsReferred}
                    </strong>{" "}
                    <span style={{ fontSize: "0.75rem", color: "#64748B" }}>Users</span>
                  </td>

                  {/* Sales Volume */}
                  <td className={styles.td}>
                    <strong style={{ fontSize: "0.95rem", color: "#0F172A" }}>
                      {agent.totalSalesVolume}
                    </strong>
                  </td>

                  {/* Commissions */}
                  <td className={styles.td}>
                    <div style={{ color: "#16A34A", fontWeight: 700, fontSize: "0.9rem" }}>
                      {agent.commissionEarned} Paid
                    </div>
                    {agent.commissionPending !== "₹0" && (
                      <div
                        style={{
                          color: "#D97706",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          marginTop: "2px",
                        }}
                      >
                        ⚡ {agent.commissionPending} Pending
                      </div>
                    )}
                  </td>

                  {/* Bank Details */}
                  <td className={styles.td}>
                    {agent.bankAcc ? (
                      <div>
                        <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155" }}>
                          {agent.bankName || "Bank Account"}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#64748B" }}>
                          A/C: {agent.bankAcc}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#64748B" }}>
                          IFSC: {agent.bankIfsc}
                        </div>
                      </div>
                    ) : (
                      <span style={{ fontSize: "0.75rem", color: "#94A3B8", fontStyle: "italic" }}>
                        Not provided
                      </span>
                    )}
                  </td>

                  {/* Status */}
                  <td className={styles.td}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 10px",
                          borderRadius: "6px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          background:
                            agent.status === "Active" ? "#DCFCE7" : "#FEE2E2",
                          color:
                            agent.status === "Active" ? "#15803D" : "#B91C1C",
                          textAlign: "center"
                        }}
                      >
                        {agent.status}
                      </span>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 10px",
                          borderRadius: "6px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          background: agent.is_approved ? "#D1FAE5" : "#FEF3C7",
                          color: agent.is_approved ? "#059669" : "#D97706",
                          textAlign: "center"
                        }}
                      >
                        {agent.is_approved ? "✓ Approved" : "⏳ Pending"}
                      </span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className={styles.td}>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      <button
                        className={styles.actionBtn}
                        onClick={() => openPartnerDrawer(agent)}
                        style={{
                          background: "#F1F5F9",
                          borderColor: "#CBD5E1",
                          color: "#1E293B",
                          fontWeight: 700,
                          fontSize: "0.8rem",
                          padding: "6px 12px",
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <span>👤</span> Manage
                      </button>

                      <button
                        onClick={() => handleToggleApproval(agent.id, !agent.is_approved)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 8,
                          background: agent.is_approved ? "#FEF2F2" : "#ECFDF5",
                          color: agent.is_approved ? "#DC2626" : "#059669",
                          border: `1px solid ${agent.is_approved ? "#FECACA" : "#A7F3D0"}`,
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                        title={agent.is_approved ? "Revoke Approval" : "Approve Agent"}
                      >
                        {agent.is_approved ? "Revoke" : "Approve"}
                      </button>

                      {agent.rawCommissionPending > 0 && (
                        <button
                          onClick={() => handleDisburseCommission(agent.id)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 8,
                            background: "#16A34A",
                            color: "#fff",
                            border: "none",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                          title="Disburse pending commission to partner bank"
                        >
                          💸 Settle
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Quick Edit Rate Modal */}
      {quickRateAgent && (
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
              maxWidth: "440px",
              padding: "26px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
            }}
          >
            <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0F172A", marginBottom: "6px" }}>
              Update Commission Rate
            </h3>
            <p style={{ fontSize: "0.85rem", color: "#64748B", marginBottom: "16px" }}>
              Configure commission percentage for <strong>{quickRateAgent.name}</strong> ({quickRateAgent.agency})
            </p>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569" }}>
                COMMISSION PERCENTAGE ON SALES (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={quickRateVal}
                onChange={(e) => setQuickRateVal(Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid #CBD5E1",
                  marginTop: "6px",
                  fontSize: "1.1rem",
                  fontWeight: 800,
                }}
              />
              <span style={{ fontSize: "0.75rem", color: "#64748B", display: "block", marginTop: 4 }}>
                Standard rate: 2.0% - 2.5%. High-volume channel partners: 3.0% - 3.5%.
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                onClick={() => setQuickRateAgent(null)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "1px solid #CBD5E1",
                  background: "#F1F5F9",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleQuickUpdateRate}
                style={{
                  padding: "8px 20px",
                  borderRadius: "8px",
                  background: "#2563EB",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Save Rate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Partner 360° Management Drawer / Modal */}
      {selectedAgent && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(5px)",
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
              borderRadius: "18px",
              width: "100%",
              maxWidth: "860px",
              maxHeight: "92vh",
              overflowY: "auto",
              padding: "28px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              border: "1px solid #E2E8F0",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                borderBottom: "1px solid #E2E8F0",
                paddingBottom: "16px",
                marginBottom: "20px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    background: "linear-gradient(135deg, #D4AF37, #0F172A)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: "1.1rem",
                  }}
                >
                  {selectedAgent.name
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </div>
                <div>
                  <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0F172A", margin: 0 }}>
                    {selectedAgent.name}
                  </h2>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px" }}>
                    <span style={{ fontSize: "0.8rem", color: "#64748B" }}>
                      🏢 {selectedAgent.agency}
                    </span>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontWeight: 700,
                        background:
                          selectedAgent.status === "Active" ? "#DCFCE7" : "#FEE2E2",
                        color:
                          selectedAgent.status === "Active" ? "#15803D" : "#B91C1C",
                      }}
                    >
                      {selectedAgent.status}
                    </span>
                    <code
                      style={{
                        fontSize: "0.75rem",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontWeight: 700,
                        background: "#EFF6FF",
                        color: "#2563EB",
                        fontFamily: "monospace",
                      }}
                    >
                      Ref: {selectedAgent.referralCode}
                    </code>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedAgent(null)}
                style={{
                  background: "#F1F5F9",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 14px",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  color: "#475569",
                }}
              >
                ✕ Close
              </button>
            </div>

            {/* Modal Tabs */}
            <div
              style={{
                display: "flex",
                gap: "8px",
                borderBottom: "1px solid #E2E8F0",
                marginBottom: "20px",
                paddingBottom: "8px",
              }}
            >
              {[
                { key: "profile", label: "📋 Partner Profile" },
                { key: "commissions", label: `💰 Commission Ledger (${selectedAgent.commissions.length})` },
                { key: "clients", label: `👥 Leads & Clients (${selectedAgent.clients.length + selectedAgent.referredInvestors.length})` },
                { key: "bank", label: "🏦 Bank & Payouts" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: "none",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    background: activeTab === tab.key ? "#0F172A" : "transparent",
                    color: activeTab === tab.key ? "#FFFFFF" : "#64748B",
                    transition: "all 0.15s ease",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB 1: Partner Profile */}
            {activeTab === "profile" && (
              <div>
                <div
                  style={{
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: "12px",
                    padding: "20px",
                    marginBottom: "20px",
                  }}
                >
                  <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "16px", color: "#1E293B" }}>
                    Edit Channel Partner Credentials
                  </h3>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "16px",
                      marginBottom: "16px",
                    }}
                  >
                    <div>
                      <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748B" }}>
                        FULL NAME
                      </label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: "8px",
                          border: "1px solid #CBD5E1",
                          marginTop: "4px",
                          fontSize: "0.9rem",
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748B" }}>
                        AGENCY / REALTY FIRM NAME
                      </label>
                      <input
                        type="text"
                        value={editAgency}
                        placeholder="e.g. Apex Wealth Partners"
                        onChange={(e) => setEditAgency(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: "8px",
                          border: "1px solid #CBD5E1",
                          marginTop: "4px",
                          fontSize: "0.9rem",
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748B" }}>
                        PHONE NUMBER
                      </label>
                      <input
                        type="text"
                        value={editPhone}
                        placeholder="e.g. +91 98450 77812"
                        onChange={(e) => setEditPhone(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: "8px",
                          border: "1px solid #CBD5E1",
                          marginTop: "4px",
                          fontSize: "0.9rem",
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748B" }}>
                        REFERRAL CODE
                      </label>
                      <input
                        type="text"
                        value={editRefCode}
                        placeholder="e.g. RS-VIKRAM-APEX"
                        onChange={(e) => setEditRefCode(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: "8px",
                          border: "1px solid #CBD5E1",
                          marginTop: "4px",
                          fontSize: "0.9rem",
                          fontFamily: "monospace",
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748B" }}>
                        COMMISSION RATE (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={editRate}
                        onChange={(e) => setEditRate(Number(e.target.value))}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: "8px",
                          border: "1px solid #CBD5E1",
                          marginTop: "4px",
                          fontSize: "0.9rem",
                          fontWeight: 700,
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748B" }}>
                        EMAIL ADDRESS
                      </label>
                      <input
                        type="text"
                        value={selectedAgent.email}
                        disabled
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: "8px",
                          border: "1px solid #CBD5E1",
                          marginTop: "4px",
                          fontSize: "0.9rem",
                          background: "#F1F5F9",
                          color: "#64748B",
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      onClick={handleSavePartner}
                      disabled={isSavingPartner}
                      style={{
                        padding: "10px 24px",
                        borderRadius: "8px",
                        background: "#0F172A",
                        color: "#fff",
                        fontWeight: 700,
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      {isSavingPartner ? "Saving…" : "✓ Save Partner Changes"}
                    </button>
                  </div>
                </div>

                {/* Account Status Controls */}
                <div
                  style={{
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: "12px",
                    padding: "20px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1E293B", margin: 0 }}>
                      Partner Account Status
                    </h4>
                    <p style={{ fontSize: "0.8rem", color: "#64748B", marginTop: "2px" }}>
                      Current status: <strong>{selectedAgent.status}</strong>
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => handleToggleStatus(selectedAgent.id, true)}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "6px",
                        border: "none",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        background: selectedAgent.status === "Active" ? "#16A34A" : "#E2E8F0",
                        color: selectedAgent.status === "Active" ? "#fff" : "#475569",
                      }}
                    >
                      Active Partner
                    </button>
                    <button
                      onClick={() => handleToggleStatus(selectedAgent.id, false)}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "6px",
                        border: "none",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        background: selectedAgent.status === "Suspended" ? "#DC2626" : "#E2E8F0",
                        color: selectedAgent.status === "Suspended" ? "#fff" : "#475569",
                      }}
                    >
                      Suspend Partner
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Commission Ledger */}
            {activeTab === "commissions" && (
              <div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "14px",
                    marginBottom: "20px",
                  }}
                >
                  <div
                    style={{
                      background: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                      borderRadius: "12px",
                      padding: "16px",
                    }}
                  >
                    <span style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 700 }}>
                      TOTAL SALES VOLUME
                    </span>
                    <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0F172A", marginTop: "4px" }}>
                      {selectedAgent.totalSalesVolume}
                    </div>
                  </div>

                  <div
                    style={{
                      background: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                      borderRadius: "12px",
                      padding: "16px",
                    }}
                  >
                    <span style={{ fontSize: "0.75rem", color: "#16A34A", fontWeight: 700 }}>
                      COMMISSIONS PAID
                    </span>
                    <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#16A34A", marginTop: "4px" }}>
                      {selectedAgent.commissionEarned}
                    </div>
                  </div>

                  <div
                    style={{
                      background: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                      borderRadius: "12px",
                      padding: "16px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: "0.75rem", color: "#D97706", fontWeight: 700 }}>
                        PENDING CLEARANCE
                      </span>
                      <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#D97706", marginTop: "4px" }}>
                        {selectedAgent.commissionPending}
                      </div>
                    </div>

                    {selectedAgent.rawCommissionPending > 0 && (
                      <button
                        onClick={() => handleDisburseCommission(selectedAgent.id)}
                        style={{
                          padding: "8px 14px",
                          borderRadius: "8px",
                          background: "#16A34A",
                          color: "#fff",
                          fontWeight: 700,
                          fontSize: "0.8rem",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        💸 Disburse All
                      </button>
                    )}
                  </div>
                </div>

                {selectedAgent.commissions.length === 0 ? (
                  <div
                    style={{
                      padding: "36px 20px",
                      textAlign: "center",
                      color: "#64748B",
                      background: "#F8FAFC",
                      borderRadius: "12px",
                      border: "1px solid #E2E8F0",
                    }}
                  >
                    <div style={{ fontSize: "2rem", marginBottom: "8px" }}>💰</div>
                    <strong style={{ color: "#0F172A" }}>No Commission Transactions Yet</strong>
                    <p style={{ fontSize: "0.85rem", marginTop: 4 }}>
                      When referred investors purchase property fractions, commission records will be listed here.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {selectedAgent.commissions.map((comm) => (
                      <div
                        key={comm.id}
                        style={{
                          border: "1px solid #E2E8F0",
                          borderRadius: "10px",
                          padding: "14px 18px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          background: "#FFFFFF",
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: "0.95rem", color: "#0F172A" }}>
                            {comm.property_title}
                          </strong>
                          <div style={{ fontSize: "0.8rem", color: "#64748B", marginTop: "2px" }}>
                            Investor: <strong>{comm.investor_name}</strong> ({comm.investor_email}) • {comm.fractions_bought} Fractions (₹{comm.investment_amount.toLocaleString("en-IN")})
                          </div>
                        </div>

                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "1rem", fontWeight: 800, color: "#16A34A" }}>
                            ₹{comm.commission_amount.toLocaleString("en-IN")} ({comm.commission_percentage}%)
                          </div>
                          <span
                            style={{
                              display: "inline-block",
                              marginTop: "4px",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              background: comm.status === "paid" ? "#DCFCE7" : "#FEF3C7",
                              color: comm.status === "paid" ? "#15803D" : "#B45309",
                            }}
                          >
                            {comm.status === "paid" ? "PAID OUT" : "PENDING CLEARANCE"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Leads & Referred Clients */}
            {activeTab === "clients" && (
              <div>
                <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1E293B", marginBottom: "14px" }}>
                  Active Leads & Registered Clients ({selectedAgent.clients.length + selectedAgent.referredInvestors.length})
                </h4>

                {selectedAgent.clients.length === 0 && selectedAgent.referredInvestors.length === 0 ? (
                  <div
                    style={{
                      padding: "36px 20px",
                      textAlign: "center",
                      color: "#64748B",
                      background: "#F8FAFC",
                      borderRadius: "12px",
                      border: "1px solid #E2E8F0",
                    }}
                  >
                    <div style={{ fontSize: "2rem", marginBottom: "8px" }}>👥</div>
                    <strong style={{ color: "#0F172A" }}>No Clients Registered Under Partner Code Yet</strong>
                    <p style={{ fontSize: "0.85rem", marginTop: 4 }}>
                      Investors who register with referral code <code>{selectedAgent.referralCode}</code> will appear here.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {/* CRM Leads */}
                    {selectedAgent.clients.map((c) => (
                      <div
                        key={c.id}
                        style={{
                          border: "1px solid #E2E8F0",
                          borderRadius: "10px",
                          padding: "14px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          background: "#FFFFFF",
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: "0.9rem", color: "#0F172A" }}>
                            {c.client_name}
                          </strong>
                          <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: "2px" }}>
                            📞 {c.phone_number} • Target Budget: {c.target_budget}
                          </div>
                        </div>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "4px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            background: "#EFF6FF",
                            color: "#2563EB",
                          }}
                        >
                          {c.status}
                        </span>
                      </div>
                    ))}

                    {/* Converted Registered Investors */}
                    {selectedAgent.referredInvestors.map((inv) => (
                      <div
                        key={inv.id}
                        style={{
                          border: "1px solid #E2E8F0",
                          borderRadius: "10px",
                          padding: "14px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          background: "#FFFFFF",
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: "0.9rem", color: "#0F172A" }}>
                            {inv.name}
                          </strong>
                          <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: "2px" }}>
                            {inv.email} • {inv.phone}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <strong style={{ fontSize: "0.9rem", color: "#16A34A" }}>
                            ₹{inv.total_invested.toLocaleString("en-IN")}
                          </strong>
                          <div style={{ fontSize: "0.7rem", color: "#64748B" }}>Invested</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: Bank & Payouts */}
            {activeTab === "bank" && (
              <div>
                <div
                  style={{
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: "12px",
                    padding: "20px",
                    marginBottom: "20px",
                  }}
                >
                  <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1E293B", marginBottom: "16px" }}>
                    🏦 Settlement Bank Account Details
                  </h4>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
                    <div>
                      <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748B" }}>
                        ACCOUNT HOLDER NAME
                      </label>
                      <input
                        type="text"
                        value={editBankName}
                        placeholder="e.g. Vikram Malhotra"
                        onChange={(e) => setEditBankName(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: "8px",
                          border: "1px solid #CBD5E1",
                          marginTop: "4px",
                          fontSize: "0.9rem",
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748B" }}>
                        BANK ACCOUNT NUMBER
                      </label>
                      <input
                        type="text"
                        value={editBankAcc}
                        placeholder="e.g. 50100492817291"
                        onChange={(e) => setEditBankAcc(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: "8px",
                          border: "1px solid #CBD5E1",
                          marginTop: "4px",
                          fontSize: "0.9rem",
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748B" }}>
                        IFSC CODE
                      </label>
                      <input
                        type="text"
                        value={editBankIfsc}
                        placeholder="e.g. HDFC0001234"
                        onChange={(e) => setEditBankIfsc(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: "8px",
                          border: "1px solid #CBD5E1",
                          marginTop: "4px",
                          fontSize: "0.9rem",
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
                    <button
                      onClick={handleSavePartner}
                      disabled={isSavingPartner}
                      style={{
                        padding: "8px 20px",
                        borderRadius: "8px",
                        background: "#0F172A",
                        color: "#fff",
                        fontWeight: 700,
                        border: "none",
                        cursor: "pointer",
                        fontSize: "0.85rem",
                      }}
                    >
                      {isSavingPartner ? "Saving…" : "Save Bank Information"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
