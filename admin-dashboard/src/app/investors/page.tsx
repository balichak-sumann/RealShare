"use client";
import React, { useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import styles from "../properties/Properties.module.css";

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

const initialInvestors: Investor[] = [
  {
    id: "INV-001",
    name: "Arjun Kumar",
    email: "arjun.k@gmail.com",
    phone: "+91 98765 43210",
    kyc: "Verified",
    fractions: 14,
    totalInvested: "₹20,00,000",
    joinDate: "12 Jan 2026",
    avatar: "AK",
    status: "Active",
    kycDetails: {
      aadhaarNumber: "7890 1234 5678",
      aadhaarFront: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=250&fit=crop",
      aadhaarBack: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=250&fit=crop",
      panNumber: "ABCDE1234F",
      panFront: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=250&fit=crop",
      passportNumber: "Z9876543",
      submissionDate: "12 Jan 2026",
    },
  },
  {
    id: "INV-002",
    name: "Priya Sharma",
    email: "priya.s@outlook.com",
    phone: "+91 87654 32109",
    kyc: "Pending",
    fractions: 4,
    totalInvested: "₹2,00,000",
    joinDate: "15 Mar 2026",
    avatar: "PS",
    status: "Active",
    kycDetails: {
      aadhaarNumber: "4567 8901 2345",
      aadhaarFront: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&h=250&fit=crop",
      aadhaarBack: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&h=250&fit=crop",
      panNumber: "PQRS5678K",
      panFront: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&h=250&fit=crop",
      passportNumber: "P1234567",
      submissionDate: "18 Aug 2026",
    },
  },
  {
    id: "INV-003",
    name: "Rahul Mehta",
    email: "rahul.m@yahoo.com",
    phone: "+91 76543 21098",
    kyc: "Verified",
    fractions: 22,
    totalInvested: "₹35,00,000",
    joinDate: "02 Feb 2026",
    avatar: "RM",
    status: "Active",
  },
  {
    id: "INV-004",
    name: "Anjali Desai",
    email: "anjali.d@gmail.com",
    phone: "+91 65432 10987",
    kyc: "Pending",
    fractions: 8,
    totalInvested: "₹12,00,000",
    joinDate: "20 Apr 2026",
    avatar: "AD",
    status: "Active",
    kycDetails: {
      aadhaarNumber: "1234 5678 9012",
      aadhaarFront: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&h=250&fit=crop",
      aadhaarBack: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&h=250&fit=crop",
      panNumber: "XYZP9012L",
      panFront: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&h=250&fit=crop",
      submissionDate: "19 Aug 2026",
    },
  },
  {
    id: "INV-005",
    name: "Vikram Singh",
    email: "vikram.s@corp.com",
    phone: "+91 54321 09876",
    kyc: "Rejected",
    fractions: 0,
    totalInvested: "₹0",
    joinDate: "08 Jun 2026",
    avatar: "VS",
    status: "Active",
    kycDetails: {
      aadhaarNumber: "9988 7766 5544",
      aadhaarFront: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&h=250&fit=crop",
      aadhaarBack: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&h=250&fit=crop",
      panNumber: "VKSG1234M",
      panFront: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&h=250&fit=crop",
      notes: "Blurry PAN card image. Name mismatch with Aadhaar.",
      submissionDate: "10 Jun 2026",
    },
  },
  {
    id: "INV-006",
    name: "Meera Nair",
    email: "meera.n@gmail.com",
    phone: "+91 43210 98765",
    kyc: "Verified",
    fractions: 30,
    totalInvested: "₹45,00,000",
    joinDate: "11 Jan 2026",
    avatar: "MN",
    status: "Active",
  },
  {
    id: "INV-007",
    name: "Rohan Deshmukh",
    email: "rohan.d@outlook.com",
    phone: "+91 32109 87654",
    kyc: "Pending",
    fractions: 2,
    totalInvested: "₹3,00,000",
    joinDate: "29 Jul 2026",
    avatar: "RD",
    status: "Active",
    kycDetails: {
      aadhaarNumber: "3344 5566 7788",
      aadhaarFront: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&h=250&fit=crop",
      aadhaarBack: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&h=250&fit=crop",
      panNumber: "RHDM4321X",
      panFront: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&h=250&fit=crop",
      submissionDate: "19 Aug 2026",
    },
  },
];

const kycColors: Record<string, string> = {
  Verified: "#16A34A",
  Pending: "#D97706",
  Rejected: "#DC2626",
  "Not Submitted": "#64748B",
};

export default function InvestorsPage() {
  const [investors, setInvestors] = useState<Investor[]>(initialInvestors);
  const [search, setSearch] = useState("");
  const [kycFilter, setKycFilter] = useState("All");
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const handleApproveKYC = (id: string) => {
    setInvestors((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, kyc: "Verified" } : inv))
    );
    if (selectedInvestor?.id === id) {
      setSelectedInvestor((prev) => prev ? { ...prev, kyc: "Verified" } : null);
    }
    setActionSuccess(`KYC approved successfully for ${selectedInvestor?.name || id}`);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const handleRejectKYC = (id: string) => {
    if (!rejectionReason.trim()) {
      alert("Please enter a rejection reason.");
      return;
    }
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
      setSelectedInvestor((prev) =>
        prev
          ? {
              ...prev,
              kyc: "Rejected",
              kycDetails: prev.kycDetails
                ? { ...prev.kycDetails, notes: rejectionReason }
                : undefined,
            }
          : null
      );
    }
    setActionSuccess(`KYC rejected with notes: "${rejectionReason}"`);
    setRejectionReason("");
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const handleToggleUserStatus = (id: string, newStatus: "Active" | "Deactivated" | "Banned") => {
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
          <button className={styles.addButton}>📥 Export KYC Ledger</button>
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
                        {selectedInvestor.kycDetails.panNumber}
                      </span>
                    </div>
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
