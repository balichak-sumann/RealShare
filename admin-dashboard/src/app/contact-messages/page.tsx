"use client";
import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { getAuthHeader } from "@/lib/api-auth";
import styles from "../properties/Properties.module.css";

interface ContactMessage {
  id: string;
  contact_type: string;
  full_name: string;
  email: string;
  phone: string;
  location: string | null;
  message: string | null;
  status: string;
  created_at: string;
}

export default function ContactMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("Buyer"); // Buyer, Seller, Agent or Broker

  const loadMessages = async () => {
    setLoading(true);
    try {
      const authHeader = await getAuthHeader();
      const res = await fetch("/api/forms/contact", { headers: authHeader || {} });
      if (res.ok) {
        const data = await res.json();
        setMessages(Array.isArray(data) ? data : []);
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.error("Failed to load contact messages:", err);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const filteredMessages = messages.filter((m) => m.contact_type === activeTab);

  return (
    <AdminLayout title="Contact Messages">
      <div className={styles.header}>
        <div>
          <div className={styles.title}>Contact Messages</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', padding: '0 24px' }}>
        {["Buyer", "Seller", "Agent or Broker"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: 'none',
              background: activeTab === tab ? '#2563EB' : '#E2E8F0',
              color: activeTab === tab ? '#FFF' : '#475569',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Name</th>
              <th className={styles.th}>Contact Info</th>
              <th className={styles.th}>Location</th>
              <th className={styles.th}>Message</th>
              <th className={styles.th}>Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className={styles.td} colSpan={5}>Loading messages...</td>
              </tr>
            ) : filteredMessages.length === 0 ? (
              <tr>
                <td className={styles.td} colSpan={5}>No {activeTab} messages found.</td>
              </tr>
            ) : (
              filteredMessages.map((msg) => (
                <tr key={msg.id} className={styles.tr}>
                  <td className={styles.td}>
                    <strong>{msg.full_name}</strong>
                  </td>
                  <td className={styles.td}>
                    <div style={{ fontSize: "0.8rem", color: "#475569" }}>{msg.email}</div>
                    <div style={{ fontSize: "0.8rem", color: "#475569" }}>{msg.phone}</div>
                  </td>
                  <td className={styles.td}>
                    {msg.location || "—"}
                  </td>
                  <td className={styles.td}>
                    <div style={{ fontSize: "0.8rem", color: "#64748B", maxWidth: "300px" }}>{msg.message || "—"}</div>
                  </td>
                  <td className={styles.td}>
                    {new Date(msg.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
