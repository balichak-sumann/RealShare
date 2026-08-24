"use client";
import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import styles from "./Properties.module.css";

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
    totalFractions: 50,
    price: 500000,
    yield: 8.5,
    irr: 15.0,
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=250&fit=crop",
    postedBy: "Admin" as const,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleApproveProperty = (id: string) => {
    setProperties((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "Active" } : p))
    );
    showToast(`Property ${id} approved and listed live on Web & Mobile Apps!`);
  };

  const handleRejectProperty = (id: string) => {
    setProperties((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "Rejected" } : p))
    );
    showToast(`Property ${id} submission rejected.`);
  };

  const handleDeleteProperty = (id: string) => {
    if (confirm("Are you sure you want to delete this property listing? This action cannot be undone.")) {
      setProperties((prev) => prev.filter((p) => p.id !== id));
      showToast(`Property ${id} removed successfully by Admin.`);
    }
  };

  const handleCreateProperty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProp.title || !newProp.locality) {
      alert("Please fill in the title and locality.");
      return;
    }
    const created: Property = {
      id: `PROP-${Math.floor(100 + Math.random() * 900)}`,
      title: newProp.title,
      state: newProp.state,
      district: newProp.district,
      locality: newProp.locality,
      type: newProp.type,
      totalFractions: Number(newProp.totalFractions),
      soldFractions: 0,
      availableFractions: Number(newProp.totalFractions),
      price: Number(newProp.price),
      bookingAmount: Math.round(Number(newProp.price) * 0.1),
      yield: Number(newProp.yield),
      irr: Number(newProp.irr),
      image: newProp.image,
      status: "Active",
      postedBy: newProp.postedBy,
      raised: "₹0",
    };
    setProperties([created, ...properties]);
    setShowAddModal(false);
    showToast(`Property "${created.title}" successfully added and published.`);
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
            {["All", "Commercial", "Holiday", "Residential", "International"].map((t) => (
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
              if (typeFilter !== "All" && p.property_type !== typeFilter.toLowerCase()) return false;
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
                      p.property_type === "holiday"
                        ? styles.badgeHoliday
                        : p.property_type === "commercial"
                        ? styles.badgeCommercial
                        : styles.badgeInternational
                    }`}
                  >
                    {p.property_type}
                  </span>
                </td>
                <td className={styles.td}>
                  <strong>{p.postedBy || "Admin"}</strong>
                  {p.builderContact && (
                    <div style={{ fontSize: "0.7rem", color: "#64748B" }}>
                      {p.builderContact}
                    </div>
                  )}
                </td>
                <td className={styles.td}>
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
                </td>
                <td className={styles.td}>
                  <strong>₹{Number(p.price_per_fraction).toLocaleString("en-IN")}</strong>
                  <div style={{ fontSize: "0.7rem", color: "#64748B" }}>
                    Booking: ₹{Number(p.booking_amount).toLocaleString("en-IN")}
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

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>Property Type</label>
                  <select
                    value={newProp.type}
                    onChange={(e) => setNewProp({ ...newProp, type: e.target.value as any })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1", marginTop: "4px" }}
                  >
                    <option value="Commercial">Commercial</option>
                    <option value="Holiday">Holiday</option>
                    <option value="Residential">Residential</option>
                    <option value="International">International</option>
                  </select>
                </div>
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
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>Price Per Fraction (₹)</label>
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

              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>Cover Image URL</label>
                <input
                  type="url"
                  required
                  value={newProp.image}
                  onChange={(e) => setNewProp({ ...newProp, image: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1", marginTop: "4px" }}
                />
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
                  style={{ padding: "10px 24px", borderRadius: "8px", background: "#2563EB", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700 }}
                >
                  Publish Property Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
