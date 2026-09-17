"use client";
import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { getAuthHeader } from "@/lib/api-auth";
import styles from "../properties/Properties.module.css";

interface ServiceInquiry {
  id: string;
  customer_name: string;
  phone: string | null;
  email: string | null;
  service_type: string;
  property_reference: string | null;
  estimated_budget: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

export default function ServicesInquiriesPage() {
  const [inquiries, setInquiries] = useState<ServiceInquiry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadInquiries = async () => {
    setLoading(true);
    try {
      const authHeader = await getAuthHeader();
      const res = await fetch("/api/forms/services", { headers: authHeader || {} });
      if (res.ok) {
        const data = await res.json();
        setInquiries(Array.isArray(data) ? data : []);
      } else {
        setInquiries([]);
      }
    } catch (err) {
      console.error("Failed to load service inquiries:", err);
      setInquiries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInquiries();
  }, []);

  return (
    <AdminLayout title="Premium Services Inquiries">
      <div className={styles.header}>
        <div>
          <div className={styles.title}>Premium Services</div>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Customer</th>
              <th className={styles.th}>Service Type</th>
              <th className={styles.th}>Contact Info</th>
              <th className={styles.th}>Details / Notes</th>
              <th className={styles.th}>Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className={styles.td} colSpan={5}>Loading inquiries...</td>
              </tr>
            ) : inquiries.length === 0 ? (
              <tr>
                <td className={styles.td} colSpan={5}>No inquiries found.</td>
              </tr>
            ) : (
              inquiries.map((inq) => (
                <tr key={inq.id} className={styles.tr}>
                  <td className={styles.td}>
                    <strong>{inq.customer_name}</strong>
                  </td>
                  <td className={styles.td}>
                    <span className={styles.badge} style={{ background: "#EFF6FF", color: "#2563EB" }}>
                      {inq.service_type}
                    </span>
                  </td>
                  <td className={styles.td}>
                    {inq.email && <div style={{ fontSize: "0.8rem", color: "#475569" }}>{inq.email}</div>}
                    {inq.phone && <div style={{ fontSize: "0.8rem", color: "#475569" }}>{inq.phone}</div>}
                  </td>
                  <td className={styles.td}>
                    {inq.property_reference && <div style={{ fontSize: "0.8rem", marginBottom: "4px" }}><strong>Ref:</strong> {inq.property_reference}</div>}
                    {inq.estimated_budget && <div style={{ fontSize: "0.8rem", marginBottom: "4px" }}><strong>Budget:</strong> {inq.estimated_budget}</div>}
                    {inq.notes && <div style={{ fontSize: "0.8rem", color: "#64748B" }}>{inq.notes}</div>}
                  </td>
                  <td className={styles.td}>
                    {new Date(inq.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
