"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import styles from "./AdminLayout.module.css";

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const pathname = usePathname();
  const { user, userProfile, logout } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems = React.useMemo(() => {
    const allItems = [
      { name: "Overview", path: "/", icon: "📊" },
      { name: "Properties & Shares", path: "/properties", icon: "🏢" },
      { name: "Featured Properties", path: "/featured-properties", icon: "⭐" },
      { name: "Developers", path: "/developers", icon: "🏗️" },
      { name: "Users & KYC", path: "/buyers", icon: "👥" },
      { name: "Account Approvals", path: "/approvals", icon: "✅" },
      { name: "Employees (RBAC)", path: "/employees", icon: "👔" },
      { name: "Agents & Commissions", path: "/agents", icon: "🤝" },
      { name: "Referral Tracking", path: "/referrals", icon: "🔗" },
      { name: "Financial Ledger", path: "/ledger", icon: "💰" },
      { name: "Additional Services", path: "/services", icon: "🛎️" },
      { name: "Services Inquiries", path: "/services-inquiries", icon: "✨" },
      { name: "Partner Apps", path: "/partner-applications", icon: "🤝" },
      { name: "Contact Messages", path: "/contact-messages", icon: "📧" },
      { name: "Property Requests", path: "/property-requests", icon: "🏠" },
      { name: "Support Tickets", path: "/tickets", icon: "🎫" },
      { name: "Messages", path: "/messages", icon: "💬" },
      { name: "Notifications Hub", path: "/notifications", icon: "📢" },
      { name: "Content & Banners", path: "/cms", icon: "🎨" },
      { name: "System Settings", path: "/settings", icon: "⚙️" },
      { name: "Audit Logs", path: "/audit-logs", icon: "📝" }, // New audit log page
    ];

    if (userProfile?.role === 'admin') {
      return allItems;
    }

    const dept = userProfile?.employee_department;
    if (dept === 'sales') {
      return allItems.filter(item => ['/', '/properties', '/featured-properties', '/developers', '/buyers', '/agents', '/referrals', '/property-requests'].includes(item.path));
    }
    if (dept === 'support') {
      return allItems.filter(item => ['/', '/buyers', '/tickets', '/messages', '/services-inquiries', '/contact-messages', '/partner-applications', '/notifications'].includes(item.path));
    }
    if (dept === 'accounts') {
      return allItems.filter(item => ['/', '/ledger', '/approvals', '/agents', '/services'].includes(item.path));
    }

    // Default fallback: just show overview if department is unrecognized
    return allItems.filter(item => item.path === '/');
  }, [userProfile]);
  return (
    <div className={styles.layout}>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div className={styles.mobileOverlay} onClick={() => setIsMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isMobileOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.logo}>
          <img src="/logo.png" alt="Realshare Logo" style={{ height: '64px' }} />
          {/* Close button for mobile inside sidebar */}
          <button className={styles.mobileCloseBtn} onClick={() => setIsMobileOpen(false)}>✕</button>
        </div>
        <div className={styles.navLabel}>MANAGEMENT CONSOLE</div>
        <nav className={styles.nav}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              onClick={() => setIsMobileOpen(false)}
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
            <div className={styles.adminAvatar}>{user?.email?.[0].toUpperCase() || "A"}</div>
            <div>
              <div className={styles.adminName}>{user?.email?.split('@')[0] || "Admin"}</div>
              <div className={styles.adminRole}>Administrator</div>
            </div>
          </div>
          <button onClick={logout} style={{ marginTop: '12px', width: '100%', padding: '8px', background: 'transparent', color: '#EF4444', border: '1px solid #EF4444', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={styles.main}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button className={styles.mobileMenuBtn} onClick={() => setIsMobileOpen(true)}>
              ☰
            </button>
            <div>
              <h1 className={styles.headerTitle}>{title}</h1>
              <p className={styles.headerSubtitle}>Realshare Management Portal</p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <div className={styles.searchBar}>
              <span className={styles.searchIcon}>🔍</span>
              <input type="text" placeholder="Search buyer, property, transaction..." className={styles.searchInput} />
            </div>
            <Link href="/notifications" className={styles.notifBtn} title="Notifications">
              🔔<span className={styles.notifDot} />
            </Link>
            <div className={styles.userProfile}>
              <div className={styles.avatar}>{user?.email?.[0].toUpperCase() || "A"}</div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <section className={styles.content}>{children}</section>
      </main>
    </div>
  );
}
