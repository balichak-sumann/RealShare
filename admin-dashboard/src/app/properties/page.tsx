"use client";
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import AdminLayout from "@/components/layout/AdminLayout";
import { getAuthHeader } from "@/lib/api-auth";
import styles from "./Properties.module.css";

// Dynamic import to avoid SSR issues with Leaflet
const LocationPicker = dynamic(() => import("@/components/LocationPicker"), {
  ssr: false,
  loading: () => (
    <div style={{ height: "280px", borderRadius: "12px", background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", color: "#94A3B8" }}>
      Loading map...
    </div>
  ),
});

interface Property {
  id: string;
  title: string;
  state: string;
  district: string;
  locality: string;
  property_type: string;
  total_fractions: number;
  sold_fractions: number;
  available_fractions: number;
  price_per_fraction: string | number;
  booking_amount: string | number;
  assured_yield: string | number;
  target_irr: string | number;
  images?: any[];
  approval_status: string;
  listing_type?: string;
  profile?: { full_name: string; role: string } | null;
  postedBy?: string;
  builderContact?: string;
  videoUrl?: string;
  raised?: string;
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusTab, setStatusTab] = useState<"All" | "Pending Approval" | "Active" | "Sold Out">("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/properties')
      .then(res => res.json())
      .then(data => {
        setProperties(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch properties:', err);
        setLoading(false);
      });
  }, []);

  // New Property Form State
  const [newProp, setNewProp] = useState({
    title: "",
    state: "Telangana",
    district: "Hyderabad",
    locality: "",
    type: "Commercial" as const,
    listingType: "fractional" as "fractional" | "outright" | "rental" | "resale",
    totalFractions: 50,
    price: 500000,
    yield: 8.5,
    irr: 15.0,
    postedBy: "Admin" as const,
  });
  // Helper to extract lat/lng from a Google Maps share link
  const parseGoogleMapsUrl = (url: string) => {
    try {
      // Examples:
      // https://www.google.com/maps/@17.385,78.4867,15z
      // https://www.google.com/maps/place/.../@17.385,78.4867,17z
      const match = url.match(/@([-\d.]+),([-\d.]+)[,/]?/);
      if (match) {
        return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
      }
      // Fallback: look for "q=lat,lng"
      const qMatch = url.match(/[?&]q=([-\d.]+),([-\d.]+)/);
      if (qMatch) {
        return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  };
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [mapLat, setMapLat] = useState(17.385);
  const [mapLng, setMapLng] = useState(78.4867);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleApproveProperty = async (id: string) => {
    try {
      const authHeader = await getAuthHeader();
      if (!authHeader) { showToast('You must be signed in to do that.'); return; }
      const res = await fetch(`/api/properties/${id}`, {
        method: 'PATCH',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ approval_status: 'approved' })
      });
      if (res.ok) {
        setProperties((prev) => prev.map((p) => (p.id === id ? { ...p, approval_status: "approved" } : p)));
        showToast(`Property ${id} approved and listed live on Web & Mobile Apps!`);
      }
    } catch(e) {}
  };

  const handleRejectProperty = async (id: string) => {
    try {
      const authHeader = await getAuthHeader();
      if (!authHeader) { showToast('You must be signed in to do that.'); return; }
      const res = await fetch(`/api/properties/${id}`, {
        method: 'PATCH',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ approval_status: 'rejected' })
      });
      if (res.ok) {
        setProperties((prev) => prev.map((p) => (p.id === id ? { ...p, approval_status: "rejected" } : p)));
        showToast(`Property ${id} submission rejected.`);
      }
    } catch(e) {}
  };

  const handleDeleteProperty = async (id: string) => {
    if (confirm("Are you sure you want to delete this property listing? This action cannot be undone.")) {
      try {
        const authHeader = await getAuthHeader();
        if (!authHeader) { showToast('You must be signed in to do that.'); return; }
        const res = await fetch(`/api/properties/${id}`, {
          method: 'DELETE',
          headers: authHeader
        });
        if (res.ok) {
          setProperties((prev) => prev.filter((p) => p.id !== id));
          showToast(`Property ${id} removed successfully by Admin.`);
        }
      } catch(e) {}
    }
  };

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProp.title || !newProp.locality) {
      alert("Please fill in the title and locality.");
      return;
    }
    
    setIsUploading(true);
    const uploadedImageUrls: string[] = [];
    let videoUrl = "";

    try {
      // Upload all selected images
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          try {
            const storageRef = ref(storage, `properties/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            uploadedImageUrls.push(url);
          } catch (storageError) {
            console.warn("Firebase Storage upload failed. Falling back to Base64 (PostgreSQL text insertion).", storageError);
            const base64Str = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
            uploadedImageUrls.push(base64Str);
          }
        }
      }
      if (uploadedImageUrls.length === 0) {
        uploadedImageUrls.push("https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=250&fit=crop");
      }

      // Upload video if selected
      if (selectedVideo) {
        try {
          const videoRef = ref(storage, `properties/videos/${Date.now()}_${selectedVideo.name}`);
          await uploadBytes(videoRef, selectedVideo);
          videoUrl = await getDownloadURL(videoRef);
        } catch (storageError) {
          console.warn("Firebase Storage upload failed. Falling back to Base64 (PostgreSQL text insertion).", storageError);
          const base64Str = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(selectedVideo);
          });
          videoUrl = base64Str;
        }
      }

      const authHeader = await getAuthHeader();
      if (!authHeader) { alert('You must be signed in to do that.'); setIsUploading(false); return; }
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newProp.title,
          state: newProp.state,
          district: newProp.district,
          locality: newProp.locality,
          property_type: newProp.type,
          listing_type: newProp.listingType,
          total_fractions: newProp.listingType === "fractional" ? Number(newProp.totalFractions) : 1,
          available_fractions: newProp.listingType === "fractional" ? Number(newProp.totalFractions) : 1,
          price_per_fraction: Number(newProp.price),
          booking_amount: Math.round(Number(newProp.price) * 0.1),
          assured_yield: Number(newProp.yield),
          target_irr: Number(newProp.irr),
          featured: false,
          image_url: uploadedImageUrls[0],
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save property to the database');
      }
      const created = await res.json();

      setProperties([created, ...properties]);
      setShowAddModal(false);
      setSelectedFiles([]);
      setSelectedVideo(null);
      setNewProp({ ...newProp, title: "", locality: "" });
      showToast(`Property "${created.title}" successfully added with ${uploadedImageUrls.length} images${videoUrl ? ' and 1 video' : ''}.`);
    } catch (error) {
      console.error("Error uploading property media:", error);
      showToast("Failed to upload media. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const totalFractionsPool = properties.reduce((sum, p) => sum + (Number(p.total_fractions) || 0), 0);
  const totalSoldFractions = properties.reduce((sum, p) => sum + (Number(p.sold_fractions) || 0), 0);
  const totalAvailableFractions = properties.reduce((sum, p) => sum + (Number(p.available_fractions) || 0), 0);
  const pendingSubmissionsCount = properties.filter((p) => p.approval_status === "pending_approval").length;

  return (
    <AdminLayout title="Property & Share Pool Management">
      {/* Toast */}
      {toastMessage && (
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
          <span>✓ {toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
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

      {/* Share Pool Analytics Cards (Work Order 3.3 Requirement) */}
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
          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase" }}>
            Total Share Pool
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "6px", color: "var(--text-primary)" }}>
            {totalFractionsPool} Fractions
          </div>
          <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: 4 }}>
            Across {properties.length} Properties
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
          <div style={{ fontSize: "0.75rem", color: "#16A34A", fontWeight: 600, textTransform: "uppercase" }}>
            Sold Fractions
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "6px", color: "#16A34A" }}>
            {totalSoldFractions} Fractions
          </div>
          <div style={{ fontSize: "0.75rem", color: "#16A34A", marginTop: 4 }}>
            {((totalSoldFractions / totalFractionsPool) * 100).toFixed(1)}% Fractional Capital Raised
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
          <div style={{ fontSize: "0.75rem", color: "#2563EB", fontWeight: 600, textTransform: "uppercase" }}>
            Available Fractions
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "6px", color: "#2563EB" }}>
            {totalAvailableFractions} Fractions
          </div>
          <div style={{ fontSize: "0.75rem", color: "#2563EB", marginTop: 4 }}>
            Open for Investor Bookings
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
          <div style={{ fontSize: "0.75rem", color: "#D97706", fontWeight: 600, textTransform: "uppercase" }}>
            Builder Postings Queue
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "6px", color: "#D97706" }}>
            {pendingSubmissionsCount} Pending
          </div>
          <div style={{ fontSize: "0.75rem", color: "#D97706", marginTop: 4 }}>
            Awaiting Admin Review & Approval
          </div>
        </div>
      </div>

      {/* Graphical Share Distribution Progress Bar */}
      <div
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-color)",
          borderRadius: "12px",
          padding: "16px 20px",
          marginBottom: "28px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "0.85rem", fontWeight: 600 }}>
          <span>Fractional Share Allocation Visualizer</span>
          <span>
            Sold: <strong style={{ color: "#16A34A" }}>{totalSoldFractions}</strong> | Available:{" "}
            <strong style={{ color: "#2563EB" }}>{totalAvailableFractions}</strong>
          </span>
        </div>
        <div style={{ height: "14px", width: "100%", background: "#E2E8F0", borderRadius: "7px", overflow: "hidden", display: "flex" }}>
          <div
            style={{
              width: `${(totalSoldFractions / totalFractionsPool) * 100}%`,
              background: "linear-gradient(90deg, #10B981, #059669)",
            }}
            title={`Sold: ${totalSoldFractions}`}
          />
          <div
            style={{
              width: `${(totalAvailableFractions / totalFractionsPool) * 100}%`,
              background: "linear-gradient(90deg, #3B82F6, #2563EB)",
            }}
            title={`Available: ${totalAvailableFractions}`}
          />
        </div>
      </div>

      {/* Main Table Controls */}
      <div className={styles.header}>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            className={`${styles.filterPill} ${statusTab === "All" ? styles.filterActive : ""}`}
            onClick={() => setStatusTab("All")}
          >
            All Listings ({properties.length})
          </button>
          <button
            className={`${styles.filterPill} ${statusTab === "Pending Approval" ? styles.filterActive : ""}`}
            onClick={() => setStatusTab("Pending Approval")}
            style={{
              borderColor: statusTab === "Pending Approval" ? "#F59E0B" : "var(--border-color)",
              color: statusTab === "Pending Approval" ? "#B45309" : "inherit",
              background: statusTab === "Pending Approval" ? "#FEF3C7" : "transparent",
            }}
          >
            ⚡ Builder Submissions ({pendingSubmissionsCount})
          </button>
          <button
            className={`${styles.filterPill} ${statusTab === "Active" ? styles.filterActive : ""}`}
            onClick={() => setStatusTab("Active")}
          >
            Active
          </button>
          <button
            className={`${styles.filterPill} ${statusTab === "Sold Out" ? styles.filterActive : ""}`}
            onClick={() => setStatusTab("Sold Out")}
          >
            Sold Out
          </button>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.filterGroup}>
            {["All", "Commercial", "Fractional", "Residential", "Holiday", "Investor"].map((t) => (
              <button
                key={t}
                className={`${styles.filterPill} ${typeFilter === t ? styles.filterActive : ""}`}
                onClick={() => setTypeFilter(t)}
              >
                {t}
              </button>
            ))}
          </div>
          <button className={styles.addButton} onClick={() => setShowAddModal(true)}>
            + Post Property (Admin)
          </button>
        </div>
      </div>

      <div className={styles.searchBar}>
        <span>🔍</span>
        <input
          type="text"
          placeholder="Search properties by title, district, locality, or builder..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Properties Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Property & Location</th>
              <th className={styles.th}>Type</th>
              <th className={styles.th}>Posted By</th>
              <th className={styles.th}>Share Pool (Sold / Total)</th>
              <th className={styles.th}>Price / Frac</th>
              <th className={styles.th}>Yield / IRR</th>
              <th className={styles.th}>Status</th>
              <th className={styles.th}>Admin Actions</th>
            </tr>
          </thead>
          <tbody>
            {properties
            .filter((p) => {
              if (statusTab !== "All" && p.approval_status !== statusTab) return false;
              if (typeFilter !== "All" && p.property_type !== typeFilter) return false;
              if (
                search &&
                !p.title.toLowerCase().includes(search.toLowerCase()) &&
                !p.locality.toLowerCase().includes(search.toLowerCase())
              ) {
                return false;
              }
              return true;
            })
            .map((p) => (
              <tr key={p.id} className={styles.tr}>
                <td className={styles.td}>
                  <div className={styles.propCell}>
                    <img src={p.images?.[0]?.image_url || 'https://via.placeholder.com/150'} alt={p.title} className={styles.propThumb} />
                    <div>
                      <div className={styles.propTitle}>{p.title}</div>
                      <div className={styles.propLocation}>
                        {p.locality}, {p.district}
                      </div>
                    </div>
                  </div>
                </td>
                <td className={styles.td}>
                  <span
                    className={`${styles.badge} ${
                      p.property_type === "Holiday"
                        ? styles.badgeHoliday
                        : p.property_type === "Commercial"
                        ? styles.badgeCommercial
                        : styles.badgeInternational
                    }`}
                  >
                    {p.property_type}
                  </span>
                </td>
                <td className={styles.td}>
                  <strong>
                    {p.profile?.role
                      ? p.profile.role === "admin"
                        ? "Admin"
                        : p.profile.role.charAt(0).toUpperCase() + p.profile.role.slice(1)
                      : p.postedBy || "Admin"}
                  </strong>
                  {p.profile?.full_name && (
                    <div style={{ fontSize: "0.7rem", color: "#64748B" }}>
                      {p.profile.full_name}
                    </div>
                  )}
                  {p.builderContact && (
                    <div style={{ fontSize: "0.7rem", color: "#64748B" }}>
                      {p.builderContact}
                    </div>
                  )}
                </td>
                <td className={styles.td}>
                  {(p.listing_type || "fractional") !== "fractional" ? (
                    <span
                      className={styles.badge}
                      style={{ 
                        background: p.listing_type === "rental" ? "#DCFCE7" : p.listing_type === "resale" ? "#FEF9C3" : "#EDE9FE", 
                        color: p.listing_type === "rental" ? "#166534" : p.listing_type === "resale" ? "#854D0E" : "#6D28D9" 
                      }}
                    >
                      {(p.listing_type || "outright").charAt(0).toUpperCase() + (p.listing_type || "outright").slice(1)} · Whole Property
                    </span>
                  ) : (
                    <div className={styles.fractionCell}>
                      <span style={{ fontWeight: 600 }}>
                        {p.sold_fractions} sold / {p.available_fractions} avail ({p.total_fractions} total)
                      </span>
                      <div className={styles.miniProgress}>
                        <div
                          className={styles.miniFill}
                          style={{
                            width: `${(p.sold_fractions / p.total_fractions) * 100}%`,
                            backgroundColor:
                              p.available_fractions === 0 ? "#DC2626" : "#16A34A",
                          }}
                        />
                      </div>
                    </div>
                  )}
                </td>
                <td className={styles.td}>
                  <strong>₹{Number(p.price_per_fraction).toLocaleString("en-IN")}</strong>
                  <div style={{ fontSize: "0.7rem", color: "#64748B" }}>
                    {p.listing_type === "outright"
                      ? "Full property price"
                      : `Booking: ₹${Number(p.booking_amount).toLocaleString("en-IN")}`}
                  </div>
                </td>
                <td className={styles.td}>
                  <span className={styles.yieldVal}>{p.assured_yield}% Yield</span>
                  <div style={{ fontSize: "0.7rem", color: "#7C3AED", fontWeight: 600 }}>
                    {p.target_irr}% IRR
                  </div>
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
                        p.approval_status === "approved"
                          ? "#DCFCE7"
                          : p.approval_status === "sold_out"
                          ? "#FEF2F2"
                          : p.approval_status === "rejected"
                          ? "#FEE2E2"
                          : "#FEF9C3",
                      color:
                        p.approval_status === "approved"
                          ? "#166534"
                          : p.approval_status === "sold_out"
                          ? "#991B1B"
                          : p.approval_status === "rejected"
                          ? "#991B1B"
                          : "#854D0E",
                    }}
                  >
                    {p.approval_status}
                  </span>
                </td>
                <td className={styles.td}>
                  <div className={styles.actions}>
                    {p.approval_status === "pending_approval" ? (
                      <>
                        <button
                          className={styles.actionBtnGreen}
                          onClick={() => handleApproveProperty(p.id)}
                        >
                          Approve
                        </button>
                        <button
                          className={styles.actionBtnRed}
                          onClick={() => handleRejectProperty(p.id)}
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <span className={styles.noAction}>-</span>
                    )}
                    <button
                      onClick={() => setSelectedProperty(p as any)}
                      className={styles.viewBtn}
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDeleteProperty(p.id)}
                      className={styles.deleteBtn}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add New Property Modal */}
      {showAddModal && (
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
              maxWidth: "650px",
              maxHeight: "90vh",
              overflowY: "auto",
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
              <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0F172A" }}>
                Add New Property Listing
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
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

            <form onSubmit={handleCreateProperty} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>Property Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Phoenix One Commercial Suites"
                  value={newProp.title}
                  onChange={(e) => setNewProp({ ...newProp, title: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1", marginTop: "4px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>State</label>
                  <input
                    type="text"
                    required
                    value={newProp.state}
                    onChange={(e) => setNewProp({ ...newProp, state: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1", marginTop: "4px" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>District / City</label>
                  <input
                    type="text"
                    required
                    value={newProp.district}
                    onChange={(e) => setNewProp({ ...newProp, district: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1", marginTop: "4px" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>Locality</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nizampet / Madhapur"
                    value={newProp.locality}
                    onChange={(e) => setNewProp({ ...newProp, locality: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1", marginTop: "4px" }}
                  />
                </div>
              </div>

              {/* Interactive Map Location Picker */}
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569", marginBottom: "8px", display: "block" }}>
                  📍 Pin Property Location on Map
                </label>
                <div style={{ fontSize: "0.75rem", color: "#94A3B8", marginBottom: "8px" }}>
                  Search for an address or click directly on the map to drop a pin
                </div>
                <LocationPicker
                  lat={mapLat}
                  lng={mapLng}
                  onLocationChange={(lat, lng, address) => {
                    setMapLat(lat);
                    setMapLng(lng);
                    // Auto-fill locality from reverse geocode if available
                    if (address) {
                      const parts = address.split(",").map((s: string) => s.trim());
                      if (parts.length >= 3) {
                        setNewProp(prev => ({
                          ...prev,
                          locality: parts[0] + (parts[1] ? ", " + parts[1] : ""),
                        }));
                      }
                    }
                  }}
                />
                {/* Google Maps link importer */}
                <div style={{ marginTop: "12px", display: "flex", gap: "8px", alignItems: "center" }}>
                  <input
                    type="text"
                    placeholder="Paste Google Maps share link"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const url = (e.target as HTMLInputElement).value.trim();
                        const parsed = parseGoogleMapsUrl(url);
                        if (parsed) {
                          setMapLat(parsed.lat);
                          setMapLng(parsed.lng);
                        } else {
                          alert("Could not extract coordinates from the link.");
                        }
                      }
                    }}
                    style={{ flex: 1, padding: "6px 10px", borderRadius: "6px", border: "1px solid #E2E8F0", fontSize: "0.85rem" }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const link = `https://www.google.com/maps/search/?api=1&query=${mapLat},${mapLng}`;
                      window.open(link, "_blank");
                    }}
                    style={{ padding: "6px 12px", background: "#2563EB", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}
                  >
                    Open in Google Maps
                  </button>
                </div>
                <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "#94A3B8" }}>Latitude</label>
                    <input
                      type="text"
                      readOnly
                      value={mapLat.toFixed(6)}
                      style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #E2E8F0", fontSize: "0.8rem", color: "#475569", background: "#F8FAFC" }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "#94A3B8" }}>Longitude</label>
                    <input
                      type="text"
                      readOnly
                      value={mapLng.toFixed(6)}
                      style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #E2E8F0", fontSize: "0.8rem", color: "#475569", background: "#F8FAFC" }}
                    />
                  </div>
                </div>              </div>

              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>Listing Type</label>
                <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                  {(["fractional", "outright", "rental", "resale"] as const).map((lt) => (
                    <button
                      key={lt}
                      type="button"
                      onClick={() => setNewProp({ ...newProp, listingType: lt })}
                      style={{
                        flex: 1,
                        padding: "10px",
                        borderRadius: "8px",
                        border: newProp.listingType === lt ? "2px solid #2563EB" : "1px solid #CBD5E1",
                        background: newProp.listingType === lt ? "#EFF6FF" : "#FFFFFF",
                        color: newProp.listingType === lt ? "#1D4ED8" : "#475569",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {lt === "fractional" ? "Fractional (shares)" : lt === "outright" ? "Outright (whole)" : lt === "rental" ? "Rental" : "Resale"}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>Property Type</label>
                  <select
                    value={newProp.type}
                    onChange={(e) => setNewProp({ ...newProp, type: e.target.value as any })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1", marginTop: "4px" }}
                  >
                    <option value="Commercial">Commercial</option>
                    <option value="Fractional">Fractional</option>
                    <option value="Residential">Residential</option>
                    <option value="Holiday">Holiday</option>
                    <option value="Investor">Investor</option>
                  </select>
                </div>
                {newProp.listingType === "fractional" && (
                  <div>
                    <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>Total Fractions</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={newProp.totalFractions}
                      onChange={(e) => setNewProp({ ...newProp, totalFractions: Number(e.target.value) })}
                      style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1", marginTop: "4px" }}
                    />
                  </div>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>
                    {newProp.listingType === "fractional" ? "Price Per Fraction (₹)" : newProp.listingType === "rental" ? "Monthly Rent (₹)" : "Total Asking Price (₹)"}
                  </label>
                  <input
                    type="number"
                    required
                    min={1000}
                    value={newProp.price}
                    onChange={(e) => setNewProp({ ...newProp, price: Number(e.target.value) })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1", marginTop: "4px" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>Assured Yield (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newProp.yield}
                    onChange={(e) => setNewProp({ ...newProp, yield: Number(e.target.value) })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1", marginTop: "4px" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>Target IRR (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newProp.irr}
                    onChange={(e) => setNewProp({ ...newProp, irr: Number(e.target.value) })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1", marginTop: "4px" }}
                  />
                </div>
              </div>

              {/* Property Images - Bulk Upload */}
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569", marginBottom: "6px", display: "block" }}>Property Images</label>
                <div
                  style={{
                    border: "2px dashed #CBD5E1",
                    borderRadius: "12px",
                    padding: "20px",
                    textAlign: "center",
                    background: "#F8FAFC",
                    cursor: "pointer",
                    transition: "border-color 0.2s",
                  }}
                  onClick={() => document.getElementById('multi-image-input')?.click()}
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#2563EB'; }}
                  onDragLeave={(e) => { e.currentTarget.style.borderColor = '#CBD5E1'; }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.borderColor = '#CBD5E1';
                    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
                    setSelectedFiles(prev => [...prev, ...files]);
                  }}
                >
                  <div style={{ fontSize: "2rem", marginBottom: "6px" }}>📸</div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#475569" }}>Click or drag & drop to upload images</div>
                  <div style={{ fontSize: "0.75rem", color: "#94A3B8", marginTop: "4px" }}>Supports JPG, PNG, WEBP • Upload multiple at once</div>
                  <input
                    id="multi-image-input"
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: "none" }}
                    onChange={(e) => {
                      if (e.target.files) {
                        setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                      }
                    }}
                  />
                </div>
                {/* Preview thumbnails */}
                {selectedFiles.length > 0 && (
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "12px" }}>
                    {selectedFiles.map((file, idx) => (
                      <div key={idx} style={{ position: "relative", width: "80px", height: "80px", borderRadius: "8px", overflow: "hidden", border: "2px solid #E2E8F0" }}>
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${idx + 1}`}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                        <button
                          type="button"
                          onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))}
                          style={{
                            position: "absolute", top: "2px", right: "2px",
                            width: "20px", height: "20px", borderRadius: "50%",
                            background: "rgba(220, 38, 38, 0.9)", color: "#fff",
                            border: "none", cursor: "pointer", fontSize: "12px",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            lineHeight: 1,
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: "6px" }}>
                  {selectedFiles.length} image{selectedFiles.length !== 1 ? 's' : ''} selected
                </div>
              </div>

              {/* Video Upload */}
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569", marginBottom: "6px", display: "block" }}>Property Video (Optional)</label>
                <div
                  style={{
                    border: "2px dashed #CBD5E1",
                    borderRadius: "12px",
                    padding: "16px",
                    textAlign: "center",
                    background: "#F8FAFC",
                    cursor: "pointer",
                    transition: "border-color 0.2s",
                  }}
                  onClick={() => document.getElementById('video-input')?.click()}
                >
                  <div style={{ fontSize: "1.5rem", marginBottom: "4px" }}>🎬</div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#475569" }}>
                    {selectedVideo ? selectedVideo.name : "Click to upload a walkthrough video"}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#94A3B8", marginTop: "4px" }}>Supports MP4, MOV, WEBM • Max 100MB</div>
                  <input
                    id="video-input"
                    type="file"
                    accept="video/*"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedVideo(e.target.files[0]);
                      }
                    }}
                  />
                </div>
                {selectedVideo && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
                    <span style={{ fontSize: "0.8rem", color: "#16A34A", fontWeight: 600 }}>✓ {selectedVideo.name} ({(selectedVideo.size / 1024 / 1024).toFixed(1)} MB)</span>
                    <button
                      type="button"
                      onClick={() => setSelectedVideo(null)}
                      style={{ background: "none", border: "none", color: "#DC2626", cursor: "pointer", fontWeight: 700, fontSize: "0.8rem" }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: "10px 16px", borderRadius: "8px", border: "1px solid #CBD5E1", background: "#fff", cursor: "pointer", fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  style={{ padding: "10px 24px", borderRadius: "8px", background: "#2563EB", color: "#fff", border: "none", cursor: isUploading ? "not-allowed" : "pointer", fontWeight: 700 }}
                >
                  {isUploading ? `Uploading ${selectedFiles.length} image${selectedFiles.length !== 1 ? 's' : ''}${selectedVideo ? ' + video' : ''}...` : "Publish Property Listing"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
