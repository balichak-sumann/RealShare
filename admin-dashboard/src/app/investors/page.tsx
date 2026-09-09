"use client";

import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import styles from "../properties/Properties.module.css";
import { getAuthHeader } from "@/lib/api-auth";

interface InvestmentItem {
  id: string;
  property_id: string;
  property_title: string;
  locality: string;
  district: string;
  state: string;
  thumbnail: string | null;
  fractions_bought: number;
  total_amount: number;
  booking_amount_paid: number;
  ownership_percentage: number;
  certificate_number: string | null;
  status: string;
  assured_yield: number;
  created_at: string;
}

interface TransactionItem {
  id: string;
  amount: number;
  currency: string;
  transaction_type: string;
  payment_gateway: string | null;
  payment_status: string;
  gateway_txn_id: string | null;
  created_at: string;
}

interface KycDoc {
  id: string;
  document_type: string;
  document_number: string;
  document_front_url: string;
  document_back_url: string | null;
  verification_status: string;
  rejection_reason: string | null;
}

interface Investor {
  id: string;
  name: string;
  email: string;
  phone: string;
  walletBalance: number;
  referralCode: string;
  referredByCode: string;
  fullAddress: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankIfsc: string;
  kyc: "Verified" | "Pending" | "Rejected" | "Not Submitted";
  kycRejectionReason?: string;
  fractions: number;
  totalInvested: string;
  rawTotalInvested: number;
  joinDate: string;
  avatar: string;
  status: "Active" | "Deactivated" | "Banned";
  investments: InvestmentItem[];
  transactions: TransactionItem[];
  kyc_documents: KycDoc[];
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
  const kycMap: Record<string, Investor["kyc"]> = {
    verified: "Verified",
    pending: "Pending",
    rejected: "Rejected",
    not_submitted: "Not Submitted",
  };

  const statusMap = (): Investor["status"] => {
    if (inv.is_banned) return "Banned";
    if (inv.is_active === false) return "Deactivated";
    return "Active";
  };

  const docs = inv.kyc_documents || [];
  const aadhaar = docs.find((d: any) => d.document_type === "aadhaar");
  const pan = docs.find((d: any) => d.document_type === "pan");
  const passport = docs.find((d: any) => d.document_type === "passport");
  const anyDoc = aadhaar || pan || passport;

  const fullName = inv.full_name || inv.email?.split("@")[0] || "Investor";

