"use client";
import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import styles from "../properties/Properties.module.css";
import { getAuthHeader } from "@/lib/api-auth";

interface NotificationLog {
  id: string;
  title: string;
  message: string;
  channel: "In-App Push" | "SMS" | "Email" | "Broadcast";
  targetAudience: "All Users" | "Investors Only" | "Agents Only" | "Builders";
  sentAt: string;
  deliveryCount: number;
  openRate: string;
  // "Delivered"/"Partial"/"Failed" reflect a real per-token Expo push result
  // (only known right after sending -- the DB doesn't persist it). "Sent"
  // means the broadcast was logged but we have no delivery outcome for it
  // (e.g. re-loaded from history), which is honest instead of assuming success.
  status: "Delivered" | "Partial" | "Failed" | "Sent";
}

// pushResult is only available immediately after POSTing a new broadcast --
// history fetched via GET has no persisted delivery outcome to report.
function mapApiNotification(
  n: any,
  pushResult?: { sent: number; failed: number; eligible: number }
): NotificationLog {
  const audienceMap: Record<string, NotificationLog['targetAudience']> = {
    all: 'All Users',
    investors: 'Investors Only',
    agents: 'Agents Only',
    builders: 'Builders',
  };

  let status: NotificationLog['status'] = 'Sent';
  if (pushResult) {
    if (pushResult.eligible === 0) status = 'Sent';
    else if (pushResult.failed === 0) status = 'Delivered';
    else if (pushResult.sent === 0) status = 'Failed';
    else status = 'Partial';
  }

  return {
    id: n.id,
    title: n.title,
    message: n.body,
    channel: 'Broadcast',
    targetAudience: audienceMap[n.audience] || 'All Users',
    sentAt: new Date(n.created_at).toLocaleString(),
    deliveryCount: n.recipients_count,
    openRate: 'Not tracked',
    status,
  };
}
export default function NotificationsPage() {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

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

  const loadLogs = async () => {
    setLoading(true);
    const authHeader = await getAuthHeader();
    if (!authHeader) { setLoading(false); return; }
    try {
      const res = await fetch('/api/notifications', { headers: authHeader });
      if (res.ok) {
        const data = await res.json();
        setLogs(Array.isArray(data) ? data.map((n: any) => mapApiNotification(n)) : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const audienceToApi: Record<string, string> = {
    "All Users": "all",
    "Investors Only": "investors",
    "Agents Only": "agents",
    "Builders": "builders",
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotice.title || !newNotice.message) return;
    setSending(true);
    const authHeader = await getAuthHeader();
    if (!authHeader) { showToast("You must be signed in to do that."); setSending(false); return; }
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newNotice.title,
          message: newNotice.message,
          audience: audienceToApi[newNotice.targetAudience] || 'all',
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Failed to send broadcast.');
        return;
      }
      const data = await res.json();
      setLogs([mapApiNotification(data.notification, data.push), ...logs]);
      setShowBroadcastModal(false);
      const push = data.push as { sent: number; failed: number; eligible: number; targeted: number } | undefined;
      if (push && push.eligible > 0) {
        showToast(
          `Broadcast "${newNotice.title}" sent to ${data.notification.recipients_count} recipient(s) — ` +
          `push delivered to ${push.sent}/${push.eligible} device(s)` +
          (push.failed > 0 ? `, ${push.failed} failed.` : '.')
        );
      } else {
        showToast(`Broadcast "${newNotice.title}" logged for ${data.notification.recipients_count} recipient(s). No devices had push tokens registered.`);
      }
      setNewNotice({ title: "", message: "", channel: "Broadcast", targetAudience: "All Users" });
    } finally {
      setSending(false);
    }
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
            {logs.reduce((sum, l) => sum + l.deliveryCount, 0).toLocaleString('en-IN')} Recipients
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
            Broadcasts Sent
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "6px", color: "#2563EB" }}>
            {logs.length}
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
                      background:
                        log.status === "Delivered" ? "#DCFCE7" :
                        log.status === "Partial" ? "#FEF3C7" :
                        log.status === "Failed" ? "#FEE2E2" :
                        "#EFF6FF",
                      color:
                        log.status === "Delivered" ? "#15803D" :
                        log.status === "Partial" ? "#B45309" :
                        log.status === "Failed" ? "#B91C1C" :
                        "#2563EB",
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
