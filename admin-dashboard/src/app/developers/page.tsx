"use client";
import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { getAuthHeader } from "@/lib/api-auth";
import styles from "../properties/Properties.module.css";

interface Developer {
  id: string;
  name: string;
  logo_url?: string | null;
  bio?: string | null;
  rating: string | number;
  established_year?: number | null;
  rera_registered: boolean;
  _count?: { properties: number };
}

const emptyEditForm = {
  name: "",
  logo_url: "",
  bio: "",
  rating: 4.5,
  established_year: new Date().getFullYear(),
  rera_registered: true,
};

export default function DevelopersPage() {
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [newDev, setNewDev] = useState({
    name: "",
    bio: "",
    rating: 4.5,
    established_year: new Date().getFullYear(),
    rera_registered: true,
  });

  const [editingDev, setEditingDev] = useState<Developer | null>(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadDevelopers = () => {
    setLoading(true);
    fetch("/api/developers")
      .then((res) => res.json())
      .then((data) => {
        setDevelopers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadDevelopers();
  }, []);

  const handleCreateDeveloper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDev.name) {
      alert("Please enter a developer name.");
      return;
    }
    try {
      const authHeader = await getAuthHeader();
      if (!authHeader) { alert("You must be signed in to do that."); return; }
      const res = await fetch("/api/developers", {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify(newDev),
      });
      if (!res.ok) throw new Error("Failed to create developer");
      const created = await res.json();
      setDevelopers([{ ...created, _count: { properties: 0 } }, ...developers]);
      setShowAddModal(false);
      setNewDev({ name: "", bio: "", rating: 4.5, established_year: new Date().getFullYear(), rera_registered: true });
      showToast(`Developer "${created.name}" added.`);
    } catch (err) {
      console.error(err);
      alert("Could not save developer. Please try again.");
    }
  };

  const openEditModal = (d: Developer) => {
    setEditingDev(d);
    setEditForm({
      name: d.name,
      logo_url: d.logo_url || "",
      bio: d.bio || "",
      rating: Number(d.rating),
      established_year: d.established_year || new Date().getFullYear(),
      rera_registered: d.rera_registered,
    });
  };

  const closeEditModal = () => {
    setEditingDev(null);
    setEditForm(emptyEditForm);
  };

  const handleUpdateDeveloper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDev) return;
    if (!editForm.name) {
      alert("Please enter a developer name.");
      return;
    }
    setIsSavingEdit(true);
    try {
      const authHeader = await getAuthHeader();
      if (!authHeader) { alert("You must be signed in to do that."); setIsSavingEdit(false); return; }
      const res = await fetch(`/api/developers/${editingDev.id}`, {
        method: "PUT",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          logo_url: editForm.logo_url || null,
          bio: editForm.bio || null,
          rating: editForm.rating,
          established_year: editForm.established_year || null,
          rera_registered: editForm.rera_registered,
        }),
      });
      if (!res.ok) throw new Error("Failed to update developer");
      const updated = await res.json();
      setDevelopers((prev) => prev.map((d) => (d.id === updated.id ? { ...d, ...updated } : d)));
      closeEditModal();
      showToast(`Developer "${updated.name}" updated.`);
    } catch (err) {
      console.error(err);
      alert("Could not update developer. Please try again.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteDeveloper = async (d: Developer) => {
    if (!confirm(`Delete developer "${d.name}"? This cannot be undone.`)) return;
    try {
      const authHeader = await getAuthHeader();
      if (!authHeader) { alert("You must be signed in to do that."); return; }
      const res = await fetch(`/api/developers/${d.id}`, {
        method: "DELETE",
        headers: authHeader,
      });
      if (!res.ok) throw new Error("Failed to delete developer");
      setDevelopers((prev) => prev.filter((dev) => dev.id !== d.id));
      showToast(`Developer "${d.name}" removed.`);
    } catch (err) {
      console.error(err);
      alert("Could not delete developer. It may still have properties attached.");
    }
  };

  return (
    <AdminLayout title="Developers">
      <div className={styles.header}>
        <div>
          <div className={styles.title}>Developers</div>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.addButton} onClick={() => setShowAddModal(true)}>
            + Add Developer
          </button>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Developer</th>
              <th className={styles.th}>Rating</th>
              <th className={styles.th}>Est.</th>
              <th className={styles.th}>RERA</th>
              <th className={styles.th}>Total Projects</th>
              <th className={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className={styles.td} colSpan={6}>Loading developers...</td>
              </tr>
            ) : developers.length === 0 ? (
              <tr>
                <td className={styles.td} colSpan={6}>No developers added yet.</td>
              </tr>
            ) : (
              developers.map((d) => (
                <tr key={d.id} className={styles.tr}>
                  <td className={styles.td}>
                    <div className={styles.propCell}>
                      <strong>{d.name}</strong>
                    </div>
                    {d.bio && <div style={{ fontSize: "0.75rem", color: "#64748B" }}>{d.bio}</div>}
                  </td>
                  <td className={styles.td}>⭐ {Number(d.rating).toFixed(1)}</td>
                  <td className={styles.td}>{d.established_year || "—"}</td>
                  <td className={styles.td}>
                    {d.rera_registered ? (
                      <span className={styles.badge} style={{ background: "#D1FAE5", color: "#059669" }}>
                        RERA Verified
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className={styles.td}>{d._count?.properties ?? 0}</td>
                  <td className={styles.td}>
                    <div className={styles.actions}>
                      <button onClick={() => openEditModal(d)} className={styles.viewBtn}>
                        Edit
                      </button>
                      <button onClick={() => handleDeleteDeveloper(d)} className={styles.deleteBtn}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
              maxWidth: "480px",
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
              <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0F172A" }}>Add Developer</h2>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: "#F1F5F9", border: "none", borderRadius: "8px", padding: "6px 12px", cursor: "pointer", fontWeight: 700 }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDeveloper} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>Developer Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prestige Group"
                  value={newDev.name}
                  onChange={(e) => setNewDev({ ...newDev, name: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1", marginTop: "4px" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>Bio</label>
                <textarea
                  placeholder="Short description"
                  value={newDev.bio}
                  onChange={(e) => setNewDev({ ...newDev, bio: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1", marginTop: "4px", minHeight: "70px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>Rating (0-5)</label>
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    max={5}
                    value={newDev.rating}
                    onChange={(e) => setNewDev({ ...newDev, rating: Number(e.target.value) })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1", marginTop: "4px" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>Established Year</label>
                  <input
                    type="number"
                    value={newDev.established_year}
                    onChange={(e) => setNewDev({ ...newDev, established_year: Number(e.target.value) })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1", marginTop: "4px" }}
                  />
                </div>
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "#475569" }}>
                <input
                  type="checkbox"
                  checked={newDev.rera_registered}
                  onChange={(e) => setNewDev({ ...newDev, rera_registered: e.target.checked })}
                />
                RERA Registered
              </label>

              <button
                type="submit"
                style={{
                  background: "#2563EB",
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  padding: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Save Developer
              </button>
            </form>
          </div>
        </div>
      )}

      {editingDev && (
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
              maxWidth: "480px",
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
              <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0F172A" }}>Edit Developer</h2>
              <button
                onClick={closeEditModal}
                style={{ background: "#F1F5F9", border: "none", borderRadius: "8px", padding: "6px 12px", cursor: "pointer", fontWeight: 700 }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateDeveloper} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>Developer Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1", marginTop: "4px" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>Logo URL</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={editForm.logo_url}
                  onChange={(e) => setEditForm({ ...editForm, logo_url: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1", marginTop: "4px" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>Bio</label>
                <textarea
                  placeholder="Short description"
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1", marginTop: "4px", minHeight: "70px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>Rating (0-5)</label>
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    max={5}
                    value={editForm.rating}
                    onChange={(e) => setEditForm({ ...editForm, rating: Number(e.target.value) })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1", marginTop: "4px" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>Established Year</label>
                  <input
                    type="number"
                    value={editForm.established_year}
                    onChange={(e) => setEditForm({ ...editForm, established_year: Number(e.target.value) })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1", marginTop: "4px" }}
                  />
                </div>
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "#475569" }}>
                <input
                  type="checkbox"
                  checked={editForm.rera_registered}
                  onChange={(e) => setEditForm({ ...editForm, rera_registered: e.target.checked })}
                />
                RERA Registered
              </label>

              <button
                type="submit"
                disabled={isSavingEdit}
                style={{
                  background: "#2563EB",
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  padding: "12px",
                  fontWeight: 700,
                  cursor: isSavingEdit ? "not-allowed" : "pointer",
                }}
              >
                {isSavingEdit ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}

      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            background: "#0F172A",
            color: "#fff",
            padding: "14px 20px",
            borderRadius: "10px",
            fontSize: "0.85rem",
            zIndex: 200,
          }}
        >
          {toastMessage}
        </div>
      )}
    </AdminLayout>
  );
}
