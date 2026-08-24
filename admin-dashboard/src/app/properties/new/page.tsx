import React from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import styles from "./NewProperty.module.css";
import Link from "next/link";

export default function AddNewProperty() {
  return (
    <AdminLayout title="Add New Property">
      <div className={styles.formContainer}>
        
        <div className={styles.sectionTitle}>Basic Information</div>
        <div className={styles.grid}>
          <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <label className={styles.label}>Property Title</label>
            <input type="text" className={styles.input} placeholder="e.g. Goa Beachfront Villa" />
          </div>
          <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <label className={styles.label}>Description</label>
            <textarea className={`${styles.input} ${styles.textarea}`} placeholder="Describe the property..."></textarea>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Property Type</label>
            <select className={styles.input}>
              <option>Commercial</option>
              <option>Holiday Home</option>
              <option>International</option>
            </select>
          </div>
        </div>

        <div className={styles.sectionTitle}>Geographic Location (Hierarchical)</div>
        <div className={styles.grid}>
          <div className={styles.formGroup}>
            <label className={styles.label}>State</label>
            <input type="text" className={styles.input} placeholder="e.g. Maharashtra" />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>District</label>
            <input type="text" className={styles.input} placeholder="e.g. Mumbai Suburban" />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Locality / City</label>
            <input type="text" className={styles.input} placeholder="e.g. Bandra West" />
          </div>
          <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <label className={styles.label}>Map Coordinates (Lat / Lng)</label>
            <div style={{ display: "flex", gap: "12px" }}>
              <input type="text" className={styles.input} placeholder="Latitude (e.g. 19.0760)" style={{ flex: 1 }} />
              <input type="text" className={styles.input} placeholder="Longitude (e.g. 72.8777)" style={{ flex: 1 }} />
              <button className={styles.submitButton} style={{ padding: "12px 16px" }}>Pin on Map</button>
            </div>
          </div>
          <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <div className={styles.mapPreview}>
              [Interactive Map Preview will render here]
            </div>
          </div>
        </div>

        <div className={styles.sectionTitle}>Financials & Fractions</div>
        <div className={styles.grid}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Total Fractions Available</label>
            <input type="number" className={styles.input} placeholder="e.g. 50" />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Price per Fraction (₹)</label>
            <input type="number" className={styles.input} placeholder="e.g. 500000" />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Assured Rental Yield (%)</label>
            <input type="number" className={styles.input} placeholder="e.g. 8.5" />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Target IRR (%)</label>
            <input type="number" className={styles.input} placeholder="e.g. 14.0" />
          </div>
        </div>

        <div className={styles.actions}>
          <Link href="/properties" className={styles.cancelButton}>
            Cancel
          </Link>
          <button className={styles.submitButton}>
            Save Property
          </button>
        </div>

      </div>
    </AdminLayout>
  );
}
