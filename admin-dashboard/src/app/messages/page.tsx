"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { useAuth } from "@/contexts/AuthContext";
import { getAuthHeader } from "@/lib/api-auth";
import { getSocket } from "@/lib/socket";
import styles from "../tickets/Tickets.module.css";
import typeStyles from "./Messages.module.css";

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

const TYPE_LABELS: Record<string, string> = {
  advisor: "Advisor",
  property_inquiry: "Property Inquiry",
};

const TYPE_CLASSES: Record<string, string> = {
  advisor: typeStyles.typeAdvisor,
  property_inquiry: typeStyles.typePropertyInquiry,
};

// Background fallback poll for the currently-open thread. Socket.io
// delivers new messages instantly and its own reconnect logic covers a
// normal drop; this just guards against the rare case of a socket that
// silently stalls without firing a disconnect event.
const SAFETY_POLL_MS = 45000;

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

export default function MessagesPage() {
  const { user } = useAuth();

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [search, setSearch] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [selected, setSelected] = useState<ConversationSummary | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  const [locallyRead, setLocallyRead] = useState<Set<string>>(new Set());

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const threadEndRef = useRef<HTMLDivElement | null>(null);
  // Mirrors selected.id for socket-event handlers registered once on
  // mount (see the socket useEffect below) -- they close over this ref
  // instead of the state value so they always see the latest open thread
  // without needing to re-subscribe every time it changes.
  const selectedIdRef = useRef<string | null>(null);

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 4000);
  };

  const loadList = useCallback(async () => {
    setLoadingList(true);
    const authHeader = await getAuthHeader();
    if (!authHeader) { setLoadingList(false); return; }
    try {
      const res = await fetch("/api/conversations", { headers: authHeader });
      if (res.ok) {
        const data = await res.json();
        const nonSupport = Array.isArray(data) ? data.filter((c: ConversationSummary) => c.type !== "support") : [];
        setConversations(nonSupport);
      }
    } catch (e) {
      console.error(e);
      showError("Failed to load conversations.");
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    loadList();
  }, [user, loadList]);

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

  const openConversation = useCallback(async (conv: ConversationSummary) => {
    setSelected(conv);
    setMessages([]);
    setThreadLoading(true);
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }

    const authHeader = await getAuthHeader();
    if (!authHeader) { setThreadLoading(false); return; }

    try {
      await fetchMessages(conv.id);
      fetch(`/api/conversations/${conv.id}/read`, { method: "PATCH", headers: authHeader }).catch(() => {});
      setLocallyRead((prev) => new Set(prev).add(conv.id));
      pollRef.current = setInterval(() => fetchMessages(conv.id), SAFETY_POLL_MS);
    } catch (e) {
      console.error(e);
      showError("Failed to load conversation.");
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
    selectedIdRef.current = selected?.id ?? null;
  }, [selected]);

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
      if (selectedIdRef.current && event.conversation_id === selectedIdRef.current) {
        setMessages((prev) => [...prev, event.message]);
      } else {
        loadList();
      }
    };

    const handleConnect = () => {
      loadList();
      if (selectedIdRef.current) fetchMessages(selectedIdRef.current);
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
    if (!text || !selected || sending) return;
    setSending(true);
    const authHeader = await getAuthHeader();
    if (!authHeader) { setSending(false); return; }
    try {
      const res = await fetch(`/api/conversations/${selected.id}/messages`, {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      if (!res.ok) {
        showError("Failed to send message.");
        return;
      }
      setReplyText("");
      await fetchMessages(selected.id);
    } catch (e) {
      console.error(e);
      showError("Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const filtered = conversations
    .filter((c) => {
      const q = search.toLowerCase();
      if (!q) return true;
      return (c.context_label || "").toLowerCase().includes(q) || (c.last_message?.body || "").toLowerCase().includes(q);
    });

  return (
    <AdminLayout title="Messages">
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
            <div className={styles.listTitle}>Conversations ({filtered.length})</div>
            <div className={styles.searchBox}>
              <span>🔍</span>
              <input
                type="text"
                placeholder="Search conversations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.list}>
            {loadingList && <div className={styles.emptyList}>Loading conversations...</div>}
            {!loadingList && filtered.length === 0 && (
              <div className={styles.emptyList}>No conversations yet.</div>
            )}
            {filtered.map((c) => {
              const isUnread = c.unread && !locallyRead.has(c.id);
              return (
                <button
                  key={c.id}
                  className={`${styles.listItem} ${selected?.id === c.id ? styles.listItemActive : ""}`}
                  onClick={() => openConversation(c)}
                >
                  <div className={styles.itemTop}>
                    <span className={styles.itemTitle}>{c.context_label || "Conversation"}</span>
                    {isUnread && <span className={styles.unreadDot} title="Unread" />}
                  </div>
                  <div className={styles.itemMeta}>
                    <span className={`${typeStyles.typeBadge} ${TYPE_CLASSES[c.type] || ""}`}>
                      {TYPE_LABELS[c.type] || c.type}
                    </span>
                    {c.staff_unclaimed && (
                      <span className={styles.unclaimedBadge} title="Not yet picked up by staff">Unclaimed</span>
                    )}
                  </div>
                  <div className={styles.itemMeta}>
                    <span className={styles.itemPreview}>{c.last_message?.body || "No messages yet"}</span>
                    <span className={styles.itemTime}>{formatRelative(c.updated_at)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ---- Thread panel ---- */}
        <div className={styles.detailPanel}>
          {!selected && (
            <div className={styles.emptyState}>Select a conversation to view messages.</div>
          )}

          {selected && (
            <>
              <div className={styles.detailHeader}>
                <div className={styles.detailTitleRow}>
                  <div className={styles.detailTitle}>{selected.context_label || "Conversation"}</div>
                  <span className={`${typeStyles.typeBadge} ${TYPE_CLASSES[selected.type] || ""}`}>
                    {TYPE_LABELS[selected.type] || selected.type}
                  </span>
                  {selected.staff_unclaimed && (
                    <span className={styles.unclaimedBadge} title="Not yet picked up by staff">Unclaimed &mdash; reply to pick up</span>
                  )}
                </div>
              </div>

              <div className={styles.thread}>
                {threadLoading && <div className={styles.emptyState}>Loading conversation...</div>}
                {!threadLoading && messages.length === 0 && (
                  <div className={styles.emptyState}>No messages yet. Send the first message below.</div>
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
                  placeholder="Type a message..."
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
