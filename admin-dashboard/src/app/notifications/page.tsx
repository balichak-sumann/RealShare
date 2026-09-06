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
  status: "Delivered" | "Partial" | "Failed" | "Sent";
}

interface ScheduledNotificationItem {
  id: string;
  title: string;
  body: string;
  audience: string;
  repeat_type: "once" | "daily" | "weekly" | "monthly";
  repeat_time: string | null;
  repeat_day: number | null;
  next_send_at: string;
  is_active: boolean;
  last_sent_at: string | null;
  send_count: number;
  created_at: string;
}

function mapApiNotification(
  n: any,
  pushResult?: { sent: number; failed: number; eligible: number }
): NotificationLog {
  const audienceMap: Record<string, NotificationLog["targetAudience"]> = {
    all: "All Users",
    investors: "Investors Only",
    agents: "Agents Only",
    builders: "Builders",
  };

  let status: NotificationLog["status"] = "Sent";
  if (pushResult) {
    if (pushResult.eligible === 0) status = "Sent";
    else if (pushResult.failed === 0) status = "Delivered";
    else if (pushResult.sent === 0) status = "Failed";
    else status = "Partial";
  }

  return {
    id: n.id,
    title: n.title,
    message: n.body,
    channel: "Broadcast",
    targetAudience: audienceMap[n.audience] || "All Users",
    sentAt: new Date(n.created_at).toLocaleString(),
    deliveryCount: n.recipients_count,
    openRate: "Not tracked",
    status,
  };
}

