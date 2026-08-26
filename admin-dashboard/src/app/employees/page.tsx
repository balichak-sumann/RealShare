"use client";
import React, { useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import styles from "../properties/Properties.module.css";
import { useAuth } from "@/contexts/AuthContext";

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

const initialEmployees: Employee[] = [
  {
    id: "EMP-101",
    name: "Suresh Varma",
    email: "suresh.v@realshare.in",
    phone: "+91 98480 12345",
    department: "Sales",
    employeeCode: "RS-SALES-01",
    incentiveRatePct: 0.75,
    monthlyTarget: "₹1.50 Cr",
    currentMonthSales: "₹1.15 Cr",
    status: "Active",
    assignedClientsCount: 42,
  },
  {
    id: "EMP-102",
    name: "Lavanya Reddy",
    email: "lavanya.r@realshare.in",
    phone: "+91 98480 23456",
    department: "Support",
    employeeCode: "RS-SUPP-01",
    incentiveRatePct: 0.20,
    monthlyTarget: "400 Tickets",
    currentMonthSales: "348 Resolved",
    status: "Active",
    assignedClientsCount: 180,
  },
  {
    id: "EMP-103",
    name: "Karthik Nambiar",
    email: "karthik.n@realshare.in",
    phone: "+91 98480 34567",
    department: "Accounts",
    employeeCode: "RS-ACCT-01",
    incentiveRatePct: 0.15,
    monthlyTarget: "₹10.0 Cr Audit",
    currentMonthSales: "₹8.4 Cr Disbursed",
    status: "Active",
    assignedClientsCount: 0,
  },
  {
    id: "EMP-104",
    name: "Sneha Rao",
    email: "sneha.r@realshare.in",
    phone: "+91 98480 45678",
    department: "Sales",
    employeeCode: "RS-SALES-02",
    incentiveRatePct: 0.85,
    monthlyTarget: "₹2.00 Cr",
    currentMonthSales: "₹1.85 Cr",
    status: "Active",
    assignedClientsCount: 56,
  },
  {
    id: "EMP-105",
    name: "Ramesh Babu",
    email: "ramesh.b@realshare.in",
    phone: "+91 98480 56789",
    department: "Sales",
    employeeCode: "RS-SALES-03",
    incentiveRatePct: 0.50,
    monthlyTarget: "₹1.00 Cr",
    currentMonthSales: "₹40.0 L",
    status: "Inactive",
    assignedClientsCount: 12,
  },
];

export default function EmployeesPage() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [deptFilter, setDeptFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error" | "info">("success");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Fetch employees from database on load
  React.useEffect(() => {
    async function loadEmployees() {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/admin/employees', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.employees && data.employees.length > 0) {
          const dbEmployees = data.employees.map((e: any, idx: number) => ({
            id: e.id,
            name: e.full_name,
            email: e.email,
            phone: e.phone_number || "+91 00000 00000",
            department: e.employee_department ? (e.employee_department.charAt(0).toUpperCase() + e.employee_department.slice(1)) : "Sales",
            employeeCode: `RS-EMP-${idx + 50}`, // fallback since it's not saved yet in DB schema
            incentiveRatePct: 0.5,
            monthlyTarget: "₹1.00 Cr",
            currentMonthSales: "₹0",
            status: "Active",
            assignedClientsCount: 0,
          }));
          // Merge with initial hardcoded for display purposes
          setEmployees([...dbEmployees, ...initialEmployees]);
        }
      } catch (err) {
        console.error("Failed to fetch employees", err);
      }
    }
    loadEmployees();
  }, [user]);

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

  const handleToggleStatus = (id: string) => {
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.id === id
          ? { ...emp, status: emp.status === "Active" ? "Inactive" : "Active" }
          : emp
      )
    );
    showToast("Employee status updated successfully.");
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmp.name || !newEmp.email) return;

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
        setModalError(data.error || 'Failed to create employee');
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
                onClick={() => {
                  setShowAddModal(false);
                  setModalError(null);
                }}
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

            {modalError && (
              <div style={{ background: "#FEE2E2", color: "#DC2626", padding: "12px", borderRadius: "8px", marginBottom: "12px", fontSize: "0.9rem", fontWeight: 600, border: "1px solid #FCA5A5" }}>
                ⚠️ {modalError}
              </div>
            )}

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
