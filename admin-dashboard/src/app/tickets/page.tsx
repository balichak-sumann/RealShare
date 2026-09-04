"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { useAuth } from "@/contexts/AuthContext";
import { getAuthHeader } from "@/lib/api-auth";
import { getSocket } from "@/lib/socket";
import styles from "./Tickets.module.css";

interface Ticket {
  id: string;
  user_id: string;
  ticket_number: string;
  category: string;
  subject: string;
  description: string;
  priority: "low" | "medium" | "high";
  status: "open" | "in_progress" | "resolved" | "closed";
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

interface ConversationSummary {
  id: string;
  type: string;
  context_label: string | null;
  updated_at: string;
  last_message: { body: string; created_at: string; sender_id: string } | null;
  unread: boolean;
  staff_unclaimed: boolean;
}

interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  sender: { full_name: string; role: string };
}

interface Employee {
  id: string;
  full_name: string;
}

const STATUS_FILTERS = ["All", "open", "in_progress", "resolved", "closed"] as const;
const STATUS_OPTIONS = ["open", "in_progress", "resolved", "closed"] as const;
// Background fallback poll for the currently-open thread. Socket.io
// delivers new messages instantly and its own reconnect logic covers a
// normal drop; this just guards against the rare case of a socket that
// silently stalls without firing a disconnect event.
const SAFETY_POLL_MS = 45000;

function statusBadgeClass(status: string): string {
  const key = `badge${status.charAt(0).toUpperCase()}${status.slice(1)}`;
  return (styles as Record<string, string>)[key] || styles.badge;
}