const audienceToApi: Record<string, string> = {
  "All Users": "all",
  "Investors Only": "investors",
  "Agents Only": "agents",
  Builders: "builders",
};

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<"history" | "scheduled">("history");
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [scheduledList, setScheduledList] = useState<ScheduledNotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [deliveryMode, setDeliveryMode] = useState<"immediate" | "scheduled">("immediate");
  const [newNotice, setNewNotice] = useState({
    title: "",
    message: "",
    channel: "Broadcast" as const,
    targetAudience: "All Users" as const,
    repeat_type: "daily" as "once" | "daily" | "weekly" | "monthly",
    repeat_preset: "morning" as "morning" | "night" | "custom",
    repeat_time: "09:00",
    repeat_day: 1, // 1 = Monday for weekly, or 1st for monthly
    start_date: new Date(Date.now() + 3600000).toISOString().slice(0, 16), // 1 hour ahead
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 5000);
  };

  const loadData = async () => {
    setLoading(true);
    const authHeader = await getAuthHeader();
    if (!authHeader) {
      setLoading(false);
      return;
    }
    try {
      const [logsRes, scheduledRes] = await Promise.all([
        fetch("/api/notifications", { headers: authHeader }),
        fetch("/api/scheduled-notifications", { headers: authHeader }),
      ]);

      if (logsRes.ok) {
        const data = await logsRes.json();
        setLogs(Array.isArray(data) ? data.map((n: any) => mapApiNotification(n)) : []);
      }

      if (scheduledRes.ok) {
        const scheduledData = await scheduledRes.json();
        setScheduledList(Array.isArray(scheduledData) ? scheduledData : []);
      }
    } catch (e) {
      console.error("Failed to load notifications data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleScheduled = async (id: string, currentStatus: boolean) => {
    const authHeader = await getAuthHeader();
    if (!authHeader) return;

    try {
      const res = await fetch(`/api/scheduled-notifications/${id}`, {
        method: "PATCH",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !currentStatus }),
      });
      if (res.ok) {
        setScheduledList((prev) =>
          prev.map((item) => (item.id === id ? { ...item, is_active: !currentStatus } : item))
        );
        showToast(`Schedule ${!currentStatus ? "activated" : "paused"} successfully`);
      } else {
        showToast("Failed to update schedule status");
      }
    } catch (e) {
      showToast("Error updating schedule");
    }
  };

  const handleDeleteScheduled = async (id: string) => {
    if (!confirm("Are you sure you want to delete this scheduled broadcast rule?")) return;
    const authHeader = await getAuthHeader();
    if (!authHeader) return;

    try {
      const res = await fetch(`/api/scheduled-notifications/${id}`, {
        method: "DELETE",
        headers: authHeader,
      });
      if (res.ok) {
        setScheduledList((prev) => prev.filter((item) => item.id !== id));
        showToast("Scheduled broadcast removed");
      } else {
        showToast("Failed to delete scheduled broadcast");
      }
    } catch (e) {
      showToast("Error deleting scheduled broadcast");
    }
  };

  const handleSubmitBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotice.title || !newNotice.message) return;
    setSubmitting(true);

    const authHeader = await getAuthHeader();
    if (!authHeader) {
      showToast("You must be signed in to do that.");
      setSubmitting(false);
      return;
    }

    try {
      if (deliveryMode === "immediate") {
        // Send immediate broadcast
        const res = await fetch("/api/notifications", {
          method: "POST",
          headers: { ...authHeader, "Content-Type": "application/json" },
          body: JSON.stringify({
            title: newNotice.title,
            message: newNotice.message,
            audience: audienceToApi[newNotice.targetAudience] || "all",
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          showToast(err.error || "Failed to send broadcast.");
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
              (push.failed > 0 ? `, ${push.failed} failed.` : ".")
          );
        } else {
          showToast(
            `Broadcast "${newNotice.title}" logged for ${data.notification.recipients_count} recipient(s).`
          );
        }
      } else {
        // Create scheduled broadcast rule
        let chosenTime = newNotice.repeat_time;
        if (newNotice.repeat_preset === "morning") chosenTime = "09:00";
        else if (newNotice.repeat_preset === "night") chosenTime = "20:00";

        const res = await fetch("/api/scheduled-notifications", {
          method: "POST",
          headers: { ...authHeader, "Content-Type": "application/json" },
          body: JSON.stringify({
            title: newNotice.title,
            message: newNotice.message,
            audience: audienceToApi[newNotice.targetAudience] || "all",
            repeat_type: newNotice.repeat_type,
            repeat_time: chosenTime,
            repeat_day: newNotice.repeat_day,
            start_date: newNotice.start_date ? new Date(newNotice.start_date).toISOString() : undefined,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          showToast(err.error || "Failed to schedule broadcast.");
          return;
        }

        const data = await res.json();
        setScheduledList([data.scheduledNotification, ...scheduledList]);
        setShowBroadcastModal(false);
        setActiveTab("scheduled");
        showToast(`Automated campaign "${newNotice.title}" scheduled successfully!`);
      }

      // Reset
      setNewNotice({
        title: "",
        message: "",
        channel: "Broadcast",
        targetAudience: "All Users",
        repeat_type: "daily",
        repeat_preset: "morning",
        repeat_time: "09:00",
        repeat_day: 1,
        start_date: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
      });
    } catch (e: any) {
      showToast(e.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const formatRepeatRule = (item: ScheduledNotificationItem) => {
    if (item.repeat_type === "once") return "One-time scheduled";
    if (item.repeat_type === "daily") {
      return `Daily at ${item.repeat_time || "09:00"}`;
    }
    if (item.repeat_type === "weekly") {
      const dayName = item.repeat_day !== null ? DAYS_OF_WEEK[item.repeat_day] : "Monday";
      return `Weekly on ${dayName}s at ${item.repeat_time || "09:00"}`;
    }
    if (item.repeat_type === "monthly") {
      return `Monthly on day ${item.repeat_day || 1} at ${item.repeat_time || "09:00"}`;
    }
    return item.repeat_type;
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
            Total Push Delivered
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "6px", color: "#16A34A" }}>
            {logs.reduce((sum, l) => sum + l.deliveryCount, 0).toLocaleString("en-IN")} Recipients
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
          <div style={{ fontSize: "0.75rem", color: "#7C3AED", fontWeight: 600, textTransform: "uppercase" }}>
            Active Auto-Repeat Rules
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "6px", color: "#7C3AED" }}>
            {scheduledList.filter((s) => s.is_active).length} Running
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
            Total Automated Campaigns
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "6px", color: "#2563EB" }}>
            {scheduledList.length}
          </div>
        </div>
      </div>

      {/* Header with Tabs and Actions */}
      <div className={styles.header} style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            onClick={() => setActiveTab("history")}
            style={{
              padding: "8px 18px",
              borderRadius: "8px",
              fontWeight: 700,
              fontSize: "0.9rem",
              border: "none",
              cursor: "pointer",
              background: activeTab === "history" ? "#0F172A" : "#F1F5F9",
              color: activeTab === "history" ? "#FFFFFF" : "#475569",
              transition: "all 0.2s",
            }}
          >
            📋 Sent History ({logs.length})
          </button>
          <button
            onClick={() => setActiveTab("scheduled")}
            style={{
              padding: "8px 18px",
              borderRadius: "8px",
              fontWeight: 700,
              fontSize: "0.9rem",
              border: "none",
              cursor: "pointer",
              background: activeTab === "scheduled" ? "#0F172A" : "#F1F5F9",
              color: activeTab === "scheduled" ? "#FFFFFF" : "#475569",
              transition: "all 0.2s",
            }}
          >
            ⏰ Scheduled & Repeating ({scheduledList.length})
          </button>
        </div>

        <div className={styles.headerRight}>
          <button className={styles.addButton} onClick={() => setShowBroadcastModal(true)}>
            📢 Create Broadcast / Auto-Notification
          </button>
        </div>
      </div>

      {/* TAB 1: History Table */}
      {activeTab === "history" && (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Notification Title & Message</th>
                <th className={styles.th}>Channel</th>
                <th className={styles.th}>Audience</th>
                <th className={styles.th}>Sent Timestamp</th>
                <th className={styles.th}>Delivered</th>
                <th className={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "#64748B" }}>
                    No broadcast logs recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
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
                      <strong>{log.deliveryCount} recipients</strong>
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
                            log.status === "Delivered"
                              ? "#DCFCE7"
                              : log.status === "Partial"
                              ? "#FEF3C7"
                              : log.status === "Failed"
                              ? "#FEE2E2"
                              : "#EFF6FF",
                          color:
                            log.status === "Delivered"
                              ? "#15803D"
                              : log.status === "Partial"
                              ? "#B45309"
                              : log.status === "Failed"
                              ? "#B91C1C"
                              : "#2563EB",
                        }}
                      >
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: Scheduled & Repeating Broadcasts Table */}
      {activeTab === "scheduled" && (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Notification Details</th>
                <th className={styles.th}>Recurrence Rule</th>
                <th className={styles.th}>Target Audience</th>
                <th className={styles.th}>Next Run Time</th>
                <th className={styles.th}>Executions</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {scheduledList.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "32px", color: "#64748B" }}>
                    No automated or scheduled notifications set up yet. Click "Create Broadcast" to set one up!
                  </td>
                </tr>
              ) : (
                scheduledList.map((item) => (
                  <tr key={item.id} className={styles.tr}>
                    <td className={styles.td}>
                      <strong>{item.title}</strong>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: 2 }}>
                        {item.body}
                      </div>
                    </td>
                    <td className={styles.td}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 10px",
                          borderRadius: "6px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          background: "#F3E8FF",
                          color: "#7C3AED",
                        }}
                      >
                        🔄 {formatRepeatRule(item)}
                      </span>
                    </td>
                    <td className={styles.td}>
                      <strong style={{ textTransform: "capitalize" }}>{item.audience}</strong>
                    </td>
                    <td className={styles.td}>
                      <div>
                        <strong>{new Date(item.next_send_at).toLocaleDateString()}</strong>
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#64748B" }}>
                        {new Date(item.next_send_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </td>
                    <td className={styles.td}>
                      <strong>{item.send_count} times</strong>
                      {item.last_sent_at && (
                        <div style={{ fontSize: "0.7rem", color: "#64748B" }}>
                          Last: {new Date(item.last_sent_at).toLocaleDateString()}
                        </div>
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
                          background: item.is_active ? "#DCFCE7" : "#F1F5F9",
                          color: item.is_active ? "#15803D" : "#64748B",
                        }}
                      >
                        {item.is_active ? "● Active" : "⏸ Paused"}
                      </span>
                    </td>
                    <td className={styles.td}>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => handleToggleScheduled(item.id, item.is_active)}
                          style={{
                            padding: "4px 10px",
                            borderRadius: "6px",
                            border: "1px solid #CBD5E1",
                            background: item.is_active ? "#FEF3C7" : "#DCFCE7",
                            color: item.is_active ? "#B45309" : "#15803D",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          {item.is_active ? "Pause" : "Resume"}
                        </button>
                        <button
                          onClick={() => handleDeleteScheduled(item.id)}
                          style={{
                            padding: "4px 10px",
                            borderRadius: "6px",
                            border: "1px solid #FCA5A5",
                            background: "#FEE2E2",
                            color: "#DC2626",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Broadcast / Automation Modal */}
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
              maxWidth: "580px",
              maxHeight: "90vh",
              overflowY: "auto",
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
                📢 Create Broadcast & Notification
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

            <form onSubmit={handleSubmitBroadcast} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Delivery Mode Toggle */}
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "6px" }}>
                  Delivery Timing
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setDeliveryMode("immediate")}
                    style={{
                      padding: "10px",
                      borderRadius: "8px",
                      border: deliveryMode === "immediate" ? "2px solid #2563EB" : "1px solid #CBD5E1",
                      background: deliveryMode === "immediate" ? "#EFF6FF" : "#FFFFFF",
                      color: deliveryMode === "immediate" ? "#1D4ED8" : "#475569",
                      fontWeight: 700,
                      cursor: "pointer",
                      textAlign: "center",
                    }}
                  >
                    ⚡ Send Immediately
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryMode("scheduled")}
                    style={{
                      padding: "10px",
                      borderRadius: "8px",
                      border: deliveryMode === "scheduled" ? "2px solid #7C3AED" : "1px solid #CBD5E1",
                      background: deliveryMode === "scheduled" ? "#F5F3FF" : "#FFFFFF",
                      color: deliveryMode === "scheduled" ? "#6D28D9" : "#475569",
                      fontWeight: 700,
                      cursor: "pointer",
                      textAlign: "center",
                    }}
                  >
                    ⏰ Schedule / Repeat
                  </button>
                </div>
              </div>

              {/* Title */}
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

              {/* Audience & Channel */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
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
              </div>

              {/* Message Body */}
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>Message Body</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Enter message text that will appear in user notifications..."
                  value={newNotice.message}
                  onChange={(e) => setNewNotice({ ...newNotice, message: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1", marginTop: "4px", resize: "vertical" }}
                />
              </div>

              {/* Repeat Options (Only if scheduled mode is selected) */}
              {deliveryMode === "scheduled" && (
                <div
                  style={{
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: "12px",
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1E293B" }}>
                    ⚙️ Recurrence & Scheduling Options
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748B" }}>Repeat Frequency</label>
                      <select
                        value={newNotice.repeat_type}
                        onChange={(e) => setNewNotice({ ...newNotice, repeat_type: e.target.value as any })}
                        style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", marginTop: "4px", fontSize: "0.85rem" }}
                      >
                        <option value="daily">Daily (Every Day)</option>
                        <option value="weekly">Weekly (Specific Day)</option>
                        <option value="monthly">Monthly (Specific Date)</option>
                        <option value="once">One-Time (Scheduled)</option>
                      </select>
                    </div>

                    {newNotice.repeat_type === "daily" && (
                      <div>
                        <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748B" }}>Time of Day Preset</label>
                        <select
                          value={newNotice.repeat_preset}
                          onChange={(e) => {
                            const val = e.target.value as any;
                            setNewNotice({
                              ...newNotice,
                              repeat_preset: val,
                              repeat_time: val === "morning" ? "09:00" : val === "night" ? "20:00" : newNotice.repeat_time,
                            });
                          }}
                          style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", marginTop: "4px", fontSize: "0.85rem" }}
                        >
                          <option value="morning">🌅 Daily Morning (09:00 AM)</option>
                          <option value="night">🌙 Daily Night (08:00 PM)</option>
                          <option value="custom">⏱ Custom Time</option>
                        </select>
                      </div>
                    )}

                    {newNotice.repeat_type === "weekly" && (
                      <div>
                        <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748B" }}>Day of Week</label>
                        <select
                          value={newNotice.repeat_day}
                          onChange={(e) => setNewNotice({ ...newNotice, repeat_day: Number(e.target.value) })}
                          style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", marginTop: "4px", fontSize: "0.85rem" }}
                        >
                          {DAYS_OF_WEEK.map((d, idx) => (
                            <option key={d} value={idx}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {newNotice.repeat_type === "monthly" && (
                      <div>
                        <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748B" }}>Day of Month</label>
                        <select
                          value={newNotice.repeat_day}
                          onChange={(e) => setNewNotice({ ...newNotice, repeat_day: Number(e.target.value) })}
                          style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", marginTop: "4px", fontSize: "0.85rem" }}
                        >
                          {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                            <option key={d} value={d}>
                              Day {d} of Month
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {(newNotice.repeat_type !== "daily" || newNotice.repeat_preset === "custom") && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <div>
                        <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748B" }}>Exact Time (HH:MM)</label>
                        <input
                          type="time"
                          value={newNotice.repeat_time}
                          onChange={(e) => setNewNotice({ ...newNotice, repeat_time: e.target.value })}
                          style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", marginTop: "4px", fontSize: "0.85rem" }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748B" }}>Start Date & Time</label>
                        <input
                          type="datetime-local"
                          value={newNotice.start_date}
                          onChange={(e) => setNewNotice({ ...newNotice, start_date: e.target.value })}
                          style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", marginTop: "4px", fontSize: "0.85rem" }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Form Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "8px",
                    border: "1px solid #CBD5E1",
                    background: "#fff",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: "10px 24px",
                    borderRadius: "8px",
                    background: deliveryMode === "immediate" ? "#2563EB" : "#7C3AED",
                    color: "#fff",
                    border: "none",
                    cursor: submitting ? "not-allowed" : "pointer",
                    fontWeight: 700,
                  }}
                >
                  {submitting
                    ? "Processing..."
                    : deliveryMode === "immediate"
                    ? "Dispatch Immediately"
                    : "Save Scheduled Campaign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
