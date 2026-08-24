"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./AdminLayout.module.css";

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const pathname = usePathname();

  const navItems = [
    { name: "Overview", path: "/", icon: "📊" },
    { name: "Properties & Shares", path: "/properties", icon: "🏢" },
    { name: "Investors & KYC", path: "/investors", icon: "👥" },
    { name: "Employees (RBAC)", path: "/employees", icon: "👔" },
    { name: "Agents & Commissions", path: "/agents", icon: "🤝" },
    { name: "Financial Ledger", path: "/ledger", icon: "💰" },
    { name: "Additional Services", path: "/services", icon: "🛎️" },
    { name: "Notifications Hub", path: "/notifications", icon: "📢" },
    { name: "Content & Banners", path: "/cms", icon: "🎨" },
    { name: "System Settings", path: "/settings", icon: "⚙️" },
  ];

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>◆</span>
          <span>RealShare</span>
        </div>
        <div className={styles.navLabel}>MANAGEMENT CONSOLE</div>
        <nav className={styles.nav}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`${styles.navItem} ${
                pathname === item.path ? styles.active : ""
              }`}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navText}>{item.name}</span>
            </Link>
          ))}
        </nav>
        <div className={styles.sidebarFooter}>
          <div className={styles.adminInfo}>
            <div className={styles.adminAvatar}>RS</div>
            <div>
              <div className={styles.adminName}>Super Admin</div>
              <div className={styles.adminRole}>Hyderabad HQ (Nizampet)</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={styles.main}>
        {/* Header */}
        <header className={styles.header}>
          <div>
            <h1 className={styles.headerTitle}>{title}</h1>
            <p className={styles.headerSubtitle}>RealShare Properties Management Portal</p>
          </div>
          <div className={styles.headerActions}>
            <div className={styles.searchBar}>
              <span className={styles.searchIcon}>🔍</span>
              <input type="text" placeholder="Search investor, property, transaction..." className={styles.searchInput} />
            </div>
            <Link href="/notifications" className={styles.notifBtn} title="Notifications">
              🔔<span className={styles.notifDot} />
            </Link>
            <div className={styles.userProfile}>
              <div className={styles.avatar}>A</div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <section className={styles.content}>{children}</section>
      </main>
    </div>
  );
}
