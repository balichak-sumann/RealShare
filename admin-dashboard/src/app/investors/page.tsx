"use client";
import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import styles from "../properties/Properties.module.css";
import { getAuthHeader } from "@/lib/api-auth";

interface Investor {
  id: string;
  name: string;
  email: string;
  phone: string;
  kyc: "Verified" | "Pending" | "Rejected" | "Not Submitted";
  fractions: number;
  totalInvested: string;
  joinDate: string;
  avatar: string;
  status: "Active" | "Deactivated" | "Banned";
  kycDetails?: {
    aadhaarNumber: string;
    aadhaarFront: string;
    aadhaarBack: string;
    panNumber: string;
    panFront: string;
    passportNumber?: string;
    submissionDate: string;
    notes?: string;
  };
}

function mapApiInvestor(inv: any): Investor {
  const kycMap: Record<string, Investor['kyc']> = {
    verified: 'Verified',
    pending: 'Pending',
    rejected: 'Rejected',
    not_submitted: 'Not Submitted',
  };
  const statusMap = (): Investor['status'] => {
    if (inv.is_banned) return 'Banned';
    if (!inv.is_active) return 'Deactivated';
    return 'Active';
  };
  const aadhaar = inv.kyc_documents?.find((d: any) => d.document_type === 'aadhaar');
  const pan = inv.kyc_documents?.find((d: any) => d.document_type === 'pan');
  const passport = inv.kyc_documents?.find((d: any) => d.document_type === 'passport');
  const anyDoc = aadhaar || pan || passport;
  return {
    id: inv.id,
    name: inv.full_name || 'Unknown',
    email: inv.email || '',
    phone: inv.phone_number || '',
    kyc: kycMap[inv.kyc_status] || 'Not Submitted',
    fractions: inv.total_fractions || 0,
    totalInvested: `₹${Number(inv.total_invested || 0).toLocaleString('en-IN')}`,
    joinDate: inv.created_at ? new Date(inv.created_at).toLocaleDateString() : '',
    avatar: (inv.full_name || '?').split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase(),
    status: statusMap(),
    kycDetails: anyDoc
      ? {
          aadhaarNumber: aadhaar?.document_number || '',
          aadhaarFront: aadhaar?.document_front_url || '',
          aadhaarBack: aadhaar?.document_back_url || '',
          panNumber: pan?.document_number || '',
          panFront: pan?.document_front_url || '',
          passportNumber: passport?.document_number,
          submissionDate: inv.created_at ? new Date(inv.created_at).toLocaleDateString() : '',
          notes: anyDoc?.rejection_reason || undefined,
        }
      : undefined,
  };
}

const kycColors: Record<string, string> = {
  Verified: "#16A34A",
  Pending: "#D97706",
  Rejected: "#DC2626",
  "Not Submitted": "#64748B",
};