  return {
    id: inv.id,
    name: fullName,
    email: inv.email || "—",
    phone: inv.phone_number || "—",
    walletBalance: Number(inv.wallet_balance || 0),
    referralCode: inv.referral_code || "—",
    referredByCode: inv.referred_by_code || "—",
    fullAddress: inv.full_address || "—",
    bankAccountName: inv.bank_account_name || "—",
    bankAccountNumber: inv.bank_account_number || "—",
    bankIfsc: inv.bank_ifsc || "—",
    kyc: kycMap[inv.kyc_status] || "Not Submitted",
    kycRejectionReason: inv.kyc_rejection_reason || undefined,
    fractions: inv.total_fractions || 0,
    rawTotalInvested: Number(inv.total_invested || 0),
    totalInvested: `₹${Number(inv.total_invested || 0).toLocaleString("en-IN")}`,
    joinDate: inv.created_at ? new Date(inv.created_at).toLocaleDateString() : "—",
    avatar:
      fullName
        .split(" ")
        .map((p: string) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase() || "IN",
    status: statusMap(),
    investments: inv.investments || [],
    transactions: inv.transactions || [],
    kyc_documents: docs,
    kycDetails: anyDoc
      ? {
          aadhaarNumber: aadhaar?.document_number || "",
          aadhaarFront: aadhaar?.document_front_url || "",
          aadhaarBack: aadhaar?.document_back_url || "",
          panNumber: pan?.document_number || "",
          panFront: pan?.document_front_url || "",
          passportNumber: passport?.document_number,
          submissionDate: inv.created_at
            ? new Date(inv.created_at).toLocaleDateString()
            : "",
          notes: anyDoc?.rejection_reason || inv.kyc_rejection_reason || undefined,
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
  const [statusFilter, setStatusFilter] = useState("All");

  // Selected Investor Drawer
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "portfolio" | "wallet" | "kyc" | "activity">("overview");

  // Edit Profile Form State
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editBankName, setEditBankName] = useState("");
  const [editBankAcc, setEditBankAcc] = useState("");
  const [editBankIfsc, setEditBankIfsc] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Wallet Adjustment Form State
  const [adjAmount, setAdjAmount] = useState("");
  const [adjType, setAdjType] = useState<"credit" | "debit">("credit");
  const [adjReason, setAdjReason] = useState("");
  const [isAdjustingWallet, setIsAdjustingWallet] = useState(false);

  // KYC Review State
  const [rejectionReason, setRejectionReason] = useState("");

  // Notifications
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadInvestors = async () => {
    setLoading(true);
    try {
      const authHeader = await getAuthHeader();
      if (!authHeader) {
        setLoading(false);
        return;
      }
      const res = await fetch("/api/investors", { headers: authHeader });
      if (res.ok) {
        const data = await res.json();
        setInvestors(Array.isArray(data) ? data.map(mapApiInvestor) : []);
      }
    } catch (e) {
      console.error("Failed to load investors:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvestors();
  }, []);

  const openInvestorDrawer = (inv: Investor) => {
    setSelectedInvestor(inv);
    setEditName(inv.name);
    setEditPhone(inv.phone === "—" ? "" : inv.phone);
    setEditAddress(inv.fullAddress === "—" ? "" : inv.fullAddress);
    setEditBankName(inv.bankAccountName === "—" ? "" : inv.bankAccountName);
    setEditBankAcc(inv.bankAccountNumber === "—" ? "" : inv.bankAccountNumber);
    setEditBankIfsc(inv.bankIfsc === "—" ? "" : inv.bankIfsc);
    setActiveTab("overview");
  };

  const patchInvestor = async (id: string, body: any) => {
    try {
      const authHeader = await getAuthHeader();
      if (!authHeader) {
        setActionError("You must be signed in to do that.");
        return null;
      }
      const res = await fetch(`/api/investors/${id}`, {
        method: "PATCH",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setActionError(err.error || "Action failed.");
        return null;
      }
      const updatedData = await res.json();
      return updatedData;
    } catch (e) {
      console.error(e);
      setActionError("Failed to update investor.");
      return null;
    }
  };

  // 1. Save Profile Changes
  const handleSaveProfile = async () => {
    if (!selectedInvestor) return;
    setIsSavingProfile(true);
    const updated = await patchInvestor(selectedInvestor.id, {
      full_name: editName,
      phone_number: editPhone,
      full_address: editAddress,
      bank_account_name: editBankName,
      bank_account_number: editBankAcc,
      bank_ifsc: editBankIfsc,
    });
    setIsSavingProfile(false);
    if (!updated) return;

    const mapped = mapApiInvestor(updated);
    setInvestors((prev) =>
      prev.map((i) => (i.id === selectedInvestor.id ? mapped : i))
    );
    setSelectedInvestor(mapped);
    setActionSuccess(`Profile details updated for ${mapped.name}`);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  // 2. Adjust Wallet Balance
  const handleAdjustWallet = async () => {
    if (!selectedInvestor || !adjAmount || isNaN(Number(adjAmount))) {
      alert("Please enter a valid numeric adjustment amount.");
      return;
    }
    setIsAdjustingWallet(true);
    const updated = await patchInvestor(selectedInvestor.id, {
      wallet_adjustment: {
        amount: Number(adjAmount),
        type: adjType,
        reason: adjReason || `Admin manual ${adjType}`,
      },
    });
    setIsAdjustingWallet(false);
    if (!updated) return;

    const mapped = mapApiInvestor(updated);
    setInvestors((prev) =>
      prev.map((i) => (i.id === selectedInvestor.id ? mapped : i))
    );
    setSelectedInvestor(mapped);
    setAdjAmount("");
    setAdjReason("");
    setActionSuccess(
      `Wallet balance updated to ₹${mapped.walletBalance.toLocaleString("en-IN")}`
    );
    setTimeout(() => setActionSuccess(null), 4000);
  };

  // 3. KYC Actions
  const handleApproveKYC = async (id: string, offline = false) => {
    const action = offline ? "mark_offline_verified" : "approve";
    const updated = await patchInvestor(id, { kyc_action: action });
    if (!updated) return;
    const mapped = mapApiInvestor(updated);
    setInvestors((prev) => prev.map((inv) => (inv.id === id ? mapped : inv)));
    if (selectedInvestor?.id === id) setSelectedInvestor(mapped);
    setActionSuccess(
      offline
        ? `Marked as Offline Verified for ${mapped.name}`
        : `KYC approved for ${mapped.name}`
    );
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const handleRejectKYC = async (id: string) => {
    if (!rejectionReason.trim()) {
      alert("Please enter a rejection reason.");
      return;
    }
    const updated = await patchInvestor(id, {
      kyc_action: "reject",
      rejection_reason: rejectionReason,
    });
    if (!updated) return;
    const mapped = mapApiInvestor(updated);
    setInvestors((prev) => prev.map((inv) => (inv.id === id ? mapped : inv)));
    if (selectedInvestor?.id === id) setSelectedInvestor(mapped);
    setActionSuccess(`KYC marked as rejected for ${mapped.name}`);
    setRejectionReason("");
    setTimeout(() => setActionSuccess(null), 4000);
  };

  // 4. Toggle User Status
  const handleToggleUserStatus = async (
    id: string,
    newStatus: "Active" | "Deactivated" | "Banned"
  ) => {
    const updated = await patchInvestor(id, {
      is_active: newStatus === "Active",
      is_banned: newStatus === "Banned",
    });
    if (!updated) return;
    const mapped = mapApiInvestor(updated);
    setInvestors((prev) => prev.map((inv) => (inv.id === id ? mapped : inv)));
    if (selectedInvestor?.id === id) setSelectedInvestor(mapped);
    setActionSuccess(`Account status changed to ${newStatus}`);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  // Filtering
  const filtered = investors.filter((inv) => {
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      inv.name.toLowerCase().includes(q) ||
      inv.email.toLowerCase().includes(q) ||
      inv.phone.toLowerCase().includes(q) ||
      inv.id.toLowerCase().includes(q) ||
      inv.referralCode.toLowerCase().includes(q) ||
      inv.fullAddress.toLowerCase().includes(q);

    let matchFilter = true;
    if (statusFilter === "Active") matchFilter = inv.status === "Active";
    else if (statusFilter === "Deactivated") matchFilter = inv.status === "Deactivated";
    else if (statusFilter === "Banned") matchFilter = inv.status === "Banned";
    else if (statusFilter === "Verified") matchFilter = inv.kyc === "Verified";
    else if (statusFilter === "Pending") matchFilter = inv.kyc === "Pending";
    else if (statusFilter === "Not Submitted") matchFilter = inv.kyc === "Not Submitted";
    else if (statusFilter === "Rejected") matchFilter = inv.kyc === "Rejected";

    return matchSearch && matchFilter;
  });

  const totalRegisteredCount = investors.length;
  const activeAccountsCount = investors.filter((i) => i.status === "Active").length;
  const totalCapitalInvested = investors.reduce(
    (sum, i) => sum + (Number(i.rawTotalInvested) || 0),
    0
  );
  const totalFractionsHeld = investors.reduce(
    (sum, i) => sum + (Number(i.fractions) || 0),
    0
  );

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

      {actionError && (
        <div
          style={{
            background: "linear-gradient(135deg, #DC2626, #EF4444)",
            color: "#fff",
            padding: "14px 20px",
            borderRadius: "10px",
            marginBottom: "20px",
            fontWeight: 600,
            boxShadow: "0 4px 12px rgba(239, 68, 68, 0.2)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>⚠️ {actionError}</span>
          <button
            onClick={() => setActionError(null)}
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

      {/* KPI Header Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "18px",
          marginBottom: "28px",
        }}
      >
        {/* Card 1: Total Registered Users */}
        <div
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            borderRadius: "14px",
            padding: "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              color: "var(--text-secondary)",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Total Registered Investors
          </div>
          <div
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              marginTop: "8px",
              color: "var(--text-primary)",
            }}
          >
            {loading ? "…" : totalRegisteredCount}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: "4px" }}>
            {activeAccountsCount} Active Portfolio Accounts
          </div>
        </div>

        {/* Card 2: Total Fractions Held */}
        <div
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            borderRadius: "14px",
            padding: "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              color: "#2563EB",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Fractional Shares Held
          </div>
          <div
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              color: "#2563EB",
              marginTop: "8px",
            }}
          >
            {loading ? "…" : `${totalFractionsHeld} Fractions`}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: "4px" }}>
            Circulating in Live Assets
          </div>
        </div>

        {/* Card 3: Total Capital Invested */}
        <div
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            borderRadius: "14px",
            padding: "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              color: "#16A34A",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Total Capital Invested
          </div>
          <div
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              color: "#16A34A",
              marginTop: "8px",
            }}
          >
            {loading ? "…" : `₹${totalCapitalInvested.toLocaleString("en-IN")}`}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#16A34A", marginTop: "4px" }}>
            Cumulative Investment Volume
          </div>
        </div>

        {/* Card 4: KYC & Account Status Summary */}
        <div
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            borderRadius: "14px",
            padding: "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              color: "#D97706",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            KYC Verification Status
          </div>
          <div
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              color: "#D97706",
              marginTop: "8px",
            }}
          >
            {loading
              ? "…"
              : `${investors.filter((i) => i.kyc === "Verified").length} / ${investors.length}`}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: "4px" }}>
            {investors.filter((i) => i.kyc === "Pending").length} Pending Verification
          </div>
        </div>
      </div>

      {/* Main Table Controls & Filters */}
      <div className={styles.header}>
        <div className={styles.title}>Customer & Investor Directory ({filtered.length})</div>
        <div className={styles.headerRight}>
          <div className={styles.filterGroup}>
            {["All", "Active", "Verified", "Pending", "Not Submitted", "Rejected"].map((k) => (
              <button
                key={k}
                className={`${styles.filterPill} ${
                  statusFilter === k ? styles.filterActive : ""
                }`}
                onClick={() => setStatusFilter(k)}
              >
                {k === "Pending"
                  ? `Pending (${investors.filter((i) => i.kyc === "Pending").length})`
                  : k === "Verified"
                  ? `Verified (${investors.filter((i) => i.kyc === "Verified").length})`
                  : k === "Active"
                  ? `Active (${activeAccountsCount})`
                  : k === "Not Submitted"
                  ? `Not Submitted (${investors.filter((i) => i.kyc === "Not Submitted").length})`
                  : `All (${investors.length})`}
              </button>
            ))}
          </div>

          <button
            className={styles.addButton}
            onClick={() => {
              const headers = [
                "Name",
                "Email",
                "Phone",
                "User ID",
                "Wallet Balance (INR)",
                "KYC Status",
                "Account Status",
                "Fractions Held",
                "Total Invested (INR)",
                "Referral Code",
                "Address",
                "Joined Date",
              ];
              const rows = filtered.map((inv) => [
                `"${inv.name}"`,
                `"${inv.email}"`,
                `"${inv.phone}"`,
                `"${inv.id}"`,
                inv.walletBalance,
                `"${inv.kyc}"`,
                `"${inv.status}"`,
                inv.fractions,
                inv.rawTotalInvested,
                `"${inv.referralCode}"`,
                `"${inv.fullAddress}"`,
                `"${inv.joinDate}"`,
              ]);
              const csvContent =
                [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
              const blob = new Blob([csvContent], {
                type: "text/csv;charset=utf-8;",
              });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = `investor_directory_${new Date().toISOString().split("T")[0]}.csv`;
              link.click();
              URL.revokeObjectURL(url);
            }}
          >
            📥 Export CSV Ledger
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className={styles.searchBar}>
        <span>🔍</span>
        <input
          type="text"
          placeholder="Search by name, email, phone number, location, referral code, or User ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Investors Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Investor</th>
              <th className={styles.th}>Contact Info</th>
              <th className={styles.th}>Wallet Balance</th>
              <th className={styles.th}>KYC Status</th>
              <th className={styles.th}>Account Status</th>
              <th className={styles.th}>Fractions</th>
              <th className={styles.th}>Total Invested</th>
              <th className={styles.th}>Joined</th>
              <th className={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className={styles.td} colSpan={9} style={{ textAlign: "center", padding: "40px" }}>
                  Loading registered investors...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className={styles.td} colSpan={9} style={{ textAlign: "center", padding: "40px" }}>
                  No investors found matching the current search or filter.
                </td>
              </tr>
            ) : (
              filtered.map((inv) => (
                <tr key={inv.id} className={styles.tr}>
                  {/* Investor Name & Avatar */}
                  <td className={styles.td}>
                    <div className={styles.propCell}>
                      <div
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 12,
                          background: `linear-gradient(135deg, ${
                            kycColors[inv.kyc] || "#6366F1"
                          }, #0F172A)`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontWeight: 800,
                          fontSize: "0.8rem",
                          flexShrink: 0,
                          boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                        }}
                      >
                        {inv.avatar}
                      </div>
                      <div>
                        <strong style={{ fontSize: "0.95rem", color: "var(--text-primary)" }}>
                          {inv.name}
                        </strong>
                        <div
                          style={{
                            fontSize: "0.7rem",
                            color: "var(--text-secondary)",
                            fontFamily: "monospace",
                            marginTop: "2px",
                          }}
                        >
                          {inv.id}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Contact Info */}
                  <td className={styles.td}>
                    <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{inv.email}</div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-secondary)",
                        marginTop: "2px",
                      }}
                    >
                      {inv.phone}
                    </div>
                  </td>

                  {/* Wallet Balance */}
                  <td className={styles.td}>
                    <strong style={{ color: "#059669", fontSize: "0.9rem" }}>
                      ₹{inv.walletBalance.toLocaleString("en-IN")}
                    </strong>
                  </td>

                  {/* KYC Status */}
                  <td className={styles.td}>
                    <span
                      className={styles.statusBadge}
                      style={{
                        background: `${kycColors[inv.kyc]}15`,
                        color: kycColors[inv.kyc],
                        cursor: "pointer",
                        fontWeight: 700,
                      }}
                      onClick={() => openInvestorDrawer(inv)}
                      title="Click to view details"
                    >
                      {inv.kyc}
                    </span>
                  </td>

                  {/* Account Status */}
                  <td className={styles.td}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "4px 10px",
                        borderRadius: "6px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
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

                  {/* Fractions */}
                  <td className={styles.td}>
                    <strong style={{ fontSize: "0.95rem" }}>{inv.fractions}</strong>
                  </td>

                  {/* Total Invested */}
                  <td className={styles.td}>
                    <strong style={{ fontSize: "0.95rem" }}>{inv.totalInvested}</strong>
                  </td>

                  {/* Joined Date */}
                  <td className={styles.td} style={{ fontSize: "0.85rem", color: "#64748B" }}>
                    {inv.joinDate}
                  </td>

                  {/* Action Button */}
                  <td className={styles.td}>
                    <div className={styles.actions}>
                      <button
                        className={styles.actionBtn}
                        onClick={() => openInvestorDrawer(inv)}
                        style={{
                          background: "#F1F5F9",
                          borderColor: "#CBD5E1",
                          color: "#1E293B",
                          fontWeight: 700,
                          fontSize: "0.8rem",
                          padding: "6px 14px",
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <span>👤</span> Manage
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Comprehensive Investor 360° Management Drawer / Modal */}
      {selectedInvestor && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(5px)",
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
              borderRadius: "18px",
              width: "100%",
              maxWidth: "860px",
              maxHeight: "92vh",
              overflowY: "auto",
              padding: "28px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              border: "1px solid #E2E8F0",
            }}
          >
            {/* Modal Header */}
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
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    background: "linear-gradient(135deg, #D4AF37, #0F172A)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: "1.1rem",
                  }}
                >
                  {selectedInvestor.avatar}
                </div>
                <div>
                  <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0F172A", margin: 0 }}>
                    {selectedInvestor.name}
                  </h2>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px" }}>
                    <span style={{ fontSize: "0.8rem", color: "#64748B", fontFamily: "monospace" }}>
                      ID: {selectedInvestor.id}
                    </span>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontWeight: 700,
                        background:
                          selectedInvestor.status === "Active"
                            ? "#DCFCE7"
                            : selectedInvestor.status === "Deactivated"
                            ? "#FEF3C7"
                            : "#FEE2E2",
                        color:
                          selectedInvestor.status === "Active"
                            ? "#15803D"
                            : selectedInvestor.status === "Deactivated"
                            ? "#B45309"
                            : "#B91C1C",
                      }}
                    >
                      {selectedInvestor.status}
                    </span>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontWeight: 700,
                        background: `${kycColors[selectedInvestor.kyc]}15`,
                        color: kycColors[selectedInvestor.kyc],
                      }}
                    >
                      KYC: {selectedInvestor.kyc}
                    </span>
                  </div>
                </div>
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
                  padding: "8px 14px",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  color: "#475569",
                }}
              >
                ✕ Close
              </button>
            </div>

            {/* Modal Tabs */}
            <div
              style={{
                display: "flex",
                gap: "8px",
                borderBottom: "1px solid #E2E8F0",
                marginBottom: "20px",
                paddingBottom: "8px",
              }}
            >
              {[
                { key: "overview", label: "📋 Profile & Contact" },
                { key: "portfolio", label: `🏢 Portfolio (${selectedInvestor.investments.length})` },
                { key: "wallet", label: "💳 Wallet & Banking" },
                { key: "kyc", label: "🛡️ KYC Documents" },
                { key: "activity", label: `📜 Transactions (${selectedInvestor.transactions.length})` },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: "none",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    background: activeTab === tab.key ? "#0F172A" : "transparent",
                    color: activeTab === tab.key ? "#FFFFFF" : "#64748B",
                    transition: "all 0.15s ease",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB 1: Profile & Contact */}
            {activeTab === "overview" && (
              <div>
                <div
                  style={{
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: "12px",
                    padding: "20px",
                    marginBottom: "20px",
                  }}
                >
                  <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "16px", color: "#1E293B" }}>
                    Edit Investor Details
                  </h3>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "16px",
                      marginBottom: "16px",
                    }}
                  >
                    <div>
                      <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748B" }}>
                        FULL NAME
                      </label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: "8px",
                          border: "1px solid #CBD5E1",
                          marginTop: "4px",
                          fontSize: "0.9rem",
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748B" }}>
                        EMAIL ADDRESS (ACCOUNT ID)
                      </label>
                      <input
                        type="text"
                        value={selectedInvestor.email}
                        disabled
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: "8px",
                          border: "1px solid #CBD5E1",
                          marginTop: "4px",
                          fontSize: "0.9rem",
                          background: "#F1F5F9",
                          color: "#64748B",
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748B" }}>
                        PHONE NUMBER
                      </label>
                      <input
                        type="text"
                        value={editPhone}
                        placeholder="e.g. +91 9876543210"
                        onChange={(e) => setEditPhone(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: "8px",
                          border: "1px solid #CBD5E1",
                          marginTop: "4px",
                          fontSize: "0.9rem",
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748B" }}>
                        RESIDENTIAL ADDRESS / CITY
                      </label>
                      <input
                        type="text"
                        value={editAddress}
                        placeholder="e.g. Jubilee Hills, Hyderabad"
                        onChange={(e) => setEditAddress(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: "8px",
                          border: "1px solid #CBD5E1",
                          marginTop: "4px",
                          fontSize: "0.9rem",
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748B" }}>
                        REFERRAL CODE
                      </label>
                      <div
                        style={{
                          padding: "10px 12px",
                          borderRadius: "8px",
                          border: "1px solid #CBD5E1",
                          marginTop: "4px",
                          fontSize: "0.85rem",
                          fontWeight: 700,
                          background: "#F1F5F9",
                          color: "#1E293B",
                        }}
                      >
                        {selectedInvestor.referralCode}
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748B" }}>
                        REFERRED BY CODE
                      </label>
                      <div
                        style={{
                          padding: "10px 12px",
                          borderRadius: "8px",
                          border: "1px solid #CBD5E1",
                          marginTop: "4px",
                          fontSize: "0.85rem",
                          fontWeight: 700,
                          background: "#F1F5F9",
                          color: "#1E293B",
                        }}
                      >
                        {selectedInvestor.referredByCode}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSavingProfile}
                      style={{
                        padding: "10px 24px",
                        borderRadius: "8px",
                        background: "#0F172A",
                        color: "#fff",
                        fontWeight: 700,
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      {isSavingProfile ? "Saving…" : "✓ Save Profile Changes"}
                    </button>
                  </div>
                </div>

                {/* Account Status Controls */}
                <div
                  style={{
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: "12px",
                    padding: "20px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1E293B", margin: 0 }}>
                      Account Status Control
                    </h4>
                    <p style={{ fontSize: "0.8rem", color: "#64748B", marginTop: "2px" }}>
                      Current status: <strong>{selectedInvestor.status}</strong>
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => handleToggleUserStatus(selectedInvestor.id, "Active")}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "6px",
                        border: "none",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        background: selectedInvestor.status === "Active" ? "#16A34A" : "#E2E8F0",
                        color: selectedInvestor.status === "Active" ? "#fff" : "#475569",
                      }}
                    >
                      Set Active
                    </button>
                    <button
                      onClick={() => handleToggleUserStatus(selectedInvestor.id, "Deactivated")}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "6px",
                        border: "none",
                        fontSize: "0.8rem",
                        fontWeight: 700,
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
                        padding: "8px 16px",
                        borderRadius: "6px",
                        border: "none",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        background: selectedInvestor.status === "Banned" ? "#DC2626" : "#E2E8F0",
                        color: selectedInvestor.status === "Banned" ? "#fff" : "#475569",
                      }}
                    >
                      Ban Account
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Portfolio & Investments */}
            {activeTab === "portfolio" && (
              <div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                    marginBottom: "20px",
                  }}
                >
                  <div
                    style={{
                      background: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                      borderRadius: "12px",
                      padding: "16px",
                    }}
                  >
                    <span style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 700 }}>
                      TOTAL FRACTIONS HELD
                    </span>
                    <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#2563EB", marginTop: "4px" }}>
                      {selectedInvestor.fractions} Fractions
                    </div>
                  </div>

                  <div
                    style={{
                      background: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                      borderRadius: "12px",
                      padding: "16px",
                    }}
                  >
                    <span style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 700 }}>
                      TOTAL CAPITAL INVESTED
                    </span>
                    <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#16A34A", marginTop: "4px" }}>
                      {selectedInvestor.totalInvested}
                    </div>
                  </div>
                </div>

                {selectedInvestor.investments.length === 0 ? (
                  <div
                    style={{
                      padding: "40px 20px",
                      textAlign: "center",
                      background: "#F8FAFC",
                      borderRadius: "12px",
                      border: "1px solid #E2E8F0",
                      color: "#64748B",
                    }}
                  >
                    <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🏢</div>
                    <strong style={{ color: "#0F172A", fontSize: "1rem" }}>
                      No Fractional Properties Owned Yet
                    </strong>
                    <p style={{ fontSize: "0.85rem", marginTop: "6px" }}>
                      When this investor purchases fractions from the RealShare mobile app or website, their portfolio assets will show here.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {selectedInvestor.investments.map((invItem) => (
                      <div
                        key={invItem.id}
                        style={{
                          border: "1px solid #E2E8F0",
                          borderRadius: "12px",
                          padding: "16px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          background: "#FFFFFF",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                        }}
                      >
                        <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                          {invItem.thumbnail ? (
                            <img
                              src={invItem.thumbnail}
                              alt={invItem.property_title}
                              style={{
                                width: 50,
                                height: 50,
                                borderRadius: 8,
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: 50,
                                height: 50,
                                borderRadius: 8,
                                background: "#E2E8F0",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "1.2rem",
                              }}
                            >
                              🏢
                            </div>
                          )}
                          <div>
                            <strong style={{ fontSize: "0.95rem", color: "#0F172A" }}>
                              {invItem.property_title}
                            </strong>
                            <div style={{ fontSize: "0.8rem", color: "#64748B", marginTop: "2px" }}>
                              📍 {invItem.locality}, {invItem.district}
                            </div>
                          </div>
                        </div>

                        <div style={{ textAlign: "right" }}>
                          <strong style={{ fontSize: "1rem", color: "#0F172A" }}>
                            {invItem.fractions_bought} Fractions
                          </strong>
                          <div style={{ fontSize: "0.85rem", color: "#16A34A", fontWeight: 700, marginTop: "2px" }}>
                            ₹{invItem.total_amount.toLocaleString("en-IN")}
                          </div>
                          {invItem.assured_yield > 0 && (
                            <div style={{ fontSize: "0.75rem", color: "#D4AF37", fontWeight: 700 }}>
                              Yield: {invItem.assured_yield}% p.a.
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Wallet & Banking */}
            {activeTab === "wallet" && (
              <div>
                <div
                  style={{
                    background: "linear-gradient(135deg, #0F172A, #1E293B)",
                    borderRadius: "14px",
                    padding: "24px",
                    color: "#FFFFFF",
                    marginBottom: "20px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <span style={{ fontSize: "0.8rem", color: "#94A3B8", fontWeight: 600 }}>
                      AVAILABLE WALLET BALANCE
                    </span>
                    <div style={{ fontSize: "2rem", fontWeight: 800, color: "#34D399", marginTop: "4px" }}>
                      ₹{selectedInvestor.walletBalance.toLocaleString("en-IN")}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", fontSize: "0.8rem", color: "#94A3B8" }}>
                    Used for instant token purchases and rental dividend payouts.
                  </div>
                </div>

                {/* Adjust Balance Tool */}
                <div
                  style={{
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: "12px",
                    padding: "20px",
                    marginBottom: "20px",
                  }}
                >
                  <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1E293B", marginBottom: "14px" }}>
                    ⚡ Admin Wallet Balance Adjustment
                  </h4>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: "14px",
                      marginBottom: "14px",
                    }}
                  >
                    <div>
                      <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748B" }}>
                        ACTION TYPE
                      </label>
                      <select
                        value={adjType}
                        onChange={(e) => setAdjType(e.target.value as any)}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: "8px",
                          border: "1px solid #CBD5E1",
                          marginTop: "4px",
                          fontSize: "0.9rem",
                        }}
                      >
                        <option value="credit">Deposit / Credit (+)</option>
                        <option value="debit">Deduct / Debit (-)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748B" }}>
                        AMOUNT (₹)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 50000"
                        value={adjAmount}
                        onChange={(e) => setAdjAmount(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: "8px",
                          border: "1px solid #CBD5E1",
                          marginTop: "4px",
                          fontSize: "0.9rem",
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748B" }}>
                        REASON / REMARKS
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Wire transfer deposit"
                        value={adjReason}
                        onChange={(e) => setAdjReason(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: "8px",
                          border: "1px solid #CBD5E1",
                          marginTop: "4px",
                          fontSize: "0.9rem",
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      onClick={handleAdjustWallet}
                      disabled={isAdjustingWallet}
                      style={{
                        padding: "10px 20px",
                        borderRadius: "8px",
                        background: adjType === "credit" ? "#16A34A" : "#DC2626",
                        color: "#fff",
                        fontWeight: 700,
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      {isAdjustingWallet
                        ? "Applying…"
                        : adjType === "credit"
                        ? "✓ Credit Funds to Wallet"
                        : "✕ Debit Funds from Wallet"}
                    </button>
                  </div>
                </div>

                {/* Bank Account Details */}
                <div
                  style={{
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: "12px",
                    padding: "20px",
                  }}
                >
                  <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1E293B", marginBottom: "14px" }}>
                    🏦 Linked Bank Account
                  </h4>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
                    <div>
                      <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748B" }}>
                        ACCOUNT HOLDER NAME
                      </label>
                      <input
                        type="text"
                        value={editBankName}
                        placeholder="e.g. Balichak Suman"
                        onChange={(e) => setEditBankName(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: "8px",
                          border: "1px solid #CBD5E1",
                          marginTop: "4px",
                          fontSize: "0.9rem",
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748B" }}>
                        BANK ACCOUNT NUMBER
                      </label>
                      <input
                        type="text"
                        value={editBankAcc}
                        placeholder="e.g. 50100492817291"
                        onChange={(e) => setEditBankAcc(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: "8px",
                          border: "1px solid #CBD5E1",
                          marginTop: "4px",
                          fontSize: "0.9rem",
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748B" }}>
                        IFSC CODE
                      </label>
                      <input
                        type="text"
                        value={editBankIfsc}
                        placeholder="e.g. HDFC0001234"
                        onChange={(e) => setEditBankIfsc(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: "8px",
                          border: "1px solid #CBD5E1",
                          marginTop: "4px",
                          fontSize: "0.9rem",
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "14px" }}>
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSavingProfile}
                      style={{
                        padding: "8px 18px",
                        borderRadius: "8px",
                        background: "#0F172A",
                        color: "#fff",
                        fontWeight: 700,
                        border: "none",
                        cursor: "pointer",
                        fontSize: "0.85rem",
                      }}
                    >
                      Save Bank Details
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: KYC Documents */}
            {activeTab === "kyc" && (
              <div>
                {selectedInvestor.kycDetails ? (
                  <div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "16px",
                        marginBottom: "20px",
                      }}
                    >
                      {/* Aadhaar */}
                      <div
                        style={{
                          border: "1px solid #E2E8F0",
                          borderRadius: "12px",
                          padding: "16px",
                          background: "#F8FAFC",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                          <strong style={{ fontSize: "0.9rem" }}>1. Aadhaar Card</strong>
                          <span style={{ fontSize: "0.8rem", fontFamily: "monospace", color: "#475569" }}>
                            {selectedInvestor.kycDetails.aadhaarNumber || "Submitted"}
                          </span>
                        </div>
                        {selectedInvestor.kycDetails.aadhaarFront ? (
                          <img
                            src={selectedInvestor.kycDetails.aadhaarFront}
                            alt="Aadhaar Front"
                            style={{
                              width: "100%",
                              height: "150px",
                              objectFit: "cover",
                              borderRadius: "8px",
                              border: "1px solid #CBD5E1",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "100%",
                              height: "150px",
                              backgroundColor: "#E2E8F0",
                              borderRadius: "8px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#94A3B8",
                            }}
                          >
                            Not Uploaded
                          </div>
                        )}
                      </div>

                      {/* PAN */}
                      <div
                        style={{
                          border: "1px solid #E2E8F0",
                          borderRadius: "12px",
                          padding: "16px",
                          background: "#F8FAFC",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                          <strong style={{ fontSize: "0.9rem" }}>2. PAN Card</strong>
                          <span style={{ fontSize: "0.8rem", fontFamily: "monospace", color: "#475569" }}>
                            {selectedInvestor.kycDetails.panNumber || "Submitted"}
                          </span>
                        </div>
                        {selectedInvestor.kycDetails.panFront ? (
                          <img
                            src={selectedInvestor.kycDetails.panFront}
                            alt="PAN Front"
                            style={{
                              width: "100%",
                              height: "150px",
                              objectFit: "cover",
                              borderRadius: "8px",
                              border: "1px solid #CBD5E1",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "100%",
                              height: "150px",
                              backgroundColor: "#E2E8F0",
                              borderRadius: "8px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#94A3B8",
                            }}
                          >
                            Not Uploaded
                          </div>
                        )}
                      </div>
                    </div>

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
                        <strong>Remarks:</strong> {selectedInvestor.kycDetails.notes}
                      </div>
                    )}

                    {/* Verification Actions */}
                    <div
                      style={{
                        background: "#F1F5F9",
                        padding: "18px",
                        borderRadius: "12px",
                        border: "1px solid #CBD5E1",
                      }}
                    >
                      <h4 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "10px" }}>
                        Verification Actions
                      </h4>
                      <textarea
                        placeholder="Enter rejection reason or approval remarks..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: "8px",
                          border: "1px solid #CBD5E1",
                          fontSize: "0.85rem",
                          minHeight: "60px",
                          marginBottom: "12px",
                          resize: "vertical",
                        }}
                      />
                      <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                        <button
                          onClick={() => handleRejectKYC(selectedInvestor.id)}
                          style={{
                            padding: "8px 18px",
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
                            padding: "8px 22px",
                            borderRadius: "8px",
                            backgroundColor: "#16A34A",
                            color: "#fff",
                            fontWeight: 700,
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          ✓ Approve KYC
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: "36px 20px",
                      textAlign: "center",
                      color: "#64748B",
                      background: "#F8FAFC",
                      borderRadius: "12px",
                      border: "1px solid #E2E8F0",
                    }}
                  >
                    <div style={{ fontSize: "2.2rem", marginBottom: "8px" }}>🛡️</div>
                    <strong style={{ color: "#0F172A", fontSize: "1rem" }}>
                      No KYC Documents Submitted Yet
                    </strong>
                    <p style={{ fontSize: "0.85rem", marginTop: 6, color: "#64748B", maxWidth: "480px", margin: "6px auto 16px auto" }}>
                      The investor has not uploaded digital identity documents yet. If this user was verified offline / in-person, you can verify their account directly below.
                    </p>
                    <button
                      onClick={() => handleApproveKYC(selectedInvestor.id, true)}
                      style={{
                        padding: "10px 24px",
                        borderRadius: "8px",
                        background: "#16A34A",
                        color: "#fff",
                        fontWeight: 700,
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      ✓ Mark as Verified (Offline / In-Person KYC)
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: Activity & Transactions */}
            {activeTab === "activity" && (
              <div>
                {selectedInvestor.transactions.length === 0 ? (
                  <div
                    style={{
                      padding: "36px 20px",
                      textAlign: "center",
                      color: "#64748B",
                      background: "#F8FAFC",
                      borderRadius: "12px",
                      border: "1px solid #E2E8F0",
                    }}
                  >
                    <div style={{ fontSize: "2rem", marginBottom: "8px" }}>📜</div>
                    <strong style={{ color: "#0F172A" }}>No Transaction History Yet</strong>
                    <p style={{ fontSize: "0.85rem", marginTop: 4 }}>
                      Deposits, withdrawals, and fractional purchases will be logged here.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {selectedInvestor.transactions.map((tx) => (
                      <div
                        key={tx.id}
                        style={{
                          border: "1px solid #E2E8F0",
                          borderRadius: "10px",
                          padding: "14px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          background: "#FFFFFF",
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: "0.9rem", color: "#0F172A" }}>
                            {tx.transaction_type.toUpperCase().replace("_", " ")}
                          </strong>
                          <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: "2px" }}>
                            Gateway: {tx.payment_gateway || "System"} •{" "}
                            {new Date(tx.created_at).toLocaleString()}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <strong style={{ fontSize: "0.95rem", color: "#0F172A" }}>
                            ₹{tx.amount.toLocaleString("en-IN")}
                          </strong>
                          <div
                            style={{
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              color: tx.payment_status === "completed" ? "#16A34A" : "#D97706",
                              marginTop: "2px",
                            }}
                          >
                            {tx.payment_status.toUpperCase()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
