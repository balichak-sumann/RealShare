"use client";
import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { getAuthHeader } from "@/lib/api-auth";
import styles from "../properties/Properties.module.css";

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  property_booking: "Property Booking",
  fraction_purchase: "Fraction Purchase",
  wallet_topup: "Wallet Topup",
  wallet_deposit: "Wallet Deposit",
  rental_yield: "Rental Yield",
  commission_payout: "Commission Payout",
  token_refund: "Token Refund",
};

const typeColors: Record<string, string> = {
  property_booking: "#2563EB",
  fraction_purchase: "#2563EB",
  wallet_topup: "#059669",
  wallet_deposit: "#059669",
  rental_yield: "#7C3AED",
  commission_payout: "#D97706",
  token_refund: "#DC2626",
};

const statusColors: Record<string, { bg: string; text: string }> = {
  completed: { bg: "#DCFCE7", text: "#15803D" },
  pending: { bg: "#FEF3C7", text: "#B45309" },
  processing: { bg: "#EFF6FF", text: "#2563EB" },
  failed: { bg: "#FEE2E2", text: "#B91C1C" },
};

export default function LedgerPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const loadTransactions = async () => {
    setLoading(true);
    const authHeader = await getAuthHeader();
    if (!authHeader) {
      setLoading(false);
      return;
    }
    fetch("/api/transactions", { headers: authHeader })
      .then((res) => res.json())
      .then((data) => {
        setTransactions(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const authHeader = await getAuthHeader();
    if (!authHeader) return;

    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: "PATCH",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ payment_status: newStatus }),
      });

      if (res.ok) {
        setTransactions((prev) =>
          prev.map((t) => (t.id === id ? { ...t, payment_status: newStatus } : t))
        );
        showToast(`Transaction ${id.substring(0, 8)} status updated to ${newStatus}`);
      } else {
        showToast("Failed to update transaction status");
      }
    } catch (e) {
      showToast("Error updating status");
    }
  };

  const filtered = transactions.filter((txn) => {
    const typeStr = txn.transaction_type;
    const matchType = typeFilter === "All" || typeStr === typeFilter;
    const matchStatus =
      statusFilter === "All" ||
      (txn.payment_status && txn.payment_status.toLowerCase() === statusFilter.toLowerCase());

    const searchString = `${txn.id} ${txn.profile?.full_name || ""} ${txn.profile?.email || ""} ${
      txn.property?.title || ""
    } ${txn.gateway_txn_id || ""}`.toLowerCase();
    const matchSearch = searchString.includes(search.toLowerCase());

    let matchDate = true;
    if (dateFrom || dateTo) {
      const txnDate = new Date(txn.created_at);
      if (dateFrom && new Date(dateFrom) > txnDate) matchDate = false;
      if (dateTo && new Date(dateTo) < txnDate) matchDate = false;
    }

    return matchType && matchStatus && matchSearch && matchDate;
  });

  const handleExportCSV = () => {
    const headers = [
      "Transaction ID",
      "Gateway Ref",
      "Date & Time",
      "Investor Name",
      "Investor Email",
      "Property / Purpose",
      "Type",
      "Fractions Bought",
      "Amount (INR)",
      "Payment Mode",
      "Status",
    ];
    const rows = filtered.map((t) => [
      t.id,
      t.gateway_txn_id || "-",
      new Date(t.created_at).toLocaleString(),
      t.profile?.full_name || "System",
      t.profile?.email || "-",
      t.property?.title || "Wallet / Other",
      TRANSACTION_TYPE_LABELS[t.transaction_type] || t.transaction_type,
      t.investment?.fractions_bought || "-",
      t.amount,
      t.payment_method || t.payment_gateway || "Razorpay",
      t.payment_status,
    ]);
    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `financial_ledger_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const totalVolume = transactions.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalCompletedVolume = transactions
    .filter((t) => t.payment_status?.toLowerCase() === "completed")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const pendingTransactions = transactions.filter(
    (t) => t.payment_status?.toLowerCase() === "pending"
  );
  const totalPendingVolume = pendingTransactions.reduce(
    (sum, t) => sum + Number(t.amount || 0),
    0
  );
  const failedTransactionsCount = transactions.filter(
    (t) => t.payment_status?.toLowerCase() === "failed"
  ).length;

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    }
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)} Lakhs`;
    }
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  if (loading)
    return (
      <AdminLayout title="Financial Ledger & Transactions">
        <div style={{ padding: "40px", textAlign: "center" }}>Loading financial ledger data...</div>
      </AdminLayout>
    );

  return (
    <AdminLayout title="Financial Ledger & Transactions">
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

      {/* Summary KPI Cards */}
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
          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>
            Total Transactions
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "6px", color: "var(--text-primary)" }}>
            {transactions.length}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: 4 }}>
            Gross: {formatCurrency(totalVolume)}
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
          <div style={{ fontSize: "0.75rem", color: "#16A34A", textTransform: "uppercase", fontWeight: 600 }}>
            Completed Volume
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "6px", color: "#16A34A" }}>
            {formatCurrency(totalCompletedVolume)}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: 4 }}>
            {transactions.filter((t) => t.payment_status?.toLowerCase() === "completed").length} Successful
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
          <div style={{ fontSize: "0.75rem", color: "#D97706", textTransform: "uppercase", fontWeight: 600 }}>
            Pending Volume
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "6px", color: "#D97706" }}>
            {formatCurrency(totalPendingVolume)}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: 4 }}>
            {pendingTransactions.length} Pending Actions
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
          <div style={{ fontSize: "0.75rem", color: "#DC2626", textTransform: "uppercase", fontWeight: 600 }}>
            Failed / Cancelled
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "6px", color: "#DC2626" }}>
            {failedTransactionsCount}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: 4 }}>
            Unsettled Transactions
          </div>
        </div>
      </div>

      {/* Header with Type & Status Filters */}
      <div className={styles.header}>
        <div className={styles.title}>All Financial Records ({filtered.length})</div>
        <div className={styles.headerRight}>
          <div className={styles.filterGroup}>
            {["All", "completed", "pending", "failed"].map((st) => (
              <button
                key={st}
                className={`${styles.filterPill} ${statusFilter.toLowerCase() === st ? styles.filterActive : ""}`}
                onClick={() => setStatusFilter(st === "All" ? "All" : st)}
              >
                {st === "All" ? "All Status" : st.charAt(0).toUpperCase() + st.slice(1)}
              </button>
            ))}
          </div>
          <button className={styles.addButton} onClick={handleExportCSV}>
            📥 Export CSV Ledger
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div
        className={styles.searchBar}
        style={{ display: "flex", gap: "12px", background: "transparent", padding: 0, border: "none", marginBottom: "16px" }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            background: "#fff",
            border: "1px solid #E2E8F0",
            borderRadius: "8px",
            padding: "0 12px",
          }}
        >
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search by Transaction ID, Investor Name, Email, Property, or Gateway Ref..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: "none", background: "transparent", width: "100%", padding: "12px", outline: "none" }}
          />
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "#fff",
            border: "1px solid #E2E8F0",
            borderRadius: "8px",
            padding: "0 12px",
          }}
        >
          <span style={{ fontSize: "0.8rem", color: "#64748B", fontWeight: 600 }}>From:</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            style={{ border: "none", outline: "none", color: "#0F172A" }}
          />
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "#fff",
            border: "1px solid #E2E8F0",
            borderRadius: "8px",
            padding: "0 12px",
          }}
        >
          <span style={{ fontSize: "0.8rem", color: "#64748B", fontWeight: 600 }}>To:</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            style={{ border: "none", outline: "none", color: "#0F172A" }}
          />
        </div>
      </div>

      {/* Ledger Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Transaction Ref</th>
              <th className={styles.th}>Date & Time</th>
              <th className={styles.th}>Investor</th>
              <th className={styles.th}>Property / Context</th>
              <th className={styles.th}>Type</th>
              <th className={styles.th}>Fractions</th>
              <th className={styles.th}>Amount</th>
              <th className={styles.th}>Status</th>
              <th className={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", padding: "32px", color: "#64748B" }}>
                  No financial transactions found matching the filter.
                </td>
              </tr>
            ) : (
              filtered.map((txn) => {
                const normStatus = (txn.payment_status || "pending").toLowerCase();
                const colors = statusColors[normStatus] || { bg: "#F1F5F9", text: "#475569" };
                return (
                  <tr key={txn.id} className={styles.tr}>
                    <td className={styles.td}>
                      <strong style={{ fontFamily: "monospace" }}>{txn.id.substring(0, 8)}</strong>
                      {txn.gateway_txn_id && (
                        <div style={{ fontSize: "0.7rem", color: "#64748B", fontFamily: "monospace" }}>
                          {txn.gateway_txn_id}
                        </div>
                      )}
                    </td>
                    <td className={styles.td}>{new Date(txn.created_at).toLocaleString()}</td>
                    <td className={styles.td}>
                      <strong>{txn.profile?.full_name || "Direct Investor"}</strong>
                      {txn.profile?.email && (
                        <div style={{ fontSize: "0.75rem", color: "#64748B" }}>{txn.profile.email}</div>
                      )}
                    </td>
                    <td className={styles.td}>
                      <strong>{txn.property?.title || "Wallet Top-up"}</strong>
                      {txn.payment_method && (
                        <div style={{ fontSize: "0.75rem", color: "#64748B" }}>
                          Via {txn.payment_method} ({txn.payment_gateway || "Razorpay"})
                        </div>
                      )}
                    </td>
                    <td className={styles.td}>
                      <span
                        className={styles.badge}
                        style={{
                          background: `${typeColors[txn.transaction_type] || "#666"}15`,
                          color: typeColors[txn.transaction_type] || "#666",
                          fontWeight: 700,
                        }}
                      >
                        {TRANSACTION_TYPE_LABELS[txn.transaction_type] || txn.transaction_type}
                      </span>
                    </td>
                    <td className={styles.td}>
                      <strong>{txn.investment?.fractions_bought || "-"}</strong>
                    </td>
                    <td className={styles.td}>
                      <strong style={{ fontSize: "0.95rem", color: "#0F172A" }}>
                        ₹{Number(txn.amount).toLocaleString("en-IN")}
                      </strong>
                    </td>
                    <td className={styles.td}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 8px",
                          borderRadius: "6px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          background: colors.bg,
                          color: colors.text,
                          textTransform: "capitalize",
                        }}
                      >
                        {txn.payment_status || "pending"}
                      </span>
                    </td>
                    <td className={styles.td}>
                      <select
                        value={normStatus}
                        onChange={(e) => handleUpdateStatus(txn.id, e.target.value)}
                        style={{
                          padding: "4px 8px",
                          borderRadius: "6px",
                          border: "1px solid #CBD5E1",
                          fontSize: "0.75rem",
                          background: "#fff",
                          cursor: "pointer",
                        }}
                      >
                        <option value="completed">Completed</option>
                        <option value="pending">Pending</option>
                        <option value="failed">Failed</option>
                      </select>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
