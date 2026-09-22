"use client";

import React, { useState, useEffect } from "react";
import { getAuthHeader } from "@/lib/api-auth";

interface DeleteOtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: string;
  targetName: string;
  targetType: string; // 'Property' | 'User Account' | 'Developer' | 'Banner'
  deleteUrl: string; // Endpoint URL e.g. /api/properties/123 or /api/approvals?id=123
  onSuccess: () => void;
}

export default function DeleteOtpModal({
  isOpen,
  onClose,
  targetId,
  targetName,
  targetType,
  deleteUrl,
  onSuccess,
}: DeleteOtpModalProps) {
  const [otp, setOtp] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && targetId) {
      sendDeletionOtp();
    } else {
      setOtp("");
      setError(null);
      setStatusMsg(null);
    }
  }, [isOpen, targetId]);

  const sendDeletionOtp = async () => {
    setIsSendingOtp(true);
    setError(null);
    setStatusMsg(null);

    try {
      const authHeader = await getAuthHeader();
      if (!authHeader) {
        setError("You must be signed in as Super Admin.");
        setIsSendingOtp(false);
        return;
      }

      const res = await fetch("/api/admin/deletion-otp", {
        method: "POST",
        headers: {
          ...authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ targetId, targetType }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to dispatch deletion OTP.");
      } else {
        setStatusMsg(
          data.devOtp
            ? `🔐 Deletion OTP dispatched! (Dev OTP: ${data.devOtp})`
            : `🔐 Security OTP sent to Super Admin phone to confirm deletion.`
        );
      }
    } catch (e: any) {
      setError(e.message || "Failed to send deletion OTP.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleConfirmDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError("Please enter the 6-digit Security OTP.");
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const authHeader = await getAuthHeader();
      if (!authHeader) {
        setError("You must be signed in as Super Admin.");
        setIsDeleting(false);
        return;
      }

      // Append otp parameter to delete URL
      const separator = deleteUrl.includes("?") ? "&" : "?";
      const fullUrl = `${deleteUrl}${separator}otp=${encodeURIComponent(otp.trim())}`;

      const res = await fetch(fullUrl, {
        method: "DELETE",
        headers: authHeader,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to delete record.");
      } else {
        onSuccess();
        onClose();
      }
    } catch (e: any) {
      setError(e.message || "Failed to delete record.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(6px)",
        zIndex: 9999,
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
          maxWidth: "460px",
          padding: "28px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #E2E8F0",
            paddingBottom: "14px",
            marginBottom: "18px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "1.4rem" }}>🛑</span>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#DC2626", margin: 0 }}>
              Confirm Account Deletion
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "#F1F5F9",
              border: "none",
              borderRadius: "8px",
              padding: "6px 12px",
              cursor: "pointer",
              fontWeight: 700,
              color: "#64748B",
            }}
          >
            ✕
          </button>
        </div>

        <p style={{ fontSize: "0.9rem", color: "#475569", lineHeight: 1.5, marginBottom: "16px" }}>
          You are requesting to permanently hard-delete <strong>"{targetName}"</strong> ({targetType}) from the database.
        </p>

        {statusMsg && (
          <div
            style={{
              background: "#FEF3C7",
              color: "#92400E",
              padding: "10px 14px",
              borderRadius: "8px",
              fontSize: "0.85rem",
              fontWeight: 600,
              marginBottom: "16px",
              border: "1px solid #FCD34D",
            }}
          >
            {statusMsg}
          </div>
        )}

        {error && (
          <div
            style={{
              background: "#FEF2F2",
              color: "#DC2626",
              padding: "10px 14px",
              borderRadius: "8px",
              fontSize: "0.85rem",
              fontWeight: 600,
              marginBottom: "16px",
              border: "1px solid #FCA5A5",
            }}
          >
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleConfirmDelete} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
              Enter 6-Digit Deletion OTP
            </label>
            <input
              type="text"
              required
              maxLength={6}
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "2px solid #CBD5E1",
                fontSize: "1.2rem",
                letterSpacing: "4px",
                textAlign: "center",
                fontWeight: "bold",
                outline: "none",
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button
              type="button"
              onClick={sendDeletionOtp}
              disabled={isSendingOtp}
              style={{
                background: "none",
                border: "none",
                color: "#2563EB",
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              {isSendingOtp ? "Resending OTP..." : "Resend OTP"}
            </button>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "10px 16px",
                borderRadius: "8px",
                border: "1px solid #CBD5E1",
                background: "#FFFFFF",
                cursor: "pointer",
                fontWeight: 600,
                color: "#475569",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isDeleting || otp.length !== 6}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                background: isDeleting || otp.length !== 6 ? "#EF444480" : "#DC2626",
                color: "#FFFFFF",
                border: "none",
                cursor: isDeleting || otp.length !== 6 ? "not-allowed" : "pointer",
                fontWeight: 700,
              }}
            >
              {isDeleting ? "Verifying & Deleting..." : "Verify OTP & Delete"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
