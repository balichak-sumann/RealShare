"use client";
import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import styles from "../properties/Properties.module.css";
import { getAuthHeader } from "@/lib/api-auth";

interface ServiceInquiry {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  serviceType: "Home Loan" | "Interior Works" | "Insurance (Home)" | "Insurance (Auto/Health)" | "Property Management";
  propertyReference?: string;
  estimatedBudget: string;
  assignedTo: string;
  status: "New" | "In Review" | "Assigned" | "Completed" | "Cancelled";
  date: string;
  notes?: string;
}

function mapApiInquiry(s: any): ServiceInquiry {
  return {
    id: s.id,
    customerName: s.customer_name,
    phone: s.phone || '',
    email: s.email || '',
    serviceType: s.service_type,
    propertyReference: s.property_reference || undefined,
    estimatedBudget: s.estimated_budget || '',
    assignedTo: s.assigned_to || 'Unassigned',
    status: s.status,
    date: new Date(s.created_at).toLocaleDateString(),
    notes: s.notes || undefined,
  };
}

const serviceTypeColors: Record<string, string> = {
  'Home Loan': '#2563EB',
  'Interior Works': '#7C3AED',
  'Insurance (Home)': '#059669',
  'Insurance (Auto/Health)': '#D97706',
  'Property Management': '#DC2626',
};

export default function AdditionalServicesPage() {
  const [inquiries, setInquiries] = useState<ServiceInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const authHeader = await getAuthHeader();
      if (!authHeader) { setLoading(false); return; }
      try {
        const res = await fetch('/api/services', { headers: authHeader });
        if (res.ok) {
          const data = await res.json();
          setInquiries(Array.isArray(data) ? data.map(mapApiInquiry) : []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: ServiceInquiry["status"]) => {
    const authHeader = await getAuthHeader();
    if (!authHeader) { showToast("You must be signed in to do that."); return; }
    const res = await fetch(`/api/services/${id}`, {
      method: 'PATCH',
      headers: { ...authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) { showToast("Failed to update status."); return; }
    setInquiries((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
    );
    showToast(`Service inquiry ${id} status changed to ${newStatus}`);
  };

  const filtered = inquiries.filter((inq) => {
    const matchType = typeFilter === "All" || inq.serviceType === typeFilter;
    const matchSearch =
      inq.customerName.toLowerCase().includes(search.toLowerCase()) ||
      inq.email.toLowerCase().includes(search.toLowerCase()) ||
      inq.serviceType.toLowerCase().includes(search.toLowerCase()) ||
      inq.id.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <AdminLayout title="Additional Services Management">
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

      {/* Services Breakdown Cards */}
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
          <div style={{ fontSize: "0.75rem", color: "#2563EB", fontWeight: 700, textTransform: "uppercase" }}>
            🏦 Home Loans
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "6px" }}>
            {inquiries.filter((i) => i.serviceType === "Home Loan").length} Leads
          </div>
          <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: 4 }}>
            Partnered with HDFC, SBI & ICICI
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
          <div style={{ fontSize: "0.75rem", color: "#7C3AED", fontWeight: 700, textTransform: "uppercase" }}>
            🛋️ Interior Works
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "6px" }}>
            {inquiries.filter((i) => i.serviceType === "Interior Works").length} Requests
          </div>
          <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: 4 }}>
            Modular, Turnkey & Luxury Fitouts
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
          <div style={{ fontSize: "0.75rem", color: "#059669", fontWeight: 700, textTransform: "uppercase" }}>
            🛡️ Insurance (Home/Auto/Health)
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "6px" }}>
            {inquiries.filter((i) => i.serviceType.includes("Insurance")).length} Policies
          </div>
          <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: 4 }}>
            Comprehensive Coverage Tie-ups
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
          <div style={{ fontSize: "0.75rem", color: "#D97706", fontWeight: 700, textTransform: "uppercase" }}>
            🔑 Property Management
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "6px" }}>
            {inquiries.filter((i) => i.serviceType === "Property Management").length} Contracts
          </div>
          <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: 4 }}>
            Tenant onboarding & rental servicing
          </div>
        </div>
      </div>

      {/* Header controls */}
      <div className={styles.header}>
        <div className={styles.title}>All Value-Added Service Inquiries ({filtered.length})</div>
        <div className={styles.headerRight}>
          <div className={styles.filterGroup}>
            {["All", "Home Loan", "Interior Works", "Insurance (Home)", "Property Management"].map((t) => (
              <button
                key={t}
                className={`${styles.filterPill} ${typeFilter === t ? styles.filterActive : ""}`}
                onClick={() => setTypeFilter(t)}
              >
                {t}
              </button>
            ))}
          </div>
          <button className={styles.addButton}>📥 Export Leads</button>
        </div>
      </div>

      <div className={styles.searchBar}>
        <span>🔍</span>
        <input
          type="text"
          placeholder="Search by customer name, email, service type, or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Inquiry ID</th>
              <th className={styles.th}>Customer Contact</th>
              <th className={styles.th}>Service Type</th>
              <th className={styles.th}>Property Reference</th>
              <th className={styles.th}>Budget / Value</th>
              <th className={styles.th}>Assigned Team Member</th>
              <th className={styles.th}>Status</th>
              <th className={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((inq) => (
              <tr key={inq.id} className={styles.tr}>
                <td className={styles.td}>
                  <strong style={{ fontFamily: "monospace" }}>{inq.id}</strong>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>{inq.date}</div>
                </td>
                <td className={styles.td}>
                  <strong>{inq.customerName}</strong>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                    {inq.email} • {inq.phone}
                  </div>
                </td>
                <td className={styles.td}>
                  <span
                    className={styles.badge}
                    style={{
                      background: `${serviceTypeColors[inq.serviceType] || "#666"}15`,
                      color: serviceTypeColors[inq.serviceType] || "#666",
                      fontWeight: 700,
                    }}
                  >
                    {inq.serviceType}
                  </span>
                </td>
                <td className={styles.td}>
                  <strong>{inq.propertyReference || "General Inquiry"}</strong>
                  {inq.notes && (
                    <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: 2 }}>
                      {inq.notes}
                    </div>
                  )}
                </td>
                <td className={styles.td}>
                  <strong>{inq.estimatedBudget}</strong>
                </td>
                <td className={styles.td}>
                  <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#334155" }}>
                    {inq.assignedTo}
                  </span>
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
                        inq.status === "Completed"
                          ? "#DCFCE7"
                          : inq.status === "In Review" || inq.status === "Assigned"
                          ? "#EFF6FF"
                          : inq.status === "New"
                          ? "#FEF3C7"
                          : "#FEE2E2",
                      color:
                        inq.status === "Completed"
                          ? "#15803D"
                          : inq.status === "In Review" || inq.status === "Assigned"
                          ? "#2563EB"
                          : inq.status === "New"
                          ? "#B45309"
                          : "#B91C1C",
                    }}
                  >
                    {inq.status}
                  </span>
                </td>
                <td className={styles.td}>
                  <select
                    value={inq.status}
                    onChange={(e) => handleUpdateStatus(inq.id, e.target.value as any)}
                    style={{
                      padding: "4px 8px",
                      borderRadius: "6px",
                      border: "1px solid #CBD5E1",
                      fontSize: "0.75rem",
                      background: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    <option value="New">New</option>
                    <option value="In Review">In Review</option>
                    <option value="Assigned">Assigned</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