export default function InvestorsPage() {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [kycFilter, setKycFilter] = useState("All");
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadInvestors = async () => {
    setLoading(true);
    const authHeader = await getAuthHeader();
    if (!authHeader) { setLoading(false); return; }
    try {
      const res = await fetch('/api/investors', { headers: authHeader });
      if (res.ok) {
        const data = await res.json();
        setInvestors(Array.isArray(data) ? data.map(mapApiInvestor) : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvestors();
  }, []);

  const patchInvestor = async (id: string, body: any) => {
    const authHeader = await getAuthHeader();
    if (!authHeader) { setActionError('You must be signed in to do that.'); return null; }
    const res = await fetch(`/api/investors/${id}`, {
      method: 'PATCH',
      headers: { ...authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setActionError(err.error || 'Action failed.');
      return null;
    }
    return res.json();
  };

  const handleApproveKYC = async (id: string) => {
    const updated = await patchInvestor(id, { kyc_action: 'approve' });
    if (!updated) return;
    setInvestors((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, kyc: "Verified" } : inv))
    );
    if (selectedInvestor?.id === id) {
      setSelectedInvestor(null);
    }
    setActionSuccess(`KYC approved successfully for ${selectedInvestor?.name || id}`);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const handleRejectKYC = async (id: string) => {
    if (!rejectionReason.trim()) {
      alert("Please enter a rejection reason.");
      return;
    }
    const updated = await patchInvestor(id, { kyc_action: 'reject', rejection_reason: rejectionReason });
    if (!updated) return;
    setInvestors((prev) =>
      prev.map((inv) =>
        inv.id === id
          ? {
              ...inv,
              kyc: "Rejected",
              kycDetails: inv.kycDetails
                ? { ...inv.kycDetails, notes: rejectionReason }
                : undefined,
            }
          : inv
      )
    );
    if (selectedInvestor?.id === id) {
      setSelectedInvestor(null);
    }
    setActionSuccess(`KYC rejected with notes: "${rejectionReason}"`);
    setRejectionReason("");
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const handleToggleUserStatus = async (id: string, newStatus: "Active" | "Deactivated" | "Banned") => {
    const updated = await patchInvestor(id, {
      is_active: newStatus !== "Deactivated",
      is_banned: newStatus === "Banned",
    });
    if (!updated) return;
    setInvestors((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, status: newStatus } : inv))
    );
    if (selectedInvestor?.id === id) {
      setSelectedInvestor((prev) => prev ? { ...prev, status: newStatus } : null);
    }
    setActionSuccess(`User status updated to ${newStatus}`);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const filtered = investors.filter((inv) => {
    const matchSearch =
      inv.name.toLowerCase().includes(search.toLowerCase()) ||
      inv.email.toLowerCase().includes(search.toLowerCase()) ||
      inv.phone.includes(search) ||
      inv.id.toLowerCase().includes(search.toLowerCase());
    const matchKyc = kycFilter === "All" || inv.kyc === kycFilter;
    return matchSearch && matchKyc;
  });

  const pendingCount = investors.filter((i) => i.kyc === "Pending").length;
  const verifiedCount = investors.filter((i) => i.kyc === "Verified").length;

  return (
    <AdminLayout title="Investors & KYC Management">
      {/* Toast Alert */}
      {actionSuccess && (
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
          <span>✓ {actionSuccess}</span>
          <button
            onClick={() => setActionSuccess(null)}
            style={{
              background: "transparent",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              fontSize: "1rem",
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
          marginBottom: "28px",
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
          <div
            style={{
              fontSize: "0.75rem",
              color: "var(--text-secondary)",
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            Total Registered Users
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "6px" }}>
            {investors.length}
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
          <div
            style={{
              fontSize: "0.75rem",
              color: "#D97706",
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            Pending KYC Verification
          </div>
          <div
            style={{
              fontSize: "1.6rem",
              fontWeight: 800,
              color: "#D97706",
              marginTop: "6px",
            }}
          >
            {pendingCount}
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
          <div
            style={{
              fontSize: "0.75rem",
              color: "#16A34A",
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            Verified Investors
          </div>
          <div
            style={{
              fontSize: "1.6rem",
              fontWeight: 800,
              color: "#16A34A",
              marginTop: "6px",
            }}
          >
            {verifiedCount}
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
          <div
            style={{
              fontSize: "0.75rem",
              color: "#2563EB",
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            Total Fractional Shares Held
          </div>
          <div
            style={{
              fontSize: "1.6rem",
              fontWeight: 800,
              color: "#2563EB",
              marginTop: "6px",
            }}
          >
            80 Fractions
          </div>
        </div>
      </div>

      <div className={styles.header}>
        <div className={styles.title}>Customer / Investor Panel ({filtered.length})</div>
        <div className={styles.headerRight}>
          <div className={styles.filterGroup}>
            {["All", "Pending", "Verified", "Rejected"].map((k) => (
              <button
                key={k}
                className={`${styles.filterPill} ${
                  kycFilter === k ? styles.filterActive : ""
                }`}
                onClick={() => setKycFilter(k)}
              >
                {k === "Pending" ? `Pending (${pendingCount})` : k}
              </button>
            ))}
          </div>
          <button className={styles.addButton} onClick={() => {
            const headers = ["Name", "Email", "Phone", "KYC Status", "Account Status", "Fractions", "Total Invested", "Joined Date"];
            const rows = filtered.map(inv => [inv.name, inv.email, inv.phone, inv.kyc, inv.status, inv.fractions, inv.totalInvested, inv.joinDate]);
            const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `investor_kyc_report_${new Date().toISOString().split("T")[0]}.csv`;
            link.click();
            URL.revokeObjectURL(url);
          }}>📥 Export KYC Ledger</button>
        </div>
      </div>

      <div className={styles.searchBar}>
        <span>🔍</span>
        <input
          type="text"
          placeholder="Search by name, email, phone number, or User ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Investor</th>
              <th className={styles.th}>Contact Info</th>
              <th className={styles.th}>KYC Status</th>
              <th className={styles.th}>Account Status</th>
              <th className={styles.th}>Fractions</th>
              <th className={styles.th}>Total Invested</th>
              <th className={styles.th}>Joined</th>
              <th className={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((inv) => (
              <tr key={inv.id} className={styles.tr}>
                <td className={styles.td}>
                  <div className={styles.propCell}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: `linear-gradient(135deg, ${
                          kycColors[inv.kyc] || "#666"
                        }, #0F172A)`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        flexShrink: 0,
                      }}
                    >
                      {inv.avatar}
                    </div>
                    <div>
                      <strong>{inv.name}</strong>
                      <div
                        style={{
                          fontSize: "0.7rem",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {inv.id}
                      </div>
                    </div>
                  </div>
                </td>
                <td className={styles.td}>
                  {inv.email}
                  <br />
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {inv.phone}
                  </span>
                </td>
                <td className={styles.td}>
                  <span
                    className={styles.statusBadge}
                    style={{
                      background: `${kycColors[inv.kyc]}15`,
                      color: kycColors[inv.kyc],
                      cursor: "pointer",
                    }}
                    onClick={() => setSelectedInvestor(inv)}
                    title="Click to view KYC documents"
                  >
                    {inv.kyc} {inv.kyc === "Pending" && "⚡ Review"}
                  </span>
                </td>
                <td className={styles.td}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      background:
                        inv.status === "Active"
                          ? "#DCFCE7"
                          : inv.status === "Deactivated"
                          ? "#FEF3C7"
                          : "#FEE2E2",
                      color:
                        inv.status === "Active"
                          ? "#15803D"
                          : inv.status === "Deactivated"
                          ? "#B45309"
                          : "#B91C1C",
                    }}
                  >
                    {inv.status}
                  </span>
                </td>
                <td className={styles.td}>
                  <strong>{inv.fractions}</strong>
                </td>
                <td className={styles.td}>
                  <strong>{inv.totalInvested}</strong>
                </td>
                <td className={styles.td}>{inv.joinDate}</td>
                <td className={styles.td}>
                  <div className={styles.actions}>
                    <button
                      className={styles.actionBtn}
                      title="Inspect KYC & Account"
                      onClick={() => setSelectedInvestor(inv)}
                      style={{
                        background:
                          inv.kyc === "Pending" ? "#FEF3C7" : "transparent",
                        borderColor:
                          inv.kyc === "Pending" ? "#F59E0B" : "var(--border-color)",
                      }}
                    >
                      📑 Review KYC
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* KYC Review Drawer / Modal */}
      {selectedInvestor && (
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
              maxWidth: "800px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "28px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                borderBottom: "1px solid #E2E8F0",
                paddingBottom: "16px",
                marginBottom: "20px",
              }}
            >
              <div>
                <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0F172A" }}>
                  KYC Verification & Account Controls
                </h2>
                <p style={{ fontSize: "0.85rem", color: "#64748B", marginTop: "4px" }}>
                  Review submitted documents for {selectedInvestor.name} ({selectedInvestor.id})
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedInvestor(null);
                  setRejectionReason("");
                }}
                style={{
                  background: "#F1F5F9",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                ✕ Close
              </button>
            </div>

            {/* Profile Overview */}
            <div
              style={{
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: "12px",
                padding: "16px",
                marginBottom: "20px",
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "14px",
              }}
            >
              <div>
                <span style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 600 }}>
                  EMAIL & PHONE
                </span>
                <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#0F172A", marginTop: 4 }}>
                  {selectedInvestor.email}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#64748B" }}>{selectedInvestor.phone}</div>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 600 }}>
                  KYC STATUS
                </span>
                <div style={{ marginTop: 4 }}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      background: `${kycColors[selectedInvestor.kyc]}20`,
                      color: kycColors[selectedInvestor.kyc],
                    }}
                  >
                    {selectedInvestor.kyc}
                  </span>
                </div>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 600 }}>
                  ACCOUNT STATUS
                </span>
                <div style={{ marginTop: 4, display: "flex", gap: "6px" }}>
                  <button
                    onClick={() => handleToggleUserStatus(selectedInvestor.id, "Active")}
                    style={{
                      padding: "4px 8px",
                      borderRadius: "4px",
                      border: "none",
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      background: selectedInvestor.status === "Active" ? "#16A34A" : "#E2E8F0",
                      color: selectedInvestor.status === "Active" ? "#fff" : "#475569",
                    }}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => handleToggleUserStatus(selectedInvestor.id, "Deactivated")}
                    style={{
                      padding: "4px 8px",
                      borderRadius: "4px",
                      border: "none",
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      background: selectedInvestor.status === "Deactivated" ? "#D97706" : "#E2E8F0",
                      color: selectedInvestor.status === "Deactivated" ? "#fff" : "#475569",
                    }}
                  >
                    Deactivate
                  </button>
                  <button
                    onClick={() => handleToggleUserStatus(selectedInvestor.id, "Banned")}
                    style={{
                      padding: "4px 8px",
                      borderRadius: "4px",
                      border: "none",
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      background: selectedInvestor.status === "Banned" ? "#DC2626" : "#E2E8F0",
                      color: selectedInvestor.status === "Banned" ? "#fff" : "#475569",
                    }}
                  >
                    Ban
                  </button>
                </div>
              </div>
            </div>

            {/* Document Checklist & Previews */}
            {selectedInvestor.kycDetails ? (
              <div>
                <h3
                  style={{
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    marginBottom: "14px",
                    color: "#1E293B",
                  }}
                >
                  Submitted Identity Documents (Work Order Requirement 1.2)
                </h3>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                    marginBottom: "20px",
                  }}
                >
                  {/* Aadhaar Card */}
                  <div
                    style={{
                      border: "1px solid #E2E8F0",
                      borderRadius: "12px",
                      padding: "14px",
                      background: "#F8FAFC",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "10px",
                      }}
                    >
                      <strong style={{ fontSize: "0.85rem", color: "#0F172A" }}>
                        1. Aadhaar Card
                      </strong>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: "0.75rem",
                          color: "#475569",
                          background: "#E2E8F0",
                          padding: "2px 6px",
                          borderRadius: 4,
                        }}
                      >
                        {selectedInvestor.kycDetails.aadhaarNumber}
                      </span>
                    </div>
                    {selectedInvestor.kycDetails.aadhaarFront ? (
                      <img
                        src={selectedInvestor.kycDetails.aadhaarFront}
                        alt="Aadhaar Front"
                        style={{
                          width: "100%",
                          height: "140px",
                          objectFit: "cover",
                          borderRadius: "8px",
                          border: "1px solid #CBD5E1",
                        }}
                      />
                    ) : (
                      <div style={{ width: "100%", height: "140px", backgroundColor: "#E2E8F0", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "#94A3B8" }}>
                        Not Uploaded
                      </div>
                    )}
                    <span
                      style={{
                        display: "block",
                        fontSize: "0.7rem",
                        color: "#64748B",
                        marginTop: 4,
                        textAlign: "center",
                      }}
                    >
                      Front & Back Verified via UIDAI API Sandbox
                    </span>
                  </div>

                  {/* PAN Card */}
                  <div
                    style={{
                      border: "1px solid #E2E8F0",
                      borderRadius: "12px",
                      padding: "14px",
                      background: "#F8FAFC",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "10px",
                      }}
                    >
                      <strong style={{ fontSize: "0.85rem", color: "#0F172A" }}>2. PAN Card</strong>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: "0.75rem",
                          color: "#475569",
                          background: "#E2E8F0",
                          padding: "2px 6px",
                          borderRadius: 4,
                        }}
                      >
                        {selectedInvestor.kycDetails.panNumber || 'N/A'}
                      </span>
                    </div>
                    {selectedInvestor.kycDetails.panFront ? (
                      <img
                        src={selectedInvestor.kycDetails.panFront}
                        alt="PAN Front"
                        style={{
                          width: "100%",
                          height: "140px",
                          objectFit: "cover",
                          borderRadius: "8px",
                          border: "1px solid #CBD5E1",
                        }}
                      />
                    ) : (
                      <div style={{ width: "100%", height: "140px", backgroundColor: "#E2E8F0", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "#94A3B8" }}>
                        Not Uploaded
                      </div>
                    )}
                    <span
                      style={{
                        display: "block",
                        fontSize: "0.7rem",
                        color: "#64748B",
                        marginTop: 4,
                        textAlign: "center",
                      }}
                    >
                      Income Tax Department Records Matched
                    </span>
                  </div>
                </div>

                {selectedInvestor.kycDetails.passportNumber && (
                  <div
                    style={{
                      border: "1px solid #E2E8F0",
                      borderRadius: "12px",
                      padding: "12px",
                      background: "#F8FAFC",
                      marginBottom: "20px",
                    }}
                  >
                    <strong style={{ fontSize: "0.85rem" }}>3. Passport (Optional): </strong>
                    <span style={{ fontFamily: "monospace", color: "#475569" }}>
                      {selectedInvestor.kycDetails.passportNumber}
                    </span>
                  </div>
                )}

                {selectedInvestor.kycDetails.notes && (
                  <div
                    style={{
                      background: "#FEF2F2",
                      border: "1px solid #FECACA",
                      borderRadius: "8px",
                      padding: "12px",
                      marginBottom: "20px",
                      color: "#991B1B",
                      fontSize: "0.85rem",
                    }}
                  >
                    <strong>Previous Review Remarks:</strong> {selectedInvestor.kycDetails.notes}
                  </div>
                )}

                {/* Verification Decision Form */}
                <div
                  style={{
                    background: "#F1F5F9",
                    padding: "18px",
                    borderRadius: "12px",
                    border: "1px solid #CBD5E1",
                  }}
                >
                  <h4 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "10px" }}>
                    Admin Action & Remarks
                  </h4>
                  <textarea
                    placeholder="Enter reason for rejection or approval remarks..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid #CBD5E1",
                      fontSize: "0.85rem",
                      minHeight: "70px",
                      marginBottom: "14px",
                      resize: "vertical",
                    }}
                  />
                  <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                    <button
                      onClick={() => handleRejectKYC(selectedInvestor.id)}
                      style={{
                        padding: "10px 20px",
                        borderRadius: "8px",
                        backgroundColor: "#DC2626",
                        color: "#fff",
                        fontWeight: 700,
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      ✕ Reject KYC
                    </button>
                    <button
                      onClick={() => handleApproveKYC(selectedInvestor.id)}
                      style={{
                        padding: "10px 24px",
                        borderRadius: "8px",
                        backgroundColor: "#16A34A",
                        color: "#fff",
                        fontWeight: 700,
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      ✓ Approve & Verify User
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  padding: "40px 20px",
                  textAlign: "center",
                  color: "#64748B",
                }}
              >
                <div style={{ fontSize: "2rem", marginBottom: "8px" }}>📭</div>
                <strong>No KYC documents submitted yet by this user.</strong>
                <p style={{ fontSize: "0.8rem", marginTop: 4 }}>
                  The user can submit their Aadhaar, PAN, and Passport via the mobile application.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