function priorityBadgeClass(priority: string): string {
  const key = `badge${priority.charAt(0).toUpperCase()}${priority.slice(1)}`;
  return (styles as Record<string, string>)[key] || styles.badge;
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const diffMs = Date.now() - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function TicketsPage() {
  const { user } = useAuth();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [supportConvos, setSupportConvos] = useState<ConversationSummary[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>("All");
  const [search, setSearch] = useState("");

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Optimistic local read-state so the unread dot clears immediately on
  // selection instead of waiting for a full list refetch.
  const [locallyRead, setLocallyRead] = useState<Set<string>>(new Set());

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const threadEndRef = useRef<HTMLDivElement | null>(null);
  // Mirrors conversationId for socket-event handlers registered once on
  // mount (see the socket useEffect below) -- they close over this ref
  // instead of the state value so they always see the latest open thread
  // without needing to re-subscribe every time it changes.
  const conversationIdRef = useRef<string | null>(null);

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 4000);
  };

  const loadList = useCallback(async () => {
    setLoadingList(true);
    const authHeader = await getAuthHeader();
    if (!authHeader) { setLoadingList(false); return; }
    try {
      const [ticketsRes, convosRes, employeesRes] = await Promise.all([
        fetch("/api/tickets", { headers: authHeader }),
        fetch("/api/conversations", { headers: authHeader }),
        fetch("/api/admin/employees", { headers: authHeader }),
      ]);
      if (ticketsRes.ok) {
        const data = await ticketsRes.json();
        setTickets(Array.isArray(data.tickets) ? data.tickets : []);
      }
      if (convosRes.ok) {
        const data = await convosRes.json();
        setSupportConvos(Array.isArray(data) ? data.filter((c: ConversationSummary) => c.type === "support") : []);
      }
      // /api/admin/employees is admin-only -- an employee-role caller gets a
      // 403 here, which we just treat as "no roster available" rather than
      // an error; the assignment control still offers "Assign to me".
      if (employeesRes.ok) {
        const data = await employeesRes.json();
        setEmployees(Array.isArray(data.employees) ? data.employees : []);
      }
    } catch (e) {
      console.error(e);
      showError("Failed to load tickets.");
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    loadList();
  }, [user, loadList]);

  // Map ticket_number -> the support conversation summary for it (there's
  // exactly one support conversation per ticket, keyed by context_label).
  const convoByTicketNumber = new Map<string, ConversationSummary>();
  for (const c of supportConvos) {
    if (c.context_label) convoByTicketNumber.set(c.context_label, c);
  }

  const fetchMessages = useCallback(async (convId: string) => {
    const authHeader = await getAuthHeader();
    if (!authHeader) return;
    try {
      const res = await fetch(`/api/conversations/${convId}/messages`, { headers: authHeader });
      if (res.ok) {
        const data = await res.json();
        setMessages(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const openTicket = useCallback(async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setMessages([]);
    setConversationId(null);
    setThreadLoading(true);
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }

    const authHeader = await getAuthHeader();
    if (!authHeader) { setThreadLoading(false); return; }

    try {
      const createRes = await fetch("/api/conversations", {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ type: "support", ticket_id: ticket.id }),
      });
      if (!createRes.ok) {
        showError("Could not open this ticket's conversation.");
        setThreadLoading(false);
        return;
      }
      const { id: convId } = await createRes.json();
      setConversationId(convId);

      await fetchMessages(convId);

      fetch(`/api/conversations/${convId}/read`, { method: "PATCH", headers: authHeader }).catch(() => {});
      setLocallyRead((prev) => new Set(prev).add(ticket.ticket_number));

      pollRef.current = setInterval(() => fetchMessages(convId), SAFETY_POLL_MS);
    } catch (e) {
      console.error(e);
      showError("Failed to load ticket conversation.");
    } finally {
      setThreadLoading(false);
    }
  }, [fetchMessages]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  // Live delivery: registered once on mount (not per-thread) on the shared
  // socket singleton. A message for the open thread is appended directly;
  // a message for any other conversation triggers a list refetch so its
  // preview/unread dot update live even though it is not open. `connect`
  // fires on the initial connect AND every reconnect, so it doubles as a
  // catch-up for anything missed while disconnected.
  useEffect(() => {
    if (!user) return;
    const socket = getSocket();

    const handleNewMessage = (event: { conversation_id: string; message: MessageRow }) => {
      if (conversationIdRef.current && event.conversation_id === conversationIdRef.current) {
        setMessages((prev) => [...prev, event.message]);
      } else {
        loadList();
      }
    };

    const handleConnect = () => {
      loadList();
      if (conversationIdRef.current) fetchMessages(conversationIdRef.current);
    };

    socket.on("new_message", handleNewMessage);
    socket.on("connect", handleConnect);

    return () => {
      // Listeners only -- this is a shared singleton connection that other
      // pages may still be using, so we do not socket.disconnect() here.
      socket.off("new_message", handleNewMessage);
      socket.off("connect", handleConnect);
    };
  }, [user, loadList, fetchMessages]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = replyText.trim();
    if (!text || !conversationId || sending) return;
    setSending(true);
    const authHeader = await getAuthHeader();
    if (!authHeader) { setSending(false); return; }
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      if (!res.ok) {
        showError("Failed to send reply.");
        return;
      }
      setReplyText("");
      await fetchMessages(conversationId);
    } catch (e) {
      console.error(e);
      showError("Failed to send reply.");
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!selectedTicket) return;
    const authHeader = await getAuthHeader();
    if (!authHeader) return;
    const res = await fetch(`/api/tickets/${selectedTicket.id}`, {
      method: "PATCH",
      headers: { ...authHeader, "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) { showError("Failed to update status."); return; }
    const updated = { ...selectedTicket, status: status as Ticket["status"] };
    setSelectedTicket(updated);
    setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  const handleAssignChange = async (assignedTo: string) => {
    if (!selectedTicket) return;
    const authHeader = await getAuthHeader();
    if (!authHeader) return;
    const res = await fetch(`/api/tickets/${selectedTicket.id}`, {
      method: "PATCH",
      headers: { ...authHeader, "Content-Type": "application/json" },
      body: JSON.stringify({ assigned_to: assignedTo || null }),
    });
    if (!res.ok) { showError("Failed to update assignment."); return; }
    const updated = { ...selectedTicket, assigned_to: assignedTo || null };
    setSelectedTicket(updated);
    setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  const employeeName = (id: string | null) => {
    if (!id) return "Unassigned";
    if (id === user?.uid) return "You";
    return employees.find((e) => e.id === id)?.full_name || id;
  };

  const filteredTickets = tickets
    .filter((t) => statusFilter === "All" || t.status === statusFilter)
    .filter((t) => {
      const q = search.toLowerCase();
      if (!q) return true;
      return (
        t.subject.toLowerCase().includes(q) ||
        t.ticket_number.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  return (
    <AdminLayout title="Support Tickets">
      {errorMsg && (
        <div className={styles.toast}>
          <span>⚠️ {errorMsg}</span>
          <button className={styles.toastClose} onClick={() => setErrorMsg(null)}>✕</button>
        </div>
      )}

      <div className={styles.page}>
        {/* ---- List panel ---- */}
        <div className={styles.listPanel}>
          <div className={styles.listHeader}>
            <div className={styles.listTitle}>Tickets ({filteredTickets.length})</div>
            <div className={styles.filterRow}>
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s}
                  className={`${styles.filterPill} ${statusFilter === s ? styles.filterActive : ""}`}
                  onClick={() => setStatusFilter(s)}
                >
                  {s === "All" ? "All" : s.replace("_", " ")}
                </button>
              ))}
            </div>
            <div className={styles.searchBox}>
              <span>🔍</span>
              <input
                type="text"
                placeholder="Search subject, ticket #, category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.list}>
            {loadingList && <div className={styles.emptyList}>Loading tickets...</div>}
            {!loadingList && filteredTickets.length === 0 && (
              <div className={styles.emptyList}>No tickets match this filter.</div>
            )}
            {filteredTickets.map((t) => {
              const convo = convoByTicketNumber.get(t.ticket_number);
              const isUnread = !!convo?.unread && !locallyRead.has(t.ticket_number);
              return (
                <button
                  key={t.id}
                  className={`${styles.listItem} ${selectedTicket?.id === t.id ? styles.listItemActive : ""}`}
                  onClick={() => openTicket(t)}
                >
                  <div className={styles.itemTop}>
                    <span className={styles.itemTitle}>{t.subject}</span>
                    {isUnread && <span className={styles.unreadDot} title="Unread reply" />}
                  </div>
                  <div className={styles.itemMeta}>
                    <span className={statusBadgeClass(t.status)}>{t.status.replace("_", " ")}</span>
                    <span className={priorityBadgeClass(t.priority)}>{t.priority}</span>
                    <span>{t.ticket_number}</span>
                  </div>
                  <div className={styles.itemMeta}>
                    <span className={styles.itemPreview}>
                      {convo?.last_message?.body || t.description}
                    </span>
                    <span className={styles.itemTime}>{formatRelative(t.updated_at)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ---- Detail / thread panel ---- */}
        <div className={styles.detailPanel}>
          {!selectedTicket && (
            <div className={styles.emptyState}>Select a ticket to view the conversation.</div>
          )}

          {selectedTicket && (
            <>
              <div className={styles.detailHeader}>
                <div className={styles.detailTitleRow}>
                  <div>
                    <div className={styles.detailTitle}>{selectedTicket.subject}</div>
                    <div className={styles.detailSubtitle}>{selectedTicket.description}</div>
                  </div>
                  <span className={statusBadgeClass(selectedTicket.status)}>
                    {selectedTicket.status.replace("_", " ")}
                  </span>
                </div>
                <div className={styles.detailMeta}>
                  <span>#{selectedTicket.ticket_number}</span>
                  <span>Category: {selectedTicket.category}</span>
                  <span className={priorityBadgeClass(selectedTicket.priority)}>
                    {selectedTicket.priority} priority
                  </span>
                  <span>Assigned: {employeeName(selectedTicket.assigned_to)}</span>
                </div>
                <div className={styles.controlsRow}>
                  <span className={styles.controlLabel}>Status</span>
                  <select
                    className={styles.select}
                    value={selectedTicket.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s.replace("_", " ")}</option>
                    ))}
                  </select>

                  <span className={styles.controlLabel}>Assign</span>
                  <select
                    className={styles.select}
                    value={selectedTicket.assigned_to || ""}
                    onChange={(e) => handleAssignChange(e.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {user?.uid && (
                      <option value={user.uid}>Assign to me</option>
                    )}
                    {employees
                      .filter((e) => e.id !== user?.uid)
                      .map((e) => (
                        <option key={e.id} value={e.id}>{e.full_name}</option>
                      ))}
                    {selectedTicket.assigned_to &&
                      selectedTicket.assigned_to !== user?.uid &&
                      !employees.some((e) => e.id === selectedTicket.assigned_to) && (
                        <option value={selectedTicket.assigned_to}>
                          {employeeName(selectedTicket.assigned_to)}
                        </option>
                      )}
                  </select>
                </div>
              </div>

              <div className={styles.thread}>
                {threadLoading && <div className={styles.emptyState}>Loading conversation...</div>}
                {!threadLoading && messages.length === 0 && (
                  <div className={styles.emptyState}>No messages yet. Send the first reply below.</div>
                )}
                {!threadLoading && messages.map((m) => {
                  const mine = m.sender_id === user?.uid;
                  return (
                    <div key={m.id} className={`${styles.bubbleRow} ${mine ? styles.bubbleRowMine : ""}`}>
                      <div className={styles.bubbleSender}>
                        {mine ? "You" : `${m.sender?.full_name || "User"}${m.sender?.role ? ` (${m.sender.role})` : ""}`}
                      </div>
                      <div className={`${styles.bubble} ${mine ? styles.bubbleMine : ""}`}>{m.body}</div>
                      <div className={styles.bubbleTime}>{formatRelative(m.created_at)}</div>
                    </div>
                  );
                })}
                <div ref={threadEndRef} />
              </div>

              <div className={styles.replyBar}>
                <textarea
                  className={styles.replyInput}
                  rows={1}
                  placeholder="Type a reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <button className={styles.sendBtn} onClick={handleSend} disabled={sending || !replyText.trim()}>
                  {sending ? "Sending..." : "Send"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
