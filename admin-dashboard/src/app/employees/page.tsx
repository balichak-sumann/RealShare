"use client";
import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import styles from "../properties/Properties.module.css";
import { useAuth } from "@/contexts/AuthContext";
import { getAuthHeader } from "@/lib/api-auth";

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: "Sales" | "Support" | "Accounts";
  employeeCode: string;
  incentiveRatePct: number;
  monthlyTarget: string;
  currentMonthSales: string;
  status: "Active" | "Inactive";
  assignedClientsCount: number;
}

function mapApiEmployee(p: any): Employee {
  const deptMap: Record<string, Employee['department']> = {
    sales: 'Sales',
    support: 'Support',
    accounts: 'Accounts',
  };
  return {
    id: p.id,
    name: p.full_name || 'Unknown',
    email: p.email || '',
    phone: p.phone_number || '',
    department: deptMap[p.employee_department] || 'Sales',
    employeeCode: p.id.slice(0, 8).toUpperCase(),
    incentiveRatePct: 0,
    monthlyTarget: 'Not tracked',
    currentMonthSales: 'Not tracked',
    status: p.is_active ? 'Active' : 'Inactive',
    assignedClientsCount: 0,
  };
}
export default function EmployeesPage() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error" | "info">("success");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadEmployees = async () => {
    setLoading(true);
    const authHeader = await getAuthHeader();
    if (!authHeader) { setLoading(false); return; }
    try {
      const res = await fetch('/api/admin/employees', { headers: authHeader });
      if (res.ok) {
        const data = await res.json();
        setEmployees(Array.isArray(data.employees) ? data.employees.map(mapApiEmployee) : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  // Form State
  const [newEmp, setNewEmp] = useState({
    name: "",
    email: "",
    phone: "",
    department: "Sales" as const,
    employeeCode: `RS-EMP-${Math.floor(10 + Math.random() * 90)}`,
    incentiveRatePct: 0.5,
    monthlyTarget: "₹1.00 Cr",
  });

  const showToast = (msg: string, type: "success" | "error" | "info" = "success") => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(null), 6000);
  };

  const handleToggleStatus = async (id: string) => {
    const target = employees.find((e) => e.id === id);
    if (!target) return;
    const newActive = target.status !== "Active";
    const authHeader = await getAuthHeader();
    if (!authHeader) { showToast("You must be signed in to do that.", "error"); return; }
    try {
      const res = await fetch(`/api/admin/employees/${id}`, {
        method: 'PATCH',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: newActive }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Failed to update status.', "error");
        return;
      }
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === id
            ? { ...emp, status: emp.status === "Active" ? "Inactive" : "Active" }
            : emp
        )
      );
      showToast("Employee status updated successfully.");
    } catch (e) {
      showToast("Failed to update status.", "error");
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmp.name || !newEmp.email) return;

    if (newEmp.phone) {
      const cleanedPhone = newEmp.phone.replace(/\D/g, '').slice(-10);
      if (cleanedPhone.length !== 10 || !/^[6-9]/.test(cleanedPhone)) {
        showToast("❌ Phone number must be a valid 10-digit mobile number starting with 7, 8, 9, or 6.", "error");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Get the admin's auth token
      const token = await user?.getIdToken();

      const response = await fetch('/api/admin/employees', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: newEmp.name,
          email: newEmp.email,
          phone_number: newEmp.phone || undefined,
          department: newEmp.department.toLowerCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(`❌ ${data.error || 'Failed to create employee'}`, "error");
        return;
      }

      // Add to local state
      const created: Employee = {
        id: data.employee.id,
        name: data.employee.full_name,
        email: data.employee.email,
        phone: data.employee.phone_number || "+91 00000 00000",
        department: newEmp.department,
        employeeCode: data.employee.employeeCode,
        incentiveRatePct: Number(newEmp.incentiveRatePct),
        monthlyTarget: newEmp.monthlyTarget,
        currentMonthSales: "₹0",
        status: "Active",
        assignedClientsCount: 0,
      };

      setEmployees([created, ...employees]);
      setShowAddModal(false);

      if (data.emailSent) {
        showToast(
          `✅ Employee "${created.name}" created! Welcome email sent to ${created.email}. Temp Password: ${data.tempPassword}`,
          "success"
        );
      } else {
        showToast(
          `✅ Employee "${created.name}" created! ⚠️ Email not sent. Temp Password: ${data.tempPassword}`,
          "info"
        );
      }

      // Reset form
      setNewEmp({
        name: "",
        email: "",
        phone: "",
        department: "Sales",
        employeeCode: `RS-EMP-${Math.floor(10 + Math.random() * 90)}`,
        incentiveRatePct: 0.5,
        monthlyTarget: "₹1.00 Cr",
      });
    } catch (error: any) {
      showToast(`❌ Error: ${error.message || 'Something went wrong'}`, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = employees.filter((emp) => {
    const matchDept = deptFilter === "All" || emp.department === deptFilter;
    const matchSearch =
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.employeeCode.toLowerCase().includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase());
    return matchDept && matchSearch;
  });

  return (
    <AdminLayout title="Employee Management & Role-Based Permissions">
      {/* Toast Alert */}
      {toastMsg && (
        <div
          style={{
            background: toastType === "error"
              ? "linear-gradient(135deg, #DC2626, #EF4444)"
              : toastType === "info"
                ? "linear-gradient(135deg, #D97706, #F59E0B)"
                : "linear-gradient(135deg, #059669, #10B981)",
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

      {/* Role-Based Overview Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.75rem", color: "#2563EB", fontWeight: 700, textTransform: "uppercase" }}>
              Sales Team (Incentive Tracked)
            </span>
            <span style={{ fontSize: "1.2rem" }}>💼</span>
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "6px", color: "var(--text-primary)" }}>
            {employees.filter((e) => e.department === "Sales").length} Agents
          </div>
          <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: 4 }}>
            Can access assigned customer list & booking commissions
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.75rem", color: "#D97706", fontWeight: 700, textTransform: "uppercase" }}>
              Customer Support Team
            </span>
            <span style={{ fontSize: "1.2rem" }}>🎧</span>
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "6px", color: "var(--text-primary)" }}>
            {employees.filter((e) => e.department === "Support").length} Members
          </div>
          <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: 4 }}>
            Permitted for KYC assistance, customer queries & ticket handling
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.75rem", color: "#059669", fontWeight: 700, textTransform: "uppercase" }}>
              Accounts & Settlement Team
            </span>
            <span style={{ fontSize: "1.2rem" }}>🧾</span>
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "6px", color: "var(--text-primary)" }}>
            {employees.filter((e) => e.department === "Accounts").length} Members
          </div>
          <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: 4 }}>
            Permitted for Escrow reconciliation & yield distribution audits
          </div>
        </div>
      </div>

      {/* Header controls */}
      <div className={styles.header}>
        <div className={styles.title}>All Employees & Team Roles ({filtered.length})</div>
        <div className={styles.headerRight}>
          <div className={styles.filterGroup}>
            {["All", "Sales", "Support", "Accounts"].map((d) => (
              <button
                key={d}
                className={`${styles.filterPill} ${deptFilter === d ? styles.filterActive : ""}`}
                onClick={() => setDeptFilter(d)}
              >
                {d}
              </button>
            ))}
          </div>
          <button className={styles.addButton} onClick={() => setShowAddModal(true)}>
            + Create Employee Account
          </button>
        </div>
      </div>

      <div className={styles.searchBar}>
        <span>🔍</span>
        <input
          type="text"
          placeholder="Search employees by name, code, or department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Employees Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Employee Name & ID</th>
              <th className={styles.th}>Department & Role</th>
              <th className={styles.th}>Incentive Code</th>
              <th className={styles.th}>Commission / Incentive</th>
              <th className={styles.th}>Performance (Current MTD)</th>
              <th className={styles.th}>Assigned Clients</th>
              <th className={styles.th}>Status</th>
              <th className={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((emp) => (
              <tr key={emp.id} className={styles.tr}>
                <td className={styles.td}>
                  <strong>{emp.name}</strong>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                    {emp.email} • {emp.phone}
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
                        emp.department === "Sales"
                          ? "#EFF6FF"
                          : emp.department === "Support"
                            ? "#FEF3C7"
                            : "#ECFDF5",
                      color:
                        emp.department === "Sales"
                          ? "#2563EB"
                          : emp.department === "Support"
                            ? "#D97706"
                            : "#059669",
                    }}
                  >
                    {emp.department}
                  </span>
                </td>
                <td className={styles.td}>
                  <code style={{ background: "#F1F5F9", padding: "3px 6px", borderRadius: 4, fontWeight: 700 }}>
                    {emp.employeeCode}
                  </code>
                </td>
                <td className={styles.td}>
                  <strong>{emp.incentiveRatePct}%</strong> of booking volume
                </td>
                <td className={styles.td}>
                  <div>
                    <strong>{emp.currentMonthSales}</strong> / {emp.monthlyTarget}
                  </div>
                </td>
                <td className={styles.td}>
                  <strong>{emp.assignedClientsCount}</strong> Investors
                </td>
                <td className={styles.td}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      background: emp.status === "Active" ? "#DCFCE7" : "#FEE2E2",
                      color: emp.status === "Active" ? "#15803D" : "#B91C1C",
                    }}
                  >
                    {emp.status}
                  </span>
                </td>
                <td className={styles.td}>
                  <button
                    onClick={() => handleToggleStatus(emp.id)}
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
                    {emp.status === "Active" ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Employee Modal */}
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
                Create New Employee & Role
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

            <form onSubmit={handleAddEmployee} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Reddy"
                  value={newEmp.name}
                  onChange={(e) => setNewEmp({ ...newEmp, name: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1", marginTop: "4px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>Work Email</label>
                  <input
                    type="email"
                    required
                    placeholder="name@realshare.in"
                    value={newEmp.email}
                    onChange={(e) => setNewEmp({ ...newEmp, email: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1", marginTop: "4px" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>Phone Number</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98480..."
                    value={newEmp.phone}
                    onChange={(e) => setNewEmp({ ...newEmp, phone: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1", marginTop: "4px" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>Department & Role</label>
                  <select
                    value={newEmp.department}
                    onChange={(e) => setNewEmp({ ...newEmp, department: e.target.value as any })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1", marginTop: "4px" }}
                  >
                    <option value="Sales">Sales Executive</option>
                    <option value="Support">Customer Support</option>
                    <option value="Accounts">Accounts & Finance</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>Unique Incentive Code</label>
                  <input
                    type="text"
                    required
                    value={newEmp.employeeCode}
                    onChange={(e) => setNewEmp({ ...newEmp, employeeCode: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1", marginTop: "4px" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>Sales Incentive (% Rate)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={newEmp.incentiveRatePct}
                    onChange={(e) => setNewEmp({ ...newEmp, incentiveRatePct: Number(e.target.value) })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1", marginTop: "4px" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>Monthly Target</label>
                  <input
                    type="text"
                    value={newEmp.monthlyTarget}
                    onChange={(e) => setNewEmp({ ...newEmp, monthlyTarget: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1", marginTop: "4px" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "14px" }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: "10px 16px", borderRadius: "8px", border: "1px solid #CBD5E1", background: "#fff", cursor: "pointer", fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ padding: "10px 24px", borderRadius: "8px", background: isSubmitting ? "#94A3B8" : "#2563EB", color: "#fff", border: "none", cursor: isSubmitting ? "not-allowed" : "pointer", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}
                >
                  {isSubmitting ? "Creating & Sending Email..." : "Create Account & Send Welcome Email"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
