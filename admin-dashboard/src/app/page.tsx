"use client";
import React from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import styles from "./Dashboard.module.css";

const recentActivity = [
  { id: 1, user: "Arjun Kumar", action: "invested ₹15,00,000 in", target: "Goa Beachfront Villa", detail: "10 fractions", time: "2 hours ago", avatar: "AK", color: "#2563EB" },
  { id: 2, user: "Priya Sharma", action: "invested ₹20,00,000 in", target: "Cyber Pearl Tech Park", detail: "4 fractions", time: "5 hours ago", avatar: "PS", color: "#7C3AED" },
  { id: 3, user: "Rohan Mehta", action: "invested ₹50,00,000 in", target: "Marina Bay Luxury Condo", detail: "2 fractions", time: "1 day ago", avatar: "RM", color: "#059669" },
  { id: 4, user: "Anjali Desai", action: "completed", target: "KYC Verification", detail: "Aadhaar + PAN", time: "1 day ago", avatar: "AD", color: "#D97706" },
  { id: 5, user: "System", action: "credited ₹81,250 yield payout to", target: "45 active wallets", detail: "Q3 2023", time: "3 days ago", avatar: "SY", color: "#0F172A" },
];

const topProperties = [
  { name: "Goa Beachfront Villa", investors: 38, raised: "₹1.8 Cr", progress: 67, image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=100&h=60&fit=crop" },
  { name: "Cyber Pearl Tech Park", investors: 92, raised: "₹4.6 Cr", progress: 76, image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100&h=60&fit=crop" },
  { name: "Marina Bay Luxury Condo", investors: 24, raised: "₹6.0 Cr", progress: 60, image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=100&h=60&fit=crop" },
  { name: "Mountain View Resort", investors: 56, raised: "₹1.7 Cr", progress: 87, image: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=100&h=60&fit=crop" },
];

export default function Home() {
  return (
    <AdminLayout title="Overview Dashboard">
      {/* KPI Cards */}
      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.cardIcon} style={{ background: "rgba(37, 99, 235, 0.1)", color: "#2563EB" }}>🏢</div>
          <div>
            <div className={styles.cardTitle}>Total Properties</div>
            <div className={styles.cardValue}>24</div>
            <div className={styles.cardTrend} style={{ color: "#16A34A" }}>↑ 12% <span>vs last month</span></div>
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardIcon} style={{ background: "rgba(124, 58, 237, 0.1)", color: "#7C3AED" }}>👥</div>
          <div>
            <div className={styles.cardTitle}>Active Investors</div>
            <div className={styles.cardValue}>1,402</div>
            <div className={styles.cardTrend} style={{ color: "#16A34A" }}>↑ 23% <span>vs last month</span></div>
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardIcon} style={{ background: "rgba(5, 150, 105, 0.1)", color: "#059669" }}>💰</div>
          <div>
            <div className={styles.cardTitle}>Total Investments</div>
            <div className={styles.cardValue}>₹45.2 Cr</div>
            <div className={styles.cardTrend} style={{ color: "#16A34A" }}>↑ 8.4% <span>vs last month</span></div>
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardIcon} style={{ background: "rgba(217, 119, 6, 0.1)", color: "#D97706" }}>📈</div>
          <div>
            <div className={styles.cardTitle}>Avg. Yield</div>
            <div className={styles.cardValue}>8.4%</div>
            <div className={styles.cardTrend} style={{ color: "#DC2626" }}>↓ 0.2% <span>vs last month</span></div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className={styles.twoCol}>
        {/* Top Properties */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>Top Performing Properties</div>
            <button className={styles.viewAllBtn}>View All →</button>
          </div>
          <div className={styles.propertyList}>
            {topProperties.map((prop, i) => (
              <div key={i} className={styles.propertyRow}>
                <img src={prop.image} alt={prop.name} className={styles.propertyThumb} />
                <div className={styles.propertyInfo}>
                  <div className={styles.propertyName}>{prop.name}</div>
                  <div className={styles.propertyMeta}>{prop.investors} investors • {prop.raised} raised</div>
                </div>
                <div className={styles.progressContainer}>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${prop.progress}%` }} />
                  </div>
                  <span className={styles.progressLabel}>{prop.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>Recent Activity</div>
            <button className={styles.viewAllBtn}>View All →</button>
          </div>
          <div className={styles.activityList}>
            {recentActivity.map((act) => (
              <div key={act.id} className={styles.activityRow}>
                <div className={styles.activityAvatar} style={{ background: act.color }}>{act.avatar}</div>
                <div className={styles.activityContent}>
                  <div className={styles.activityText}>
                    <strong>{act.user}</strong> {act.action} <strong>{act.target}</strong>
                  </div>
                  <div className={styles.activityMeta}>{act.detail} • {act.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
