"use client";
import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import styles from "../properties/Properties.module.css";

const typeColors: Record<string, string> = {
  Investment: "#2563EB",
  Deposit: "#059669",
  Payout: "#7C3AED",
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

  useEffect(() => {
    fetch('/api/transactions')
      .then(res => res.json())
      .then(data => {
        setTransactions(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const filtered = transactions.filter(txn => {
    const typeStr = txn.transaction_type;
    const matchType = typeFilter === "All" || typeStr === typeFilter;
    const searchString = `${txn.id} ${txn.profile?.full_name} ${txn.property?.title}`.toLowerCase();
    const matchSearch = searchString.includes(search.toLowerCase());
    return matchType && matchSearch;
  });

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
            {["All", "Investment", "Deposit", "Payout"].map(t => (
              <button key={t} className={`${styles.filterPill} ${typeFilter === t ? styles.filterActive : ""}`} onClick={() => setTypeFilter(t)}>{t}</button>
            ))}
          </div>
          <button className={styles.addButton}>+ Credit Wallet</button>
        </div>
      </div>

      <div className={styles.searchBar}>
        <span>🔍</span>
        <input type="text" placeholder="Search by transaction ID, investor, or property..." value={search} onChange={e => setSearch(e.target.value)} />
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
                  <span className={styles.badge} style={{ background: `${typeColors[txn.transaction_type] || "#666"}15`, color: typeColors[txn.transaction_type] || "#666" }}>{txn.transaction_type}</span>
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
