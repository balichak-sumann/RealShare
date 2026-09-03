"use client";
import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { getAuthHeader } from "@/lib/api-auth";
import styles from "../properties/Properties.module.css";

// The only transaction_type value ever actually written by the backend today
// (see src/app/api/transactions/create-order/route.ts). Keep this in sync
// with the write paths rather than the aspirational Investment/Deposit/Payout
// set the UI used to show, which never matched anything in the database.
const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  property_booking: "Property Booking",
};

const typeColors: Record<string, string> = {
  property_booking: "#2563EB",
};

const statusColors: Record<string, string> = {
  Completed: "#16A34A",
  Pending: "#D97706",
  Processing: "#2563EB",
  Failed: "#DC2626",
};

export default function LedgerPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    (async () => {
      const authHeader = await getAuthHeader();
      if (!authHeader) { setLoading(false); return; }
      fetch('/api/transactions', { headers: authHeader })
        .then(res => res.json())
        .then(data => {
          setTransactions(data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    })();
  }, []);

  const filtered = transactions.filter(txn => {
    const typeStr = txn.transaction_type;
    const matchType = typeFilter === "All" || typeStr === typeFilter;
    const searchString = `${txn.id} ${txn.profile?.full_name} ${txn.property?.title}`.toLowerCase();
    const matchSearch = searchString.includes(search.toLowerCase());

    let matchDate = true;
    if (dateFrom || dateTo) {
      const txnDate = new Date(txn.created_at);
      if (dateFrom && new Date(dateFrom) > txnDate) matchDate = false;
      if (dateTo && new Date(dateTo) < txnDate) matchDate = false;
    }

    return matchType && matchSearch && matchDate;
  });

  const handleExportCSV = () => {
    const headers = ["Transaction ID", "Date", "Investor", "Property", "Type", "Fractions", "Amount (₹)", "Status"];
    const rows = filtered.map(t => [
      t.id,
      new Date(t.created_at).toLocaleString(),
      t.profile?.full_name || 'System',
      t.property?.title || 'Wallet Action',
      TRANSACTION_TYPE_LABELS[t.transaction_type] || t.transaction_type,
      t.investment?.fractions_bought || '-',
      t.amount,
      t.payment_status
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `transactions_ledger_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const totalCompletedVolume = transactions
    .filter(t => t.payment_status === "completed")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  if (loading) return <AdminLayout title="Ledger & Transactions"><div>Loading...</div></AdminLayout>;

  return (
    <AdminLayout title="Ledger & Transactions">
      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 28 }}>
        <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600, marginBottom: 6 }}>Total Transactions</div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--text-primary)" }}>{transactions.length}</div>
        </div>
        <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600, marginBottom: 6 }}>Completed Volume</div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#16A34A" }}>₹{(totalCompletedVolume / 100000).toFixed(2)} Lakhs</div>
        </div>
        <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600, marginBottom: 6 }}>Pending Approvals</div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#D97706" }}>
            {transactions.filter(t => t.payment_status === "pending").length}
          </div>
        </div>
      </div>

      <div className={styles.header}>
        <div className={styles.title}>Transaction History</div>
        <div className={styles.headerRight}>
          <div className={styles.filterGroup}>
            {["All", ...Object.keys(TRANSACTION_TYPE_LABELS)].map(t => (
              <button key={t} className={`${styles.filterPill} ${typeFilter === t ? styles.filterActive : ""}`} onClick={() => setTypeFilter(t)}>
                {t === "All" ? "All" : TRANSACTION_TYPE_LABELS[t] || t}
              </button>
            ))}
          </div>
          <button className={styles.addButton} onClick={handleExportCSV}>📥 Export CSV</button>
        </div>
      </div>

      <div className={styles.searchBar} style={{ display: 'flex', gap: '12px', background: 'transparent', padding: 0, border: 'none' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '0 12px' }}>
          <span>🔍</span>
          <input type="text" placeholder="Search by transaction ID, investor, or property..." value={search} onChange={e => setSearch(e.target.value)} style={{ border: 'none', background: 'transparent', width: '100%', padding: '12px', outline: 'none' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '0 12px' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>From:</span>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ border: 'none', outline: 'none', color: '#0F172A' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '0 12px' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>To:</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ border: 'none', outline: 'none', color: '#0F172A' }} />
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Transaction ID</th>
              <th className={styles.th}>Date & Time</th>
              <th className={styles.th}>Investor</th>
              <th className={styles.th}>Property / Action</th>
              <th className={styles.th}>Type</th>
              <th className={styles.th}>Fractions</th>
              <th className={styles.th}>Amount</th>
              <th className={styles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((txn) => (
              <tr key={txn.id} className={styles.tr}>
                <td className={styles.td}><strong style={{ fontFamily: "monospace" }}>{txn.id.substring(0, 8)}</strong></td>
                <td className={styles.td}>{new Date(txn.created_at).toLocaleString()}</td>
                <td className={styles.td}>{txn.profile?.full_name || 'System'}</td>
                <td className={styles.td}>{txn.property?.title || 'Wallet Action'}</td>
                <td className={styles.td}>
                  <span className={styles.badge} style={{ background: `${typeColors[txn.transaction_type] || "#666"}15`, color: typeColors[txn.transaction_type] || "#666" }}>{TRANSACTION_TYPE_LABELS[txn.transaction_type] || txn.transaction_type}</span>
                </td>
                <td className={styles.td}>{txn.investment?.fractions_bought || '-'}</td>
                <td className={styles.td}><strong>₹{Number(txn.amount).toLocaleString('en-IN')}</strong></td>
                <td className={styles.td}>
                  <span className={styles.statusBadge} style={{ background: `${statusColors[txn.payment_status] || "#666"}15`, color: statusColors[txn.payment_status] || "#666" }}>{txn.payment_status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
