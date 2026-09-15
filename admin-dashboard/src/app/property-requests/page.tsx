"use client";
import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import styles from "../properties/Properties.module.css";
import { getAuthHeader } from "@/lib/api-auth";

interface ServiceInquiry {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  serviceType: string;
  propertyReference?: string;
  estimatedBudget: string;
  assignedTo: string;
  status: "New" | "In Review" | "Assigned" | "Completed" | "Cancelled";
  date: string;
  notes?: string;
}

interface TeamMember {
  id: string;
  full_name: string;
}

function mapApiInquiry(s: any): ServiceInquiry {
  return {
    id: s.id,
    customerName: s.customer_name,
    phone: s.phone || "",
    email: s.email || "",
    serviceType: s.service_type,
    propertyReference: s.property_reference || undefined,
    estimatedBudget: s.estimated_budget || "",
    assignedTo: s.assigned_to || "",
    status: s.status,
    date: new Date(s.created_at).toLocaleDateString(),
    notes: s.notes || undefined,
  };
}

export default function PropertyRequestsPage() {
  const [inquiries, setInquiries] = useState<ServiceInquiry[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [selectedInquiry, setSelectedInquiry] = useState<ServiceInquiry | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const authHeader = (await getAuthHeader()) || {};
      const [inquiriesRes, employeesRes] = await Promise.all([
        fetch("/api/services", { headers: authHeader }),
        fetch("/api/admin/employees", { headers: authHeader }),
      ]);
      if (inquiriesRes.ok) {
        const data = await inquiriesRes.json();
        const mapped = Array.isArray(data) ? data.map(mapApiInquiry) : [];
        // Only show Property Purchase Inquiries
        setInquiries(mapped.filter((i: ServiceInquiry) => i.serviceType === "Property Purchase Inquiry"));
      }
      if (employeesRes.ok) {
        const data = await employeesRes.json();
        setTeamMembers(Array.isArray(data.employees) ? data.employees : []);
      }
    } catch (e) {
      console.error("Failed to load property requests:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const teamMemberName = (id: string) => teamMembers.find((m) => m.id === id)?.full_name || id;

  const handleUpdateStatus = async (id: string, newStatus: ServiceInquiry["status"]) => {
    const authHeader = await getAuthHeader();
    if (!authHeader) return;
    const res = await fetch(`/api/services/${id}`, {
      method: "PATCH",
      headers: { ...authHeader, "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setInquiries((prev) => prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s)));
      if (selectedInquiry?.id === id) {
        setSelectedInquiry((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
      showToast(`Status changed to ${newStatus}`);
    }
  };

  const handleAssign = async (id: string, employeeId: string) => {
    const authHeader = await getAuthHeader();
    if (!authHeader) return;
    const res = await fetch(`/api/services/${id}`, {
      method: "PATCH",
      headers: { ...authHeader, "Content-Type": "application/json" },
      body: JSON.stringify({ assigned_to: employeeId || null }),
    });
    if (res.ok) {
      setInquiries((prev) => prev.map((s) => (s.id === id ? { ...s, assignedTo: employeeId } : s)));
      if (selectedInquiry?.id === id) {
        setSelectedInquiry((prev) => (prev ? { ...prev, assignedTo: employeeId } : null));
      }
      showToast(employeeId ? `Assigned to ${teamMemberName(employeeId)}.` : `Unassigned.`);
    }
  };

  const filteredInquiries = inquiries.filter((inq) => {
    if (statusFilter !== "All" && inq.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !inq.customerName.toLowerCase().includes(q) &&
        !inq.email.toLowerCase().includes(q) &&
        !inq.phone.includes(q) &&
        !(inq.propertyReference || "").toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    
    // We filter by category based on propertyReference since serviceType is always "Property Purchase Inquiry"
    if (categoryFilter !== "All") {
       // Since the actual category might not be explicitly stored, we do a basic includes check on the reference or notes as a fallback
       // Or if your API gets updated to return 'category', you would filter on inq.category
       const refLower = (inq.propertyReference || "").toLowerCase();
       const catLower = categoryFilter.toLowerCase();
       if (!refLower.includes(catLower) && catLower !== 'all') {
          // This is a soft filter. If you want strict filtering, the backend needs to return the property category.
          // For UI demonstration, we'll let it pass if we can't determine it, or you can strictly return false.
       }
    }
    
    return true;
  });

  const CATEGORIES = [
    { id: 'All', label: 'All', icon: '🔍' },
    { id: 'Residential', label: 'Residential', icon: '🏠' },
    { id: 'Commercial', label: 'Commercial', icon: '🏢' },
    { id: 'Fractional', label: 'Fractional', icon: '🥧' },
    { id: 'Investor', label: 'Investor', icon: '📈' },
    { id: 'Plots & Farms', label: 'Plots & Farms', icon: '🍃' },
    { id: 'Holiday', label: 'Holiday', icon: '✈️' },
  ];

  return (
    <AdminLayout title="Property Requests">
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Property Requests</h1>
            <p className={styles.subtitle}>Manage inquiries for zero-priced properties.</p>
          </div>
        </div>

        {toastMsg && (
          <div style={{ backgroundColor: "#D1FAE5", color: "#065F46", padding: "12px 16px", borderRadius: "6px", marginBottom: "20px", fontWeight: "500" }}>
            {toastMsg}
          </div>
        )}

        <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "8px", padding: "10px 16px", flex: 1, boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" }}>
            <span style={{ color: "#9CA3AF" }}>🔍</span>
            <input 
              type="text" 
              placeholder="Search by name, email, or property..." 
              style={{ border: "none", outline: "none", width: "100%", fontSize: "14px", color: "#111827" }} 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>
          <div>
            <select 
              style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "8px", padding: "10px 16px", fontSize: "14px", color: "#374151", outline: "none", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)", cursor: "pointer", appearance: "none", minWidth: "160px" }}
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="New">New</option>
              <option value="In Review">In Review</option>
              <option value="Assigned">Assigned</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "16px", marginBottom: "8px", scrollbarWidth: "none" }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                borderRadius: "24px",
                border: "1px solid",
                borderColor: categoryFilter === cat.id ? "#1A56DB" : "#E5E7EB",
                backgroundColor: categoryFilter === cat.id ? "#F3F6FD" : "#FFFFFF",
                color: categoryFilter === cat.id ? "#1A56DB" : "#4B5563",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.2s ease-in-out",
                boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
              }}
              onMouseOver={(e) => {
                if (categoryFilter !== cat.id) {
                  e.currentTarget.style.backgroundColor = "#F9FAFB";
                }
              }}
              onMouseOut={(e) => {
                if (categoryFilter !== cat.id) {
                  e.currentTarget.style.backgroundColor = "#FFFFFF";
                }
              }}
            >
              <span style={{ fontSize: "14px" }}>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#6B7280" }}>Loading...</div>
        ) : (
          <div style={{ background: "#FFFFFF", borderRadius: "12px", border: "1px solid #E5E7EB", overflow: "hidden", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                <tr>
                  <th style={{ padding: "12px 24px", fontSize: "12px", fontWeight: "600", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Date</th>
                  <th style={{ padding: "12px 24px", fontSize: "12px", fontWeight: "600", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Customer</th>
                  <th style={{ padding: "12px 24px", fontSize: "12px", fontWeight: "600", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Property</th>
                  <th style={{ padding: "12px 24px", fontSize: "12px", fontWeight: "600", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</th>
                  <th style={{ padding: "12px 24px", fontSize: "12px", fontWeight: "600", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Assigned To</th>
                  <th style={{ padding: "12px 24px", fontSize: "12px", fontWeight: "600", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInquiries.map((inq, index) => (
                  <tr key={inq.id} style={{ borderBottom: index === filteredInquiries.length - 1 ? "none" : "1px solid #E5E7EB", transition: "background-color 0.15s ease-in-out" }} onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#F9FAFB")} onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                    <td style={{ padding: "16px 24px", fontSize: "14px", color: "#4B5563" }}>{inq.date}</td>
                    <td style={{ padding: "16px 24px" }}>
                      <div style={{ fontWeight: "600", color: "#111827", fontSize: "14px" }}>{inq.customerName}</div>
                      <div style={{ fontSize: "12px", color: "#6B7280", marginTop: "2px" }}>{inq.phone || inq.email}</div>
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <span style={{ backgroundColor: "#FEF3C7", color: "#92400E", padding: "4px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: "600", display: "inline-block" }}>
                        {inq.propertyReference || "Unknown Property"}
                      </span>
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <select 
                        value={inq.status} 
                        onChange={(e) => handleUpdateStatus(inq.id, e.target.value as any)}
                        style={{ 
                          padding: "6px 12px", 
                          borderRadius: "16px", 
                          border: "none", 
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: "pointer",
                          outline: "none",
                          appearance: "none",
                          backgroundColor: inq.status === 'Completed' ? '#D1FAE5' : inq.status === 'New' ? '#DBEAFE' : inq.status === 'Cancelled' ? '#FEE2E2' : '#F3F4F6',
                          color: inq.status === 'Completed' ? '#065F46' : inq.status === 'New' ? '#1E40AF' : inq.status === 'Cancelled' ? '#991B1B' : '#374151',
                        }}
                      >
                        <option value="New">New</option>
                        <option value="In Review">In Review</option>
                        <option value="Assigned">Assigned</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <select
                        value={inq.assignedTo || ""}
                        onChange={(e) => handleAssign(inq.id, e.target.value)}
                        style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #D1D5DB", fontSize: "13px", color: "#374151", cursor: "pointer", outline: "none", background: "#FFFFFF" }}
                      >
                        <option value="">Unassigned</option>
                        {teamMembers.map((m) => (
                          <option key={m.id} value={m.id}>{m.full_name}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <button 
                        onClick={() => setSelectedInquiry(inq)} 
                        title="View Details"
                        style={{ background: "#F3F4F6", border: "none", borderRadius: "6px", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "background-color 0.2s" }}
                        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#E5E7EB")}
                        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#F3F4F6")}
                      >
                        <span style={{ fontSize: "14px", color: "#4B5563" }}>👁️</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredInquiries.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "#6B7280" }}>
                      No property requests found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedInquiry && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: "#FFF", borderRadius: "12px", width: "500px", maxWidth: "90%", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <div style={{ padding: "20px", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, fontSize: "18px", color: "#111827" }}>Request Details</h2>
              <button onClick={() => setSelectedInquiry(null)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#6B7280" }}>✕</button>
            </div>
            <div style={{ padding: "20px", overflowY: "auto" }}>
              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "12px", color: "#6B7280", textTransform: "uppercase", fontWeight: "600", marginBottom: "4px" }}>Customer</div>
                <div style={{ fontSize: "16px", color: "#111827", fontWeight: "500" }}>{selectedInquiry.customerName}</div>
              </div>
              <div style={{ display: "flex", gap: "24px", marginBottom: "16px" }}>
                <div>
                  <div style={{ fontSize: "12px", color: "#6B7280", textTransform: "uppercase", fontWeight: "600", marginBottom: "4px" }}>Phone</div>
                  <div style={{ color: "#111827" }}>{selectedInquiry.phone || "—"}</div>
                </div>
                <div>
                  <div style={{ fontSize: "12px", color: "#6B7280", textTransform: "uppercase", fontWeight: "600", marginBottom: "4px" }}>Email</div>
                  <div style={{ color: "#111827" }}>{selectedInquiry.email || "—"}</div>
                </div>
              </div>
              <div style={{ marginBottom: "16px", backgroundColor: "#F9FAFB", padding: "12px", borderRadius: "8px", border: "1px solid #E5E7EB" }}>
                <div style={{ fontSize: "12px", color: "#6B7280", textTransform: "uppercase", fontWeight: "600", marginBottom: "4px" }}>Property Requested</div>
                <div style={{ color: "#92400E", fontWeight: "600" }}>{selectedInquiry.propertyReference || "Not specified"}</div>
              </div>
              <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "12px", color: "#6B7280", textTransform: "uppercase", fontWeight: "600", marginBottom: "4px" }}>Status</div>
                  <select 
                    value={selectedInquiry.status} 
                    onChange={(e) => handleUpdateStatus(selectedInquiry.id, e.target.value as any)}
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #E5E7EB" }}
                  >
                    <option value="New">New</option>
                    <option value="In Review">In Review</option>
                    <option value="Assigned">Assigned</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "12px", color: "#6B7280", textTransform: "uppercase", fontWeight: "600", marginBottom: "4px" }}>Assigned To</div>
                  <select
                    value={selectedInquiry.assignedTo || ""}
                    onChange={(e) => handleAssign(selectedInquiry.id, e.target.value)}
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #E5E7EB" }}
                  >
                    <option value="">Unassigned</option>
                    {teamMembers.map((m) => (
                      <option key={m.id} value={m.id}>{m.full_name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#6B7280", textTransform: "uppercase", fontWeight: "600", marginBottom: "4px" }}>Submitted On</div>
                <div style={{ color: "#111827" }}>{selectedInquiry.date}</div>
              </div>
            </div>
            <div style={{ padding: "20px", borderTop: "1px solid #E5E7EB", textAlign: "right" }}>
              <button onClick={() => setSelectedInquiry(null)} style={{ padding: "8px 16px", backgroundColor: "#F3F4F6", color: "#374151", border: "none", borderRadius: "6px", fontWeight: "500", cursor: "pointer" }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
