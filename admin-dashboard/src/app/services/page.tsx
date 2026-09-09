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

interface PremiumServiceItem {
  id: string;
  title: string;
  category: string;
  description: string | null;
  pricing: string | null;
  image_url: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
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

const serviceTypeColors: Record<string, string> = {
  "Interior Design": "#7C3AED",
  "Property Mgmt": "#DC2626",
  "Property Management": "#DC2626",
  "Home Loans": "#2563EB",
  "Home Loans & Finance": "#2563EB",
  "Legal Advisory": "#D97706",
};

export default function AdditionalServicesPage() {
  const [activeTab, setActiveTab] = useState<"inquiries" | "catalog">("inquiries");
  const [inquiries, setInquiries] = useState<ServiceInquiry[]>([]);
  const [catalog, setCatalog] = useState<PremiumServiceItem[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Modals & Drawers
  const [selectedInquiry, setSelectedInquiry] = useState<ServiceInquiry | null>(null);
  const [showAddInquiryModal, setShowAddInquiryModal] = useState(false);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<PremiumServiceItem | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form states for Add/Edit Service
  const [serviceForm, setServiceForm] = useState({
    title: "",
    category: "Design & Architecture",
    description: "",
    pricing: "Free Consultation",
    image_url: "",
    sort_order: 1,
    is_active: true,
  });

  // Form states for Add Inquiry
  const [inquiryForm, setInquiryForm] = useState({
    customer_name: "",
    phone: "",
    email: "",
    service_type: "Interior Design",
    property_reference: "",
    estimated_budget: "",
    notes: "",
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const authHeader = (await getAuthHeader()) || {};
      const [inquiriesRes, catalogRes, employeesRes] = await Promise.all([
        fetch("/api/services", { headers: authHeader }),
        fetch("/api/services/catalog", { headers: authHeader }),
        fetch("/api/admin/employees", { headers: authHeader }),
      ]);
      if (inquiriesRes.ok) {
        const data = await inquiriesRes.json();
        setInquiries(Array.isArray(data) ? data.map(mapApiInquiry) : []);
      }
      if (catalogRes.ok) {
        const data = await catalogRes.json();
        setCatalog(Array.isArray(data) ? data : []);
      }
      if (employeesRes.ok) {
        const data = await employeesRes.json();
        setTeamMembers(Array.isArray(data.employees) ? data.employees : []);
      }
    } catch (e) {
      console.error("Failed to load services data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const teamMemberName = (id: string) => teamMembers.find((m) => m.id === id)?.full_name || id;

  // --- Inquiry Handlers ---
  const handleUpdateStatus = async (id: string, newStatus: ServiceInquiry["status"]) => {
    const authHeader = await getAuthHeader();
    if (!authHeader) {
      showToast("You must be signed in to do that.");
      return;
    }
    const res = await fetch(`/api/services/${id}`, {
      method: "PATCH",
      headers: { ...authHeader, "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) {
      showToast("Failed to update status.");
      return;
    }
    setInquiries((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
    );
    if (selectedInquiry?.id === id) {
      setSelectedInquiry((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
    showToast(`Inquiry status changed to ${newStatus}`);
  };

  const handleAssign = async (id: string, employeeId: string) => {
    const authHeader = await getAuthHeader();
    if (!authHeader) {
      showToast("You must be signed in to do that.");
      return;
    }
    const res = await fetch(`/api/services/${id}`, {
      method: "PATCH",
      headers: { ...authHeader, "Content-Type": "application/json" },
      body: JSON.stringify({ assigned_to: employeeId || null }),
    });
    if (!res.ok) {
      showToast("Failed to update assignment.");
      return;
    }
    setInquiries((prev) =>
      prev.map((s) => (s.id === id ? { ...s, assignedTo: employeeId } : s))
    );
    if (selectedInquiry?.id === id) {
      setSelectedInquiry((prev) => (prev ? { ...prev, assignedTo: employeeId } : null));
    }
    showToast(
      employeeId
        ? `Assigned to ${teamMemberName(employeeId)}.`
        : `Inquiry unassigned.`
    );
  };

  const handleSaveInquiryNotes = async (id: string, notes: string) => {
    const authHeader = await getAuthHeader();
    if (!authHeader) return;
    const res = await fetch(`/api/services/${id}`, {
      method: "PATCH",
      headers: { ...authHeader, "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    if (res.ok) {
      setInquiries((prev) =>
        prev.map((s) => (s.id === id ? { ...s, notes } : s))
      );
      if (selectedInquiry?.id === id) {
        setSelectedInquiry((prev) => (prev ? { ...prev, notes } : null));
      }
      showToast("Notes updated successfully.");
    }
  };

  const handleDeleteInquiry = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service inquiry?")) return;
    const authHeader = await getAuthHeader();
    if (!authHeader) return;
    const res = await fetch(`/api/services/${id}`, {
      method: "DELETE",
      headers: authHeader,
    });
    if (res.ok) {
      setInquiries((prev) => prev.filter((s) => s.id !== id));
      if (selectedInquiry?.id === id) setSelectedInquiry(null);
      showToast("Inquiry deleted.");
    }
  };

  const handleCreateInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryForm.customer_name || (!inquiryForm.phone && !inquiryForm.email)) {
      alert("Please provide customer name and at least a phone number or email.");
      return;
    }
    const authHeader = await getAuthHeader();
    if (!authHeader) return;
    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify(inquiryForm),
      });
      if (res.ok) {
        const created = await res.json();
        setInquiries((prev) => [mapApiInquiry(created), ...prev]);
        setShowAddInquiryModal(false);
        setInquiryForm({
          customer_name: "",
          phone: "",
          email: "",
          service_type: "Interior Design",
          property_reference: "",
          estimated_budget: "",
          notes: "",
        });
        showToast("Service inquiry created successfully!");
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Failed to create inquiry.");
      }
    } catch (e: any) {
      alert("Network error.");
    }
  };

  // --- Catalog Handlers ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const authHeader = (await getAuthHeader()) || undefined;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "services");

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: authHeader,
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setServiceForm((prev) => ({ ...prev, image_url: data.url }));
        showToast("Image uploaded successfully!");
      } else {
        alert("Image upload failed.");
      }
    } catch (err) {
      alert("Upload failed.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceForm.title || !serviceForm.image_url) {
      alert("Please fill in Title and Image URL.");
      return;
    }
    const authHeader = await getAuthHeader();
    if (!authHeader) return;

    try {
      if (editingService) {
        const res = await fetch(`/api/services/catalog/${editingService.id}`, {
          method: "PATCH",
          headers: { ...authHeader, "Content-Type": "application/json" },
          body: JSON.stringify(serviceForm),
        });
        if (res.ok) {
          const updated = await res.json();
          setCatalog((prev) => prev.map((s) => (s.id === editingService.id ? updated : s)));
          setShowAddServiceModal(false);
          setEditingService(null);
          showToast("Premium Service updated!");
        }
      } else {
        const res = await fetch("/api/services/catalog", {
          method: "POST",
          headers: { ...authHeader, "Content-Type": "application/json" },
          body: JSON.stringify(serviceForm),
        });
        if (res.ok) {
          const created = await res.json();
          setCatalog((prev) => [...prev, created]);
          setShowAddServiceModal(false);
          showToast("New Premium Service added to catalog!");
        }
      }
    } catch (err) {
      alert("Failed to save service.");
    }
  };

  const handleToggleServiceActive = async (service: PremiumServiceItem) => {
    const authHeader = await getAuthHeader();
    if (!authHeader) return;
    const newActive = !service.is_active;
    const res = await fetch(`/api/services/catalog/${service.id}`, {
      method: "PATCH",
      headers: { ...authHeader, "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: newActive }),
    });
    if (res.ok) {
      setCatalog((prev) => prev.map((s) => (s.id === service.id ? { ...s, is_active: newActive } : s)));
      showToast(`${service.title} is now ${newActive ? "Active" : "Hidden"}.`);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm("Are you sure you want to remove this service from the catalog?")) return;
    const authHeader = await getAuthHeader();
    if (!authHeader) return;
    const res = await fetch(`/api/services/catalog/${id}`, {
      method: "DELETE",
      headers: authHeader,
    });
    if (res.ok) {
      setCatalog((prev) => prev.filter((s) => s.id !== id));
      showToast("Service removed from catalog.");
    }
  };

  const openEditService = (service: PremiumServiceItem) => {
    setEditingService(service);
    setServiceForm({
      title: service.title,
      category: service.category,
      description: service.description || "",
      pricing: service.pricing || "",
      image_url: service.image_url,
      sort_order: service.sort_order,
      is_active: service.is_active,
    });
    setShowAddServiceModal(true);
  };

  const openCreateService = () => {
    setEditingService(null);
    setServiceForm({
      title: "",
      category: "Design & Architecture",
      description: "",
      pricing: "Free Consultation",
      image_url: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&fit=crop",
      sort_order: catalog.length + 1,
      is_active: true,
    });
    setShowAddServiceModal(true);
  };

  // --- Filtering & Calculations ---
  const filteredInquiries = inquiries.filter((inq) => {
    const matchType =
      typeFilter === "All" ||
      inq.serviceType.toLowerCase().includes(typeFilter.toLowerCase());
    const matchStatus =
      statusFilter === "All" || inq.status.toLowerCase() === statusFilter.toLowerCase();
    const matchSearch =
      inq.customerName.toLowerCase().includes(search.toLowerCase()) ||
      inq.email.toLowerCase().includes(search.toLowerCase()) ||
      inq.phone.toLowerCase().includes(search.toLowerCase()) ||
      inq.serviceType.toLowerCase().includes(search.toLowerCase()) ||
      inq.id.toLowerCase().includes(search.toLowerCase());
    return matchType && matchStatus && matchSearch;
  });

  const countInterior = inquiries.filter((i) => i.serviceType.toLowerCase().includes("interior")).length;
  const countPropertyMgmt = inquiries.filter((i) => i.serviceType.toLowerCase().includes("property")).length;
  const countHomeLoans = inquiries.filter((i) => i.serviceType.toLowerCase().includes("loan")).length;
  const countNew = inquiries.filter((i) => i.status === "New").length;

  const handleExportLeads = () => {
    const headers = [
      "Inquiry ID",
      "Date",
      "Customer Name",
      "Phone",
      "Email",
      "Premium Service",
      "Property Reference",
      "Budget / Value",
      "Assigned To",
      "Status",
      "Notes",
    ];
    const rows = filteredInquiries.map((inq) => [
      inq.id,
      inq.date,
      inq.customerName,
      inq.phone,
      inq.email,
      inq.serviceType,
      inq.propertyReference || "",
      inq.estimatedBudget,
      inq.assignedTo ? teamMemberName(inq.assignedTo) : "Unassigned",
      inq.status,
      inq.notes || "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `RealShare_Premium_Services_Leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Leads exported successfully.");
  };

  return (
    <AdminLayout title="Premium Services Management">
      <div className={styles.container}>
        {/* Toast */}
        {toastMsg && (
          <div style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            backgroundColor: "#111827",
            color: "#FFFFFF",
            padding: "12px 20px",
            borderRadius: "8px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
          }}>
            <span>✨</span>
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
          <div>
            <h1 className={styles.title} style={{ margin: 0 }}>Premium Services Management</h1>
            <p className={styles.subtitle} style={{ margin: "4px 0 0 0" }}>
              Manage concierge services catalog and customer consultation requests.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            {activeTab === "inquiries" ? (
              <>
                <button
                  onClick={() => setShowAddInquiryModal(true)}
                  style={{
                    backgroundColor: "#111827",
                    color: "#FFFFFF",
                    padding: "10px 18px",
                    borderRadius: "8px",
                    border: "none",
                    fontWeight: "600",
                    fontSize: "13px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <span>+</span> Add Inquiry
                </button>
                <button
                  onClick={handleExportLeads}
                  style={{
                    backgroundColor: "#2563EB",
                    color: "#FFFFFF",
                    padding: "10px 18px",
                    borderRadius: "8px",
                    border: "none",
                    fontWeight: "600",
                    fontSize: "13px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <span>📥</span> Export Leads CSV
                </button>
              </>
            ) : (
              <button
                onClick={openCreateService}
                style={{
                  backgroundColor: "#D4AF37",
                  color: "#111827",
                  padding: "10px 18px",
                  borderRadius: "8px",
                  border: "none",
                  fontWeight: "700",
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <span>+</span> Add New Service
              </button>
            )}
          </div>
        </div>

        {/* Top Navigation Tabs */}
        <div style={{ display: "flex", gap: "8px", borderBottom: "2px solid #E5E7EB", marginBottom: "24px" }}>
          <button
            onClick={() => setActiveTab("inquiries")}
            style={{
              padding: "12px 20px",
              background: "none",
              border: "none",
              borderBottom: activeTab === "inquiries" ? "3px solid #D4AF37" : "3px solid transparent",
              color: activeTab === "inquiries" ? "#111827" : "#6B7280",
              fontWeight: activeTab === "inquiries" ? "700" : "500",
              fontSize: "15px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <span>📋</span> Customer Inquiries & Leads ({inquiries.length})
            {countNew > 0 && (
              <span style={{ backgroundColor: "#DC2626", color: "#FFF", fontSize: "11px", fontWeight: "800", padding: "2px 7px", borderRadius: "10px" }}>
                {countNew} NEW
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("catalog")}
            style={{
              padding: "12px 20px",
              background: "none",
              border: "none",
              borderBottom: activeTab === "catalog" ? "3px solid #D4AF37" : "3px solid transparent",
              color: activeTab === "catalog" ? "#111827" : "#6B7280",
              fontWeight: activeTab === "catalog" ? "700" : "500",
              fontSize: "15px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <span>🛎️</span> Services Catalog ({catalog.length})
          </button>
        </div>

        {/* Tab 1: Inquiries View */}
        {activeTab === "inquiries" && (
          <>
            {/* KPI Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" }}>
              <div className={styles.statCard}>
                <div style={{ fontSize: "12px", color: "#6B7280", fontWeight: "700", textTransform: "uppercase" }}>Total Requests</div>
                <div style={{ fontSize: "28px", fontWeight: "800", color: "#111827", margin: "4px 0" }}>{inquiries.length}</div>
                <div style={{ fontSize: "12px", color: "#059669", fontWeight: "600" }}>{countNew} pending follow-up</div>
              </div>

              <div className={styles.statCard}>
                <div style={{ fontSize: "12px", color: "#7C3AED", fontWeight: "700", textTransform: "uppercase" }}>Interior Design</div>
                <div style={{ fontSize: "28px", fontWeight: "800", color: "#111827", margin: "4px 0" }}>{countInterior}</div>
                <div style={{ fontSize: "12px", color: "#6B7280" }}>Premium design consultations</div>
              </div>

              <div className={styles.statCard}>
                <div style={{ fontSize: "12px", color: "#DC2626", fontWeight: "700", textTransform: "uppercase" }}>Property Mgmt</div>
                <div style={{ fontSize: "28px", fontWeight: "800", color: "#111827", margin: "4px 0" }}>{countPropertyMgmt}</div>
                <div style={{ fontSize: "12px", color: "#6B7280" }}>Tenant & rental servicing</div>
              </div>

              <div className={styles.statCard}>
                <div style={{ fontSize: "12px", color: "#2563EB", fontWeight: "700", textTransform: "uppercase" }}>Home Loans & Finance</div>
                <div style={{ fontSize: "28px", fontWeight: "800", color: "#111827", margin: "4px 0" }}>{countHomeLoans}</div>
                <div style={{ fontSize: "12px", color: "#6B7280" }}>Partnered bank financing</div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {["All", "Interior Design", "Property Mgmt", "Home Loans"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "20px",
                      border: "1px solid #E5E7EB",
                      backgroundColor: typeFilter === type ? "#111827" : "#FFFFFF",
                      color: typeFilter === type ? "#FFFFFF" : "#4B5563",
                      fontSize: "13px",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid #E5E7EB",
                    fontSize: "13px",
                    backgroundColor: "#FFF",
                    color: "#374151",
                    fontWeight: "500",
                  }}
                >
                  <option value="All">All Statuses</option>
                  <option value="New">New</option>
                  <option value="In Review">In Review</option>
                  <option value="Assigned">Assigned</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>

                <input
                  type="text"
                  placeholder="Search customer, phone, email, ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: "1px solid #E5E7EB",
                    fontSize: "13px",
                    width: "280px",
                  }}
                />
              </div>
            </div>

            {/* Inquiries Table */}
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>INQUIRY ID</th>
                    <th>CUSTOMER CONTACT</th>
                    <th>SERVICE TYPE</th>
                    <th>PROPERTY / DETAILS</th>
                    <th>BUDGET</th>
                    <th>ASSIGNED TEAM MEMBER</th>
                    <th>STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "#6B7280" }}>
                        Loading inquiries...
                      </td>
                    </tr>
                  ) : filteredInquiries.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: "50px", color: "#6B7280" }}>
                        <div style={{ fontSize: "28px", marginBottom: "8px" }}>🛎️</div>
                        <div style={{ fontWeight: "600", fontSize: "15px", color: "#111827" }}>No service inquiries found</div>
                        <p style={{ margin: "4px 0 16px 0", fontSize: "13px" }}>
                          Requests submitted by investors via the mobile app or web concierge will appear here.
                        </p>
                        <button
                          onClick={() => setShowAddInquiryModal(true)}
                          style={{
                            padding: "8px 16px",
                            backgroundColor: "#111827",
                            color: "#FFF",
                            borderRadius: "6px",
                            border: "none",
                            fontSize: "13px",
                            fontWeight: "600",
                            cursor: "pointer",
                          }}
                        >
                          + Log First Inquiry
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredInquiries.map((inq) => (
                      <tr
                        key={inq.id}
                        style={{ cursor: "pointer" }}
                        onClick={() => setSelectedInquiry(inq)}
                      >
                        <td style={{ fontWeight: "700", color: "#D4AF37", fontSize: "12px" }}>
                          #{inq.id.substring(0, 8)}
                        </td>
                        <td>
                          <div style={{ fontWeight: "700", color: "#111827" }}>{inq.customerName}</div>
                          <div style={{ fontSize: "12px", color: "#6B7280" }}>{inq.phone || inq.email}</div>
                        </td>
                        <td>
                          <span
                            style={{
                              backgroundColor: `${serviceTypeColors[inq.serviceType] || "#4B5563"}15`,
                              color: serviceTypeColors[inq.serviceType] || "#4B5563",
                              padding: "4px 10px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: "700",
                            }}
                          >
                            {inq.serviceType}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontSize: "13px", color: "#374151" }}>
                            {inq.propertyReference || "General Inquiry"}
                          </div>
                          <div style={{ fontSize: "11px", color: "#9CA3AF" }}>{inq.date}</div>
                        </td>
                        <td style={{ fontWeight: "600", color: "#111827" }}>
                          {inq.estimatedBudget || "Standard"}
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <select
                            value={inq.assignedTo || ""}
                            onChange={(e) => handleAssign(inq.id, e.target.value)}
                            style={{
                              padding: "4px 8px",
                              borderRadius: "6px",
                              border: "1px solid #E5E7EB",
                              fontSize: "12px",
                              backgroundColor: "#F9FAFB",
                              color: inq.assignedTo ? "#111827" : "#9CA3AF",
                              fontWeight: "500",
                            }}
                          >
                            <option value="">Unassigned</option>
                            {teamMembers.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.full_name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <select
                            value={inq.status}
                            onChange={(e) => handleUpdateStatus(inq.id, e.target.value as any)}
                            style={{
                              padding: "4px 8px",
                              borderRadius: "6px",
                              border: "1px solid transparent",
                              fontSize: "12px",
                              fontWeight: "700",
                              backgroundColor:
                                inq.status === "New"
                                  ? "#FEE2E2"
                                  : inq.status === "In Review"
                                  ? "#FEF3C7"
                                  : inq.status === "Assigned"
                                  ? "#DBEAFE"
                                  : inq.status === "Completed"
                                  ? "#D1FAE5"
                                  : "#F3F4F6",
                              color:
                                inq.status === "New"
                                  ? "#991B1B"
                                  : inq.status === "In Review"
                                  ? "#92400E"
                                  : inq.status === "Assigned"
                                  ? "#1E40AF"
                                  : inq.status === "Completed"
                                  ? "#065F46"
                                  : "#4B5563",
                            }}
                          >
                            <option value="New">New</option>
                            <option value="In Review">In Review</option>
                            <option value="Assigned">Assigned</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button
                              onClick={() => setSelectedInquiry(inq)}
                              style={{
                                padding: "4px 8px",
                                background: "none",
                                border: "1px solid #E5E7EB",
                                borderRadius: "4px",
                                fontSize: "11px",
                                cursor: "pointer",
                              }}
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleDeleteInquiry(inq.id)}
                              style={{
                                padding: "4px 8px",
                                background: "none",
                                border: "1px solid #FCA5A5",
                                color: "#DC2626",
                                borderRadius: "4px",
                                fontSize: "11px",
                                cursor: "pointer",
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Tab 2: Catalog View */}
        {activeTab === "catalog" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <p style={{ margin: 0, color: "#4B5563", fontSize: "14px" }}>
                Services displayed in the mobile app and investor portal home concierge strip.
              </p>
              <button
                onClick={openCreateService}
                style={{
                  backgroundColor: "#111827",
                  color: "#FFFFFF",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "none",
                  fontWeight: "600",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                + Add Service Offering
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
              {catalog.map((service) => (
                <div
                  key={service.id}
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: "12px",
                    border: "1px solid #E5E7EB",
                    overflow: "hidden",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div style={{ height: "160px", position: "relative", backgroundColor: "#F3F4F6" }}>
                    <img
                      src={service.image_url}
                      alt={service.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        top: "12px",
                        left: "12px",
                        backgroundColor: "rgba(17, 24, 39, 0.85)",
                        color: "#FFFFFF",
                        padding: "4px 10px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: "700",
                      }}
                    >
                      {service.category}
                    </div>

                    <div
                      style={{
                        position: "absolute",
                        top: "12px",
                        right: "12px",
                        backgroundColor: service.is_active ? "#D1FAE5" : "#F3F4F6",
                        color: service.is_active ? "#065F46" : "#6B7280",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: "700",
                      }}
                    >
                      {service.is_active ? "● Active" : "○ Hidden"}
                    </div>
                  </div>

                  <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                      <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#111827" }}>
                        {service.title}
                      </h3>
                      {service.pricing && (
                        <span
                          style={{
                            backgroundColor: "#FEF3C7",
                            color: "#92400E",
                            padding: "3px 8px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: "700",
                          }}
                        >
                          {service.pricing}
                        </span>
                      )}
                    </div>

                    <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: "#6B7280", lineHeight: "1.5", flex: 1 }}>
                      {service.description || "No description provided."}
                    </p>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #F3F4F6", paddingTop: "12px" }}>
                      <button
                        onClick={() => handleToggleServiceActive(service)}
                        style={{
                          backgroundColor: "transparent",
                          border: "none",
                          color: service.is_active ? "#DC2626" : "#059669",
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: "pointer",
                        }}
                      >
                        {service.is_active ? "Deactivate" : "Activate"}
                      </button>

                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => openEditService(service)}
                          style={{
                            padding: "6px 12px",
                            backgroundColor: "#F3F4F6",
                            border: "1px solid #E5E7EB",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "600",
                            cursor: "pointer",
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteService(service.id)}
                          style={{
                            padding: "6px 12px",
                            backgroundColor: "#FEE2E2",
                            border: "1px solid #FCA5A5",
                            color: "#DC2626",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "600",
                            cursor: "pointer",
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Modal: Add Inquiry */}
        {showAddInquiryModal && (
          <div style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}>
            <div style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "12px",
              padding: "24px",
              width: "100%",
              maxWidth: "500px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>Log Service Inquiry / Lead</h2>
                <button onClick={() => setShowAddInquiryModal(false)} style={{ border: "none", background: "none", fontSize: "18px", cursor: "pointer" }}>✕</button>
              </div>

              <form onSubmit={handleCreateInquiry}>
                <div style={{ marginBottom: "12px" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "4px" }}>Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={inquiryForm.customer_name}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, customer_name: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #D1D5DB", borderRadius: "6px" }}
                    placeholder="e.g. Ramesh Patel"
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "4px" }}>Phone Number *</label>
                    <input
                      type="text"
                      required
                      value={inquiryForm.phone}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", border: "1px solid #D1D5DB", borderRadius: "6px" }}
                      placeholder="9876543210"
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "4px" }}>Email Address</label>
                    <input
                      type="email"
                      value={inquiryForm.email}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", border: "1px solid #D1D5DB", borderRadius: "6px" }}
                      placeholder="ramesh@gmail.com"
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "4px" }}>Service Type</label>
                    <select
                      value={inquiryForm.service_type}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, service_type: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", border: "1px solid #D1D5DB", borderRadius: "6px", backgroundColor: "#FFF" }}
                    >
                      <option value="Interior Design">Interior Design</option>
                      <option value="Property Mgmt">Property Mgmt</option>
                      <option value="Home Loans">Home Loans & Finance</option>
                      <option value="Legal Advisory">Legal Advisory</option>
                      <option value="General Consultation">General Consultation</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "4px" }}>Estimated Budget</label>
                    <input
                      type="text"
                      value={inquiryForm.estimated_budget}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, estimated_budget: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", border: "1px solid #D1D5DB", borderRadius: "6px" }}
                      placeholder="e.g. ₹5,00,000"
                    />
                  </div>
                </div>

                <div style={{ marginBottom: "12px" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "4px" }}>Property Reference (Optional)</label>
                  <input
                    type="text"
                    value={inquiryForm.property_reference}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, property_reference: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #D1D5DB", borderRadius: "6px" }}
                    placeholder="e.g. Prestige Lakeside Habitat - Unit 4B"
                  />
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "4px" }}>Consultation Notes</label>
                  <textarea
                    rows={3}
                    value={inquiryForm.notes}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, notes: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #D1D5DB", borderRadius: "6px", fontSize: "13px" }}
                    placeholder="Customer requirements, preferred call-back timings, etc."
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setShowAddInquiryModal(false)}
                    style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #D1D5DB", backgroundColor: "#FFF", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ padding: "8px 16px", borderRadius: "6px", border: "none", backgroundColor: "#111827", color: "#FFF", fontWeight: "600", cursor: "pointer" }}
                  >
                    Save Inquiry
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Add/Edit Service Offering */}
        {showAddServiceModal && (
          <div style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}>
            <div style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "12px",
              padding: "24px",
              width: "100%",
              maxWidth: "520px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>
                  {editingService ? "Edit Premium Service" : "Add New Premium Service"}
                </h2>
                <button onClick={() => setShowAddServiceModal(false)} style={{ border: "none", background: "none", fontSize: "18px", cursor: "pointer" }}>✕</button>
              </div>

              <form onSubmit={handleSaveService}>
                <div style={{ marginBottom: "12px" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "4px" }}>Service Title *</label>
                  <input
                    type="text"
                    required
                    value={serviceForm.title}
                    onChange={(e) => setServiceForm({ ...serviceForm, title: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #D1D5DB", borderRadius: "6px" }}
                    placeholder="e.g. Legal & Title Verification"
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "4px" }}>Category</label>
                    <input
                      type="text"
                      value={serviceForm.category}
                      onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", border: "1px solid #D1D5DB", borderRadius: "6px" }}
                      placeholder="e.g. Legal Advisory"
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "4px" }}>Pricing Badge</label>
                    <input
                      type="text"
                      value={serviceForm.pricing}
                      onChange={(e) => setServiceForm({ ...serviceForm, pricing: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", border: "1px solid #D1D5DB", borderRadius: "6px" }}
                      placeholder="e.g. Free Consultation / Starts ₹800"
                    />
                  </div>
                </div>

                <div style={{ marginBottom: "12px" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "4px" }}>Description</label>
                  <textarea
                    rows={3}
                    value={serviceForm.description}
                    onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #D1D5DB", borderRadius: "6px", fontSize: "13px" }}
                    placeholder="Describe the scope and deliverables of this premium service."
                  />
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "4px" }}>Image URL or Upload *</label>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "6px" }}>
                    <input
                      type="text"
                      required
                      value={serviceForm.image_url}
                      onChange={(e) => setServiceForm({ ...serviceForm, image_url: e.target.value })}
                      style={{ flex: 1, padding: "8px 12px", border: "1px solid #D1D5DB", borderRadius: "6px", fontSize: "12px" }}
                      placeholder="https://images.unsplash.com/..."
                    />
                    <label style={{
                      padding: "8px 12px",
                      backgroundColor: "#F3F4F6",
                      border: "1px solid #D1D5DB",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "600",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center"
                    }}>
                      {uploadingImage ? "Uploading..." : "Upload File"}
                      <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
                    </label>
                  </div>
                  {serviceForm.image_url && (
                    <div style={{ width: "100%", height: "90px", borderRadius: "6px", overflow: "hidden", border: "1px solid #E5E7EB" }}>
                      <img src={serviceForm.image_url} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={serviceForm.is_active}
                      onChange={(e) => setServiceForm({ ...serviceForm, is_active: e.target.checked })}
                    />
                    Active in Mobile & Investor App
                  </label>

                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "12px", color: "#6B7280" }}>Sort Order:</span>
                    <input
                      type="number"
                      value={serviceForm.sort_order}
                      onChange={(e) => setServiceForm({ ...serviceForm, sort_order: parseInt(e.target.value) || 0 })}
                      style={{ width: "60px", padding: "4px 8px", border: "1px solid #D1D5DB", borderRadius: "4px", fontSize: "12px" }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setShowAddServiceModal(false)}
                    style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #D1D5DB", backgroundColor: "#FFF", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ padding: "8px 16px", borderRadius: "6px", border: "none", backgroundColor: "#D4AF37", color: "#111827", fontWeight: "700", cursor: "pointer" }}
                  >
                    {editingService ? "Update Service" : "Add Service"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Drawer: Inquiry Details */}
        {selectedInquiry && (
          <div style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.4)",
            display: "flex",
            justifyContent: "flex-end",
            zIndex: 1000,
          }}>
            <div style={{
              width: "100%",
              maxWidth: "460px",
              backgroundColor: "#FFFFFF",
              height: "100%",
              padding: "24px",
              boxShadow: "-4px 0 20px rgba(0,0,0,0.15)",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #E5E7EB", paddingBottom: "12px" }}>
                <div>
                  <span style={{ fontSize: "11px", fontWeight: "800", color: "#D4AF37", letterSpacing: "0.5px" }}>
                    INQUIRY #{selectedInquiry.id.substring(0, 8)}
                  </span>
                  <h2 style={{ margin: "2px 0 0 0", fontSize: "18px", fontWeight: "800", color: "#111827" }}>
                    {selectedInquiry.customerName}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedInquiry(null)}
                  style={{ border: "none", background: "none", fontSize: "20px", cursor: "pointer", color: "#6B7280" }}
                >
                  ✕
                </button>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ backgroundColor: "#F9FAFB", padding: "16px", borderRadius: "8px", marginBottom: "16px" }}>
                  <div style={{ fontSize: "11px", fontWeight: "700", color: "#6B7280", textTransform: "uppercase", marginBottom: "4px" }}>
                    Requested Service
                  </div>
                  <div style={{ fontSize: "15px", fontWeight: "800", color: serviceTypeColors[selectedInquiry.serviceType] || "#111827" }}>
                    {selectedInquiry.serviceType}
                  </div>
                  <div style={{ fontSize: "12px", color: "#4B5563", marginTop: "2px" }}>
                    Budget: {selectedInquiry.estimatedBudget || "Standard"}
                  </div>
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <div style={{ fontSize: "11px", fontWeight: "700", color: "#6B7280", textTransform: "uppercase", marginBottom: "4px" }}>
                    Contact Information
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "#111827" }}>📞 {selectedInquiry.phone || "No phone provided"}</div>
                  {selectedInquiry.email && <div style={{ fontSize: "13px", color: "#4B5563", marginTop: "2px" }}>✉️ {selectedInquiry.email}</div>}
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <div style={{ fontSize: "11px", fontWeight: "700", color: "#6B7280", textTransform: "uppercase", marginBottom: "4px" }}>
                    Property Reference
                  </div>
                  <div style={{ fontSize: "13px", color: "#374151" }}>
                    {selectedInquiry.propertyReference || "General Consultation / Not linked to specific property"}
                  </div>
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <div style={{ fontSize: "11px", fontWeight: "700", color: "#6B7280", textTransform: "uppercase", marginBottom: "4px" }}>
                    Assign Team Member
                  </div>
                  <select
                    value={selectedInquiry.assignedTo || ""}
                    onChange={(e) => handleAssign(selectedInquiry.id, e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #D1D5DB", backgroundColor: "#FFF" }}
                  >
                    <option value="">Unassigned</option>
                    {teamMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <div style={{ fontSize: "11px", fontWeight: "700", color: "#6B7280", textTransform: "uppercase", marginBottom: "4px" }}>
                    Status Workflow
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
                    {(["New", "In Review", "Assigned", "Completed", "Cancelled"] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => handleUpdateStatus(selectedInquiry.id, st)}
                        style={{
                          padding: "6px 8px",
                          borderRadius: "6px",
                          border: selectedInquiry.status === st ? "2px solid #111827" : "1px solid #E5E7EB",
                          backgroundColor: selectedInquiry.status === st ? "#111827" : "#F9FAFB",
                          color: selectedInquiry.status === st ? "#FFFFFF" : "#374151",
                          fontSize: "11px",
                          fontWeight: "700",
                          cursor: "pointer",
                        }}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <div style={{ fontSize: "11px", fontWeight: "700", color: "#6B7280", textTransform: "uppercase", marginBottom: "4px" }}>
                    Internal Consultation Notes
                  </div>
                  <textarea
                    rows={4}
                    defaultValue={selectedInquiry.notes || ""}
                    onBlur={(e) => handleSaveInquiryNotes(selectedInquiry.id, e.target.value)}
                    placeholder="Add follow-up notes, customer budget requirements, or inspection schedules..."
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #D1D5DB", borderRadius: "6px", fontSize: "13px" }}
                  />
                  <span style={{ fontSize: "11px", color: "#9CA3AF" }}>Notes auto-save when you click away.</span>
                </div>
              </div>

              <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: "16px", display: "flex", justifyContent: "space-between" }}>
                <button
                  onClick={() => handleDeleteInquiry(selectedInquiry.id)}
                  style={{
                    backgroundColor: "#FEE2E2",
                    color: "#DC2626",
                    border: "1px solid #FCA5A5",
                    padding: "8px 16px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Delete Inquiry
                </button>

                <button
                  onClick={() => setSelectedInquiry(null)}
                  style={{
                    backgroundColor: "#111827",
                    color: "#FFFFFF",
                    border: "none",
                    padding: "8px 20px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
