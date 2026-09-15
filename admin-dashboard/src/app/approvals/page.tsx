"use client";

import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import styles from "../properties/Properties.module.css";
import { getAuthHeader } from "@/lib/api-auth";

interface KycDoc {
  id: string;
  document_type: string;
  document_number: string;
  document_front_url: string;
}

interface PendingUser {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  role: string;
  created_at: string;
  bio: string | null;
  kyc_documents: KycDoc[];
  _actionStatus?: 'approve' | 'reject' | 'delete' | 'deleted';
}

export default function ApprovalsPage() {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<"all" | "buyer" | "agent" | "builder">("all");
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Document viewer modal state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerDocs, setViewerDocs] = useState<KycDoc[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewerAgentName, setViewerAgentName] = useState("");

  const loadPendingUsers = async () => {
    setLoading(true);
    try {
      const authHeader = await getAuthHeader();
      if (!authHeader) return;
      const roleQuery = filterRole === "all" ? "" : `?role=${filterRole}`;
      const res = await fetch(`/api/approvals${roleQuery}`, { headers: authHeader });
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingUsers();
  }, [filterRole]);

  const handleAction = async (id: string, name: string, action: 'approve' | 'reject' | 'delete') => {
    let confirmMsg = '';
    if (action === 'approve') confirmMsg = `Are you sure you want to approve ${name}?`;
    if (action === 'reject') confirmMsg = `Are you sure you want to reject ${name}? They will be banned and unable to sign up again with this email.`;
    if (action === 'delete') confirmMsg = `Are you sure you want to completely delete ${name}? This action cannot be undone.`;
    
    if (!window.confirm(confirmMsg)) return;
    
    try {
      const authHeader = await getAuthHeader();
      if (!authHeader) return;

      if (action === 'delete') {
        const res = await fetch(`/api/approvals?id=${id}`, {
          method: "DELETE",
          headers: authHeader,
        });
        if (res.ok) {
          setUsers((prev) => prev.map((u) => u.id === id ? { ...u, _actionStatus: 'deleted' } : u));
          setActionSuccess(`Account for ${name} has been deleted.`);
          setTimeout(() => setActionSuccess(null), 3000);
        } else {
          setActionError(`Failed to delete ${name}.`);
          setTimeout(() => setActionError(null), 3000);
        }
      } else {
        const res = await fetch(`/api/approvals`, {
          method: "PATCH",
          headers: { ...authHeader, "Content-Type": "application/json" },
          body: JSON.stringify({ id, action }),
        });
        if (res.ok) {
          setUsers((prev) => prev.map((u) => u.id === id ? { ...u, _actionStatus: action } : u));
          setActionSuccess(`Account for ${name} has been ${action}d.`);
          setTimeout(() => setActionSuccess(null), 3000);
        } else {
          setActionError(`Failed to ${action} ${name}.`);
          setTimeout(() => setActionError(null), 3000);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getProxiedUrl = (rawUrl: string) => {
    if (!rawUrl) return '';
    const isPlaceholder = rawUrl.includes('placehold.co') || rawUrl.includes('placeholder');
    if (isPlaceholder) return '';
    return `/api/image-proxy?url=${encodeURIComponent(rawUrl)}`;
  };

  const openDocViewer = (docs: KycDoc[], agentName: string, startIndex: number = 0) => {
    const validDocs = docs.filter(d => !d.document_front_url.includes('placehold.co') && !d.document_front_url.includes('placeholder'));
    if (validDocs.length === 0) {
      alert('No documents have been uploaded by this agent.');
      return;
    }
    setViewerDocs(validDocs);
    setViewerAgentName(agentName);
    setViewerIndex(startIndex);
    setViewerOpen(true);
  };

  return (
    <AdminLayout title="Account Approvals">
      {actionSuccess && (
        <div style={{ background: "#059669", color: "#fff", padding: "14px 20px", borderRadius: "10px", marginBottom: "20px", display: "flex", justifyContent: "space-between" }}>
          <span>✓ {actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer" }}>✕</button>
        </div>
      )}
      {actionError && (
        <div style={{ background: "#DC2626", color: "#fff", padding: "14px 20px", borderRadius: "10px", marginBottom: "20px", display: "flex", justifyContent: "space-between" }}>
          <span>⚠️ {actionError}</span>
          <button onClick={() => setActionError(null)} style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer" }}>✕</button>
        </div>
      )}

      <div className={styles.header}>
        <div className={styles.title}>Pending Approvals ({users.length})</div>
        <div className={styles.headerRight}>
          <div className={styles.filterGroup}>
            {["all", "buyer", "agent", "builder"].map((role) => (
              <button
                key={role}
                className={`${styles.filterPill} ${filterRole === role ? styles.filterActive : ""}`}
                onClick={() => setFilterRole(role as any)}
              >
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Name</th>
              <th className={styles.th}>Role</th>
              <th className={styles.th}>Contact Info</th>
              {filterRole !== "buyer" && filterRole !== "builder" && (
                <th className={styles.th}>KYC Documents</th>
              )}
              <th className={styles.th}>Date Registered</th>
              <th className={styles.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className={styles.td} colSpan={7} style={{ textAlign: "center", padding: "40px" }}>Loading pending approvals...</td></tr>
            ) : users.length === 0 ? (
              <tr><td className={styles.td} colSpan={7} style={{ textAlign: "center", padding: "40px" }}>No pending approvals found.</td></tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className={styles.tr}>
                  <td className={styles.td}>
                    <strong>{user.full_name || "N/A"}</strong>
                    <div style={{ fontSize: "0.75rem", color: "#64748B" }}>{user.id}</div>
                  </td>
                  <td className={styles.td}>
                    <span style={{ padding: "4px 8px", background: "#E2E8F0", borderRadius: "4px", fontSize: "0.8rem", fontWeight: 600 }}>
                      {user.role.toUpperCase()}
                    </span>
                  </td>
                  <td className={styles.td}>
                    <div>{user.email || "No email"}</div>
                    <div style={{ fontSize: "0.8rem", color: "#64748B" }}>{user.phone_number || "No phone"}</div>
                  </td>
                  {filterRole !== "buyer" && filterRole !== "builder" && (
                    <td className={styles.td}>
                      {user.role === 'agent' ? (
                        user.kyc_documents && user.kyc_documents.length > 0 ? (
                          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                            {user.kyc_documents.map((doc, idx) => {
                              const proxyUrl = getProxiedUrl(doc.document_front_url);
                              const isPlaceholder = !proxyUrl;
                              
                              return (
                                <div key={doc.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                  {isPlaceholder ? (
                                    <div style={{ width: '72px', height: '52px', background: '#FEF3C7', border: '1px dashed #F59E0B', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: '#92400E', textAlign: 'center', padding: '4px' }}>
                                      Not uploaded
                                    </div>
                                  ) : (
                                    <div
                                      onClick={() => openDocViewer(user.kyc_documents, user.full_name, idx)}
                                      style={{ cursor: 'pointer', position: 'relative' }}
                                    >
                                      <img
                                        src={proxyUrl}
                                        alt={doc.document_type}
                                        style={{ width: '72px', height: '52px', objectFit: 'cover', borderRadius: '6px', border: '2px solid #E2E8F0', transition: 'border-color 0.2s' }}
                                        onError={(e) => {
                                          const el = e.target as HTMLImageElement;
                                          el.style.display = 'none';
                                        }}
                                        onMouseOver={(e) => { (e.target as HTMLImageElement).style.borderColor = '#D4AF37'; }}
                                        onMouseOut={(e) => { (e.target as HTMLImageElement).style.borderColor = '#E2E8F0'; }}
                                      />
                                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.15)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
                                        onMouseOver={(e) => { (e.target as HTMLElement).style.opacity = '1'; }}
                                        onMouseOut={(e) => { (e.target as HTMLElement).style.opacity = '0'; }}
                                      >
                                        <span style={{ color: '#fff', fontSize: '16px' }}>🔍</span>
                                      </div>
                                    </div>
                                  )}
                                  <span
                                    onClick={() => !isPlaceholder && openDocViewer(user.kyc_documents, user.full_name, idx)}
                                    style={{ fontSize: "0.65rem", color: "#2563EB", fontWeight: 600, cursor: isPlaceholder ? 'default' : 'pointer', textDecoration: isPlaceholder ? 'none' : 'underline' }}
                                  >
                                    {doc.document_type.toUpperCase()}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <span style={{ fontSize: "0.8rem", color: "#64748B" }}>None uploaded</span>
                        )
                      ) : (
                        <span style={{ fontSize: "0.8rem", color: "#64748B" }}>N/A</span>
                      )}
                    </td>
                  )}
                  <td className={styles.td}>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td className={styles.td}>
                    {user._actionStatus ? (
                      <div style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        fontWeight: 600,
                        fontSize: "0.85rem",
                        textAlign: "center",
                        background: user._actionStatus === 'approve' ? "#D1FAE5" : user._actionStatus === 'reject' ? "#FEF3C7" : "#FEE2E2",
                        color: user._actionStatus === 'approve' ? "#065F46" : user._actionStatus === 'reject' ? "#92400E" : "#991B1B"
                      }}>
                        {user._actionStatus === 'approve' ? 'Approved' : user._actionStatus === 'reject' ? 'Rejected' : 'Deleted'}
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => handleAction(user.id, user.full_name, 'approve')}
                          style={{ background: "#10B981", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleAction(user.id, user.full_name, 'reject')}
                          style={{ background: "#F59E0B", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleAction(user.id, user.full_name, 'delete')}
                          style={{ background: "#EF4444", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Document Viewer Modal */}
      {viewerOpen && viewerDocs.length > 0 && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', zIndex: 9999,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={() => setViewerOpen(false)}
        >
          {/* Header */}
          <div
            style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div style={{ color: '#fff', fontSize: '18px', fontWeight: 700 }}>
                {viewerAgentName} — KYC Documents
              </div>
              <div style={{ color: '#94A3B8', fontSize: '14px', marginTop: '4px' }}>
                {viewerDocs[viewerIndex]?.document_type.toUpperCase()} ({viewerIndex + 1} of {viewerDocs.length})
              </div>
            </div>
            <button
              onClick={() => setViewerOpen(false)}
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              ✕
            </button>
          </div>

          {/* Document tabs */}
          <div
            style={{ position: 'absolute', top: '80px', display: 'flex', gap: '8px', zIndex: 10 }}
            onClick={(e) => e.stopPropagation()}
          >
            {viewerDocs.map((doc, idx) => (
              <button
                key={doc.id}
                onClick={() => setViewerIndex(idx)}
                style={{
                  padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '13px',
                  background: idx === viewerIndex ? '#D4AF37' : 'rgba(255,255,255,0.1)',
                  color: idx === viewerIndex ? '#000' : '#fff',
                  transition: 'all 0.2s',
                }}
              >
                {doc.document_type.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Image */}
          <div
            style={{ maxWidth: '90vw', maxHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={getProxiedUrl(viewerDocs[viewerIndex]?.document_front_url)}
              alt={viewerDocs[viewerIndex]?.document_type}
              style={{
                maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain',
                borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}
            />
          </div>

          {/* Navigation arrows */}
          {viewerDocs.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setViewerIndex((prev) => (prev > 0 ? prev - 1 : viewerDocs.length - 1)); }}
                style={{ position: 'absolute', left: '24px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', width: '48px', height: '48px', borderRadius: '50%', cursor: 'pointer', fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ‹
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setViewerIndex((prev) => (prev < viewerDocs.length - 1 ? prev + 1 : 0)); }}
                style={{ position: 'absolute', right: '24px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', width: '48px', height: '48px', borderRadius: '50%', cursor: 'pointer', fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ›
              </button>
            </>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
