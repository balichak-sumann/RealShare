"use client";
import React, { useState, useRef } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import AdminLayout from "@/components/layout/AdminLayout";
import styles from "../properties/Properties.module.css";

interface Banner {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  imageUrl: string;
  targetLink: string;
  isActive: boolean;
  order: number;
}

const initialBanners: Banner[] = [
  {
    id: "BAN-01",
    title: "Commercial High-Yield Opportunities",
    subtitle: "Earn up to 9.2% Net Assured Rental Yield with Grade-A IT Parks in Hyderabad",
    badge: "Featured Opportunity",
    imageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=280&fit=crop",
    targetLink: "/properties/PROP-102",
    isActive: true,
    order: 1,
  },
  {
    id: "BAN-02",
    title: "Goa Luxury Holiday Villas",
    subtitle: "Co-own beachfront vacation villas and earn quarterly rental dividends + stay perks",
    badge: "Trending in August",
    imageUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&h=280&fit=crop",
    targetLink: "/properties/PROP-101",
    isActive: true,
    order: 2,
  },
  {
    id: "BAN-03",
    title: "Zero-Brokerage Home Loans Tie-up",
    subtitle: "Exclusive instant approvals with HDFC and SBI for RealShare fraction co-owners",
    badge: "Financial Services",
    imageUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&h=280&fit=crop",
    targetLink: "/services",
    isActive: true,
    order: 3,
  },
];

export default function CMSPage() {
  const [banners, setBanners] = useState<Banner[]>(initialBanners);
  const [showAddBanner, setShowAddBanner] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [newBan, setNewBan] = useState({
    title: "",
    subtitle: "",
    badge: "Special Promo",
    targetLink: "/properties",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleToggleBanner = (id: string) => {
    setBanners((prev) =>
      prev.map((b) => (b.id === id ? { ...b, isActive: !b.isActive } : b))
    );
    showToast("Banner visibility toggled.");
  };

  const handleAddBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBan.title) return;
    
    setIsUploading(true);
    let finalImageUrl = "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&h=280&fit=crop";

    try {
      if (selectedFile) {
        const storageRef = ref(storage, `banners/${Date.now()}_${selectedFile.name}`);
        await uploadBytes(storageRef, selectedFile);
        finalImageUrl = await getDownloadURL(storageRef);
      }

      const created: Banner = {
        id: `BAN-${Math.floor(10 + Math.random() * 90)}`,
        title: newBan.title,
        subtitle: newBan.subtitle,
        badge: newBan.badge,
        imageUrl: finalImageUrl,
        targetLink: newBan.targetLink,
        isActive: true,
        order: banners.length + 1,
      };

      setBanners([...banners, created]);
      setShowAddBanner(false);
      setSelectedFile(null);
      setNewBan({ ...newBan, title: "", subtitle: "" });
      showToast(`Banner "${created.title}" published to Mobile App & Web hero carousels!`);
    } catch (error) {
      console.error("Error uploading banner image:", error);
      showToast("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AdminLayout title="Content Management & Promotional Banners">
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

      {/* Header controls */}
      <div className={styles.header}>
        <div className={styles.title}>Mobile App & Web Hero Banners ({banners.length})</div>
        <div className={styles.headerRight}>
          <button className={styles.addButton} onClick={() => setShowAddBanner(true)}>
            + Add Promotional Banner
          </button>
        </div>
      </div>

      {/* Banners Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "20px",
          marginBottom: "36px",
        }}
      >
        {banners.map((ban) => (
          <div
            key={ban.id}
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
              borderRadius: "14px",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
            }}
          >
            <div style={{ position: "relative", height: "160px" }}>
              <img
                src={ban.imageUrl}
                alt={ban.title}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <span
                style={{
                  position: "absolute",
                  top: 12,
                  left: 12,
                  background: "rgba(15, 23, 42, 0.8)",
                  backdropFilter: "blur(4px)",
                  color: "#fff",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                }}
              >
                {ban.badge}
              </span>
            </div>

            <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "6px" }}>
                {ban.title}
              </h3>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", flex: 1, lineHeight: "1.4" }}>
                {ban.subtitle}
              </p>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: "14px",
                  paddingTop: "12px",
                  borderTop: "1px solid var(--border-color)",
                }}
              >
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: ban.isActive ? "#16A34A" : "#64748B",
                  }}
                >
                  {ban.isActive ? "● Live on Apps" : "○ Hidden"}
                </span>
                <button
                  onClick={() => handleToggleBanner(ban.id)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "6px",
                    border: "1px solid var(--border-color)",
                    background: "#fff",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {ban.isActive ? "Hide" : "Activate"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Banner Modal */}
      {showAddBanner && (
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
              maxWidth: "540px",
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
                Add Promotional Banner
              </h2>
              <button
                onClick={() => setShowAddBanner(false)}
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

            <form onSubmit={handleAddBanner} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>Banner Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Special Holiday Yield Offer"
                  value={newBan.title}
                  onChange={(e) => setNewBan({ ...newBan, title: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1", marginTop: "4px" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>Subtitle / Caption</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Co-own luxury suites in Hyderabad and Goa"
                  value={newBan.subtitle}
                  onChange={(e) => setNewBan({ ...newBan, subtitle: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1", marginTop: "4px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>Tag / Badge</label>
                  <input
                    type="text"
                    required
                    value={newBan.badge}
                    onChange={(e) => setNewBan({ ...newBan, badge: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1", marginTop: "4px" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>Target Link / Route</label>
                  <input
                    type="text"
                    required
                    value={newBan.targetLink}
                    onChange={(e) => setNewBan({ ...newBan, targetLink: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1", marginTop: "4px" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>Banner Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                    }
                  }}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1", marginTop: "4px" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "14px" }}>
                <button
                  type="button"
                  onClick={() => setShowAddBanner(false)}
                  style={{ padding: "10px 16px", borderRadius: "8px", border: "1px solid #CBD5E1", background: "#fff", cursor: "pointer", fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  style={{ padding: "10px 24px", borderRadius: "8px", background: "#2563EB", color: "#fff", border: "none", cursor: isUploading ? "not-allowed" : "pointer", fontWeight: 700 }}
                >
                  {isUploading ? "Uploading..." : "Publish Banner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
