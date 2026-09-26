"use client";
import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { getAuthHeader } from "@/lib/api-auth";
import styles from "./HomeSections.module.css";
import Image from "next/image";

interface Property {
  id: string;
  title: string;
  property_type: string;
  featured: boolean;
  is_project: boolean;
  is_hero: boolean;
  is_search_featured: boolean;
  image_url?: string;
  images?: Array<{ image_url: string }>;
  profile?: { full_name: string; role: string };
}

const TABS = [
  { id: "is_hero", label: "Sliding Banner on Top" },
  { id: "featured", label: "Featured Properties" },
  { id: "is_project", label: "Featured Projects" },
  { id: "is_search_featured", label: "Search Page Properties" },
];

export default function HomeSectionsPage() {
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchSectionProperties();
  }, [activeTab]);

  const fetchSectionProperties = async () => {
    setLoading(true);
    try {
      const authHeader = await getAuthHeader();
      const res = await fetch(`/api/properties?${activeTab}=true`, {
        headers: authHeader || undefined,
      });
      if (res.ok) {
        const data = await res.json();
        setProperties(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to fetch properties:", err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = async () => {
    setIsModalOpen(true);
    setModalLoading(true);
    try {
      const authHeader = await getAuthHeader();
      // Fetch all properties to let user select
      const res = await fetch(`/api/properties`, {
        headers: authHeader || undefined,
      });
      if (res.ok) {
        const data = await res.json();
        setAllProperties(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to fetch all properties:", err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleSection = async (propertyId: string, value: boolean) => {
    try {
      const authHeader = await getAuthHeader();
      const payload = { [activeTab]: value };
      
      const res = await fetch(`/api/properties/${propertyId}`, {
        method: "PATCH",
        headers: {
          ...(authHeader || {}),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        // Refresh
        fetchSectionProperties();
        if (isModalOpen) {
          setIsModalOpen(false);
        }
      } else {
        alert("Failed to update property.");
      }
    } catch (err) {
      console.error("Failed to update property:", err);
    }
  };

  const getImg = (p: Property) => {
    if (p.images && p.images.length > 0) return p.images[0].image_url;
    return p.image_url || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=400&q=80";
  };

  const filteredAllProps = allProperties.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout title="Home Sections">
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Home Page Sections</h1>
            <p className={styles.subtitle}>
              Control which properties appear in different sections of the app
            </p>
          </div>
        </div>

        <div className={styles.tabsRow}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.tabBtn} ${activeTab === tab.id ? styles.activeTab : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            Properties in {TABS.find((t) => t.id === activeTab)?.label}
          </h2>
          <div className={styles.actionsRow}>
            <button className={styles.createBtn} onClick={openAddModal}>
              + Add Property to this Section
            </button>
            <button 
              className={styles.createSecondaryBtn} 
              onClick={() => window.location.href = `/properties`}
            >
              + Go to Properties
            </button>
          </div>
        </div>

        {loading ? (
          <div className={styles.loading}>Loading properties...</div>
        ) : properties.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No properties added to this section yet.</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {properties.map((p) => (
              <div key={p.id} className={styles.card}>
                <div className={styles.cardImgWrapper}>
                  <img src={getImg(p)} alt={p.title} className={styles.cardImg} />
                </div>
                <div className={styles.cardContent}>
                  <h3 className={styles.cardTitle}>{p.title}</h3>
                  <p className={styles.cardType}>{p.property_type}</p>
                  <p className={styles.cardBy}>By {p.profile?.full_name || "Unknown"}</p>
                  <button
                    className={styles.removeBtn}
                    onClick={() => handleToggleSection(p.id, false)}
                  >
                    Remove from Section
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Select Property Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Select Property</h2>
              <button className={styles.closeBtn} onClick={() => setIsModalOpen(false)}>
                &times;
              </button>
            </div>
            
            <input
              type="text"
              placeholder="Search properties by title..."
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <div className={styles.modalBody}>
              {modalLoading ? (
                <div className={styles.loading}>Loading...</div>
              ) : filteredAllProps.length === 0 ? (
                <div className={styles.emptyState}>No properties found.</div>
              ) : (
                <div className={styles.list}>
                  {filteredAllProps.map((p) => {
                    const isAlreadyAdded = (p as any)[activeTab] === true;
                    return (
                      <div key={p.id} className={styles.listItem}>
                        <div className={styles.listInfo}>
                          <h4>{p.title}</h4>
                          <span>{p.property_type}</span>
                        </div>
                        <button
                          className={isAlreadyAdded ? styles.addedBtn : styles.addBtn}
                          disabled={isAlreadyAdded}
                          onClick={() => handleToggleSection(p.id, true)}
                        >
                          {isAlreadyAdded ? "Added" : "Add"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
