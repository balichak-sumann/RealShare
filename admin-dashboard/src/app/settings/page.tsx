"use client";
import React, { useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const sectionStyle: React.CSSProperties = {
    background: "var(--bg-secondary)",
    border: "1px solid var(--border-color)",
    borderRadius: 16,
    padding: 28,
    marginBottom: 24,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "1rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    marginBottom: 20,
    paddingBottom: 12,
    borderBottom: "1px solid var(--border-color)",
  };

  const fieldStyle: React.CSSProperties = {
    marginBottom: 20,
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "var(--text-secondary)",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    border: "1px solid var(--border-color)",
    borderRadius: 8,
    background: "var(--bg-tertiary)",
    color: "var(--text-primary)",
    fontSize: "0.9rem",
    fontFamily: "inherit",
    outline: "none",
  };

  const toggleRow: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 0",
    borderBottom: "1px solid var(--border-color)",
  };

  return (
    <AdminLayout title="Platform Settings">
      {saved && (
        <div style={{ background: "#16A34A", color: "#fff", padding: "12px 20px", borderRadius: 10, marginBottom: 20, fontWeight: 600, fontSize: "0.85rem" }}>
          ✅ Settings saved successfully!
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div>
          <div style={sectionStyle}>
            <div style={titleStyle}>🏢 Platform Configuration</div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Platform Name</label>
              <input type="text" style={inputStyle} defaultValue="RealShare" />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Support Email</label>
              <input type="text" style={inputStyle} defaultValue="support@realshare.in" />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Support Phone</label>
              <input type="text" style={inputStyle} defaultValue="+91 1800 123 4567" />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Default Currency</label>
              <select style={inputStyle} defaultValue="INR">
                <option value="INR">₹ INR (Indian Rupee)</option>
                <option value="USD">$ USD (US Dollar)</option>
                <option value="AED">د.إ AED (Dirham)</option>
              </select>
            </div>
          </div>

          <div style={sectionStyle}>
            <div style={titleStyle}>🔐 Security & Compliance</div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Min. KYC Verification Level</label>
              <select style={inputStyle} defaultValue="Full">
                <option>Basic (PAN Only)</option>
                <option>Full (PAN + Aadhaar)</option>
                <option>Enhanced (PAN + Aadhaar + Video)</option>
              </select>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Admin Session Timeout (minutes)</label>
              <input type="number" style={inputStyle} defaultValue="30" />
            </div>
          </div>
        </div>

        <div>
          <div style={sectionStyle}>
            <div style={titleStyle}>⚡ Feature Toggles</div>
            <div style={toggleRow}>
              <div>
                <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.9rem" }}>Secondary Marketplace</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: 2 }}>Allow investors to trade fractions with each other</div>
              </div>
              <input type="checkbox" defaultChecked style={{ width: 20, height: 20, accentColor: "#2563EB" }} />
            </div>
            <div style={toggleRow}>
              <div>
                <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.9rem" }}>Holiday Booking Module</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: 2 }}>Let fraction owners book stays at holiday properties</div>
              </div>
              <input type="checkbox" style={{ width: 20, height: 20, accentColor: "#2563EB" }} />
            </div>
            <div style={toggleRow}>
              <div>
                <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.9rem" }}>Auto Yield Distribution</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: 2 }}>Automatically credit yield payouts to investor wallets</div>
              </div>
              <input type="checkbox" defaultChecked style={{ width: 20, height: 20, accentColor: "#2563EB" }} />
            </div>
            <div style={{ ...toggleRow, borderBottom: "none" }}>
              <div>
                <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.9rem" }}>Virtual Property Tours</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: 2 }}>Enable 360° virtual tours for listed properties</div>
              </div>
              <input type="checkbox" defaultChecked style={{ width: 20, height: 20, accentColor: "#2563EB" }} />
            </div>
          </div>

          <div style={sectionStyle}>
            <div style={titleStyle}>📊 Notifications</div>
            <div style={toggleRow}>
              <div>
                <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.9rem" }}>Email Alerts for New Investments</div>
              </div>
              <input type="checkbox" defaultChecked style={{ width: 20, height: 20, accentColor: "#2563EB" }} />
            </div>
            <div style={toggleRow}>
              <div>
                <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.9rem" }}>SMS Alerts for KYC Updates</div>
              </div>
              <input type="checkbox" style={{ width: 20, height: 20, accentColor: "#2563EB" }} />
            </div>
            <div style={{ ...toggleRow, borderBottom: "none" }}>
              <div>
                <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.9rem" }}>Weekly Summary Report</div>
              </div>
              <input type="checkbox" defaultChecked style={{ width: 20, height: 20, accentColor: "#2563EB" }} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 8 }}>
        <button style={{ padding: "12px 24px", borderRadius: 10, border: "1px solid var(--border-color)", color: "var(--text-secondary)", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer", background: "var(--bg-secondary)" }}>Cancel</button>
        <button onClick={handleSave} style={{ padding: "12px 32px", borderRadius: 10, background: "#2563EB", color: "#fff", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", border: "none", boxShadow: "0 4px 12px rgba(37,99,235,0.3)" }}>Save Settings</button>
      </div>
    </AdminLayout>
  );
}
