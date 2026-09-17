"use client";
import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { getAuthHeader } from "@/lib/api-auth";
import styles from "../properties/Properties.module.css";

interface PartnerApplication {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  primary_market: string;
  company: string | null;
  status: string;
  created_at: string;
}

export default function PartnerApplicationsPage() {
  const [applications, setApplications] = useState<PartnerApplication[]>([]);
  const [loading, setLoading] = useState(true);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const authHeader = await getAuthHeader();
      const res = await fetch("/api/forms/partners", { headers: authHeader || {} });
      if (res.ok) {
        const data = await res.json();
        setApplications(Array.isArray(data) ? data : []);
      } else {
        setApplications([]);
      }
    } catch (err) {
      console.error("Failed to load partner applications:", err);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  return (
    <AdminLayout title="Partner Applications">
      <div className={styles.header}>
        <div>
          <div className={styles.title}>Partner Applications</div>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Name</th>
              <th className={styles.th}>Company</th>
              <th className={styles.th}>Contact</th>
              <th className={styles.th}>Primary Market</th>
              <th className={styles.th}>Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className={styles.td} colSpan={5}>Loading applications...</td>
              </tr>
            ) : applications.length === 0 ? (
              <tr>
                <td className={styles.td} colSpan={5}>No partner applications found.</td>
              </tr>
            ) : (
              applications.map((app) => (
                <tr key={app.id} className={styles.tr}>
                  <td className={styles.td}>
                    <strong>{app.full_name}</strong>
                  </td>
                  <td className={styles.td}>
                    {app.company || "—"}
                  </td>
                  <td className={styles.td}>
                    <div style={{ fontSize: "0.8rem", color: "#475569" }}>{app.email}</div>
                    <div style={{ fontSize: "0.8rem", color: "#475569" }}>{app.phone}</div>
                  </td>
                  <td className={styles.td}>
                    {app.primary_market}
                  </td>
                  <td className={styles.td}>
                    {new Date(app.created_at).toLocaleDateString()}
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
