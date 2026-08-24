"use client";
import React, { useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import styles from "../properties/Properties.module.css";

interface NotificationLog {
  id: string;
  title: string;
  message: string;
  channel: "In-App Push" | "SMS" | "Email" | "Broadcast";
  targetAudience: "All Users" | "Investors Only" | "Agents Only" | "Builders";
  sentAt: string;
  deliveryCount: number;
  openRate: string;
  status: "Delivered" | "Queued" | "Failed";
}

const initialLogs: NotificationLog[] = [
  {
    id: "NTF-801",
    title: "🚀 New Commercial Property Launched: Cyber Pearl Hub",
    message: "Co-own premium tech park spaces in HITEC City with assured 8.8% rental yield.",
    channel: "Broadcast",
    targetAudience: "All Users",
    sentAt: "19 Aug 2026, 10:30 AM",
    deliveryCount: 1402,
    openRate: "68.4%",
    status: "Delivered",
  },
  {
    id: "NTF-802",
    title: "💰 Q2 Fractional Rental Yield Credited to Your Wallet",
    message: "Your quarterly dividend of ₹81,250 has been deposited to your RealShare wallet.",
    channel: "In-App Push",
    targetAudience: "Investors Only",
    sentAt: "15 Aug 2026, 09:00 AM",
    deliveryCount: 380,
    openRate: "94.2%",
    status: "Delivered",
  },
  {
    id: "NTF-803",
    title: "⚡ Special 2.5% Agent Incentive for Goa Beachfront Villa",
    message: "Close fractional bookings before 31st August and earn instant bonus commissions.",
    channel: "SMS",
    targetAudience: "Agents Only",
    sentAt: "12 Aug 2026, 14:15 PM",
    deliveryCount: 42,
    openRate: "98.0%",
    status: "Delivered",
  },
];

export default function NotificationsPage() {
  const [logs, setLogs] = useState<NotificationLog[]>(initialLogs);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [newNotice, setNewNotice] = useState({
    title: "",
    message: "",
    channel: "Broadcast" as const,
    targetAudience: "All Users" as const,
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotice.title || !newNotice.message) return;

    const created: NotificationLog = {
      id: `NTF-${Math.floor(800 + Math.random() * 200)}`,
      title: newNotice.title,
      message: newNotice.message,
      channel: newNotice.channel,
      targetAudience: newNotice.targetAudience,
      sentAt: "Just now",
      deliveryCount: newNotice.targetAudience === "All Users" ? 1402 : 380,
      openRate: "Queued",
      status: "Delivered",
    };

    setLogs([created, ...logs]);
    setShowBroadcastModal(false);
    showToast(`Broadcast "${created.title}" dispatched successfully via ${created.channel}!`);
  };

  return (
    <AdminLayout title="Notification Hub & Communications">
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
          gridTemplateColumns: "repeat(3, 1fr)",
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
            Total Broadcasts Sent
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "6px" }}>
            {logs.length} Campaigns
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
            Total Messages Delivered
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "6px", color: "#16A34A" }}>
            1,824 Recipients
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
            Avg. In-App Open Rate
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "6px", color: "#2563EB" }}>
            86.8%
          </div>
        </div>
      </div>

      {/* Header controls */}
      <div className={styles.header}>
        <div className={styles.title}>Notification & Alert History</div>
        <div className={styles.headerRight}>
          <button className={styles.addButton} onClick={() => setShowBroadcastModal(true)}>
            📢 Create New Broadcast
          </button>
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Notification Title & Message</th>
              <th className={styles.th}>Channel</th>
              <th className={styles.th}>Audience</th>
              <th className={styles.th}>Sent Timestamp</th>
              <th className={styles.th}>Delivered</th>
              <th className={styles.th}>Open Rate</th>
              <th className={styles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className={styles.tr}>
                <td className={styles.td}>
                  <strong>{log.title}</strong>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: 2 }}>
                    {log.message}
                  </div>
                </td>
                <td className={styles.td}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      background: "#EFF6FF",
                      color: "#2563EB",
                    }}
                  >
                    {log.channel}
                  </span>
                </td>
                <td className={styles.td}>
                  <strong>{log.targetAudience}</strong>
                </td>
                <td className={styles.td}>{log.sentAt}</td>
                <td className={styles.td}>
                  <strong>{log.deliveryCount}</strong>
                </td>
                <td className={styles.td}>
                  <span style={{ color: "#16A34A", fontWeight: 700 }}>{log.openRate}</span>
                </td>
                <td className={styles.td}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      background: "#DCFCE7",
                      color: "#15803D",
                    }}
                  >
                    {log.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Broadcast Modal */}
      {showBroadcastModal && (
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
              maxWidth: "540px",
              padding: "28px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid #E2E8F0",
                paddingBottom: "16px",
                marginBottom: "20px",
              }}
            >
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0F172A" }}>
                Send Broadcast Notification
              </h2>
              <button
                onClick={() => setShowBroadcastModal(false)}
                style={{
                  background: "#F1F5F9",
                  border: "none",
                  borderRadius: "8px",
                  padding: "6px 12px",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendBroadcast} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>Notification Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 🏢 Special Yield Update for Cyber Pearl Tech Park"
                  value={newNotice.title}
                  onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1", marginTop: "4px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>Delivery Channel</label>
                  <select
                    value={newNotice.channel}
                    onChange={(e) => setNewNotice({ ...newNotice, channel: e.target.value as any })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1", marginTop: "4px" }}
                  >
                    <option value="Broadcast">Broadcast (Push + In-App)</option>
                    <option value="In-App Push">In-App Push Only</option>
                    <option value="SMS">SMS Gateway</option>
                    <option value="Email">Email Digest</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>Target Audience</label>
                  <select
                    value={newNotice.targetAudience}
                    onChange={(e) => setNewNotice({ ...newNotice, targetAudience: e.target.value as any })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1", marginTop: "4px" }}
                  >
                    <option value="All Users">All Users (Investors + Agents)</option>
                    <option value="Investors Only">Investors Only</option>
                    <option value="Agents Only">Agents Only</option>
                    <option value="Builders">Builders Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>Message Body</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Enter message text that will appear in user notifications..."
                  value={newNotice.message}
                  onChange={(e) => setNewNotice({ ...newNotice, message: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1", marginTop: "4px", resize: "vertical" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "14px" }}>
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  style={{ padding: "10px 16px", borderRadius: "8px", border: "1px solid #CBD5E1", background: "#fff", cursor: "pointer", fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: "10px 24px", borderRadius: "8px", background: "#2563EB", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700 }}
                >
                  Dispatch Notification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
