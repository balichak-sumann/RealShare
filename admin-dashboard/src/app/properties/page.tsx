"use client";
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import AdminLayout from "@/components/layout/AdminLayout";
import { getAuthHeader } from "@/lib/api-auth";
import { uploadFileToServer } from "@/lib/upload";
import styles from "./Properties.module.css";

// Dynamic import to avoid SSR issues with Leaflet
const LocationPicker = dynamic(() => import("@/components/LocationPicker"), {
  ssr: false,
  loading: () => (
    <div style={{ height: "280px", borderRadius: "12px", background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", color: "#94A3B8" }}>
      Loading map...
    </div>
  ),
});

interface Property {
  id: string;
  title: string;
  state: string;
  district: string;
  locality: string;
  property_type: string;
  total_fractions: number;
  sold_fractions: number;
  available_fractions: number;
  price_per_fraction: string | number;
  booking_amount: string | number;
  assured_yield: string | number;
  target_irr: string | number;
  images?: any[];
  approval_status: string;
  listing_type?: string;
  profile?: { full_name: string; role: string } | null;
  postedBy?: string;
  builderContact?: string;
  videoUrl?: string;
  video_url?: string;
  raised?: string;
  short_description?: string;
  description?: string;
  full_address?: string;
  area_sqft?: number | string;
  google_maps_url?: string;
  lat?: number | string;
  lng?: number | string;
  views_count?: number;
  is_sold_out?: boolean;
}

const MAJOR_CITIES = [
  { name: "Hyderabad", state: "Telangana", lat: 17.3850, lng: 78.4867 },
  { name: "Bengaluru", state: "Karnataka", lat: 12.9716, lng: 77.5946 },
  { name: "Mumbai", state: "Maharashtra", lat: 19.0760, lng: 72.8777 },
  { name: "Pune", state: "Maharashtra", lat: 18.5204, lng: 73.8567 },
  { name: "Delhi NCR", state: "Delhi", lat: 28.6139, lng: 77.2090 },
  { name: "Gurugram", state: "Haryana", lat: 28.4595, lng: 77.0266 },
  { name: "Noida", state: "Uttar Pradesh", lat: 28.5355, lng: 77.3910 },
  { name: "Chennai", state: "Tamil Nadu", lat: 13.0827, lng: 80.2707 },
  { name: "Kolkata", state: "West Bengal", lat: 22.5726, lng: 88.3639 },
  { name: "Ahmedabad", state: "Gujarat", lat: 23.0225, lng: 72.5714 },
  { name: "Goa", state: "Goa", lat: 15.2993, lng: 74.1240 },
  { name: "Kochi", state: "Kerala", lat: 9.9312, lng: 76.2673 },
  { name: "Other", state: "", lat: 17.3850, lng: 78.4867 },
];

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusTab, setStatusTab] = useState<"All" | "Pending Approval" | "Active" | "Sold Out">("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sell Property Modal state
  const [sellModalProperty, setSellModalProperty] = useState<Property | null>(null);
  const [allInvestors, setAllInvestors] = useState<any[]>([]);
  const [investorSearch, setInvestorSearch] = useState("");
  const [selectedInvestor, setSelectedInvestor] = useState<any | null>(null);
  const [saleAmount, setSaleAmount] = useState("");
  const [isSelling, setIsSelling] = useState(false);
  const [loadingInvestors, setLoadingInvestors] = useState(false);

  const isSoldOut = (p: Property) => {
    if (p.is_sold_out) return true;
    if (p.approval_status === "sold_out") return true;
    if (p.total_fractions > 0 && (p.available_fractions <= 0 || p.sold_fractions >= p.total_fractions)) return true;
    return false;
  };

  const isActive = (p: Property) => {
    const isApproved = p.approval_status === "approved" || p.approval_status === "Active";
    return isApproved && !isSoldOut(p);
  };

  const isPending = (p: Property) => {
    return p.approval_status === "pending_approval" || p.approval_status === "Pending Approval";
  };

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const authHeader = await getAuthHeader();
        const res = await fetch('/api/properties', {
          headers: authHeader || undefined
        });
        if (res.ok) {
          const data = await res.json();
          setProperties(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Failed to fetch properties:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

  // Edit Property State
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);

  const handleEditClick = (p: Property) => {
    setEditingPropertyId(p.id);
    setNewProp({
      title: p.title || "",
      shortDescription: p.short_description || "",
      description: p.description || "",
      state: p.state || "Telangana",
      district: p.district || "Hyderabad",
      locality: p.locality || "",
      fullAddress: p.full_address || "",
      type: (["Commercial", "Fractional", "Residential", "Holiday", "Investor"].includes(p.property_type ? p.property_type.trim().charAt(0).toUpperCase() + p.property_type.trim().slice(1).toLowerCase() : "") 
        ? p.property_type.trim().charAt(0).toUpperCase() + p.property_type.trim().slice(1).toLowerCase() 
        : "Commercial") as any,
      listingType: (p.listing_type as any) || "fractional",
      areaSqft: Number(p.area_sqft) || 1200,
      googleMapsUrl: p.google_maps_url || "",
      totalFractions: p.totalFractions || p.total_fractions || 50,
      price: Number(p.price_per_fraction) || 500000,
      yield: Number(p.assured_yield) || 8.5,
      irr: Number(p.target_irr) || 15.0,
      postedBy: "Admin",
    });
    setMapLat(Number(p.lat) || 17.385);
    setMapLng(Number(p.lng) || 78.4867);
    setShowAddModal(true);
  };

  // New Property Form State
  const [newProp, setNewProp] = useState({
    title: "",
    shortDescription: "",
    description: "",
    state: "Telangana",
    district: "Hyderabad",
    locality: "",
    fullAddress: "",
    type: "Commercial" as "Commercial" | "Fractional" | "Residential" | "Holiday" | "Investor",
    listingType: "fractional" as "fractional" | "outright" | "rental" | "resale",
    areaSqft: 1200,
    googleMapsUrl: "",
    totalFractions: 50,
    price: 500000,
    yield: 8.5,
    irr: 15.0,
    postedBy: "Admin" as const,
  });
  // Helper to extract lat/lng from a Google Maps share link
  const parseGoogleMapsUrl = (url: string) => {
    try {
      if (!url) return null;
      // Format 1: @lat,lng
      const match = url.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
      if (match) {
        return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
      }
      // Format 2: ?q=lat,lng or ?query=lat,lng
      const qMatch = url.match(/[?&](?:q|query)=(-?\d+(?:\.\d+)?)[,%2C]+(-?\d+(?:\.\d+)?)/i);
      if (qMatch) {
        return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
      }
      // Format 3: !3d<lat>!4d<lng>
      const placeMatch = url.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
      if (placeMatch) {
        return { lat: parseFloat(placeMatch[1]), lng: parseFloat(placeMatch[2]) };
      }
      // Format 4: ?ll=lat,lng
      const llMatch = url.match(/[?&]ll=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
      if (llMatch) {
        return { lat: parseFloat(llMatch[1]), lng: parseFloat(llMatch[2]) };
      }
    } catch (e) {
      console.error('Google Maps parse error:', e);
    }
    return null;
  };

  const [isResolvingMapUrl, setIsResolvingMapUrl] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [mapLat, setMapLat] = useState(17.385);
  const [mapLng, setMapLng] = useState(78.4867);

  const handleExtractMapLocation = async () => {
    if (!newProp.googleMapsUrl || !newProp.googleMapsUrl.trim()) {
      alert("Please paste a Google Maps link first.");
      return;
    }

    const trimmedUrl = newProp.googleMapsUrl.trim();
    // Quick client-side parse if it's already a full expanded URL
    const clientParsed = parseGoogleMapsUrl(trimmedUrl);
    if (clientParsed && !trimmedUrl.includes("goo.gl") && !trimmedUrl.includes("maps.app")) {
      setMapLat(clientParsed.lat);
      setMapLng(clientParsed.lng);
      showToast(`Coordinates extracted: ${clientParsed.lat.toFixed(5)}, ${clientParsed.lng.toFixed(5)}`);
      return;
    }

    // Call server resolver (handles shortened maps.app.goo.gl and 302 redirects)
    setIsResolvingMapUrl(true);
    try {
      const res = await fetch("/api/maps/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmedUrl }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.lat && data.lng) {
        setMapLat(data.lat);
        setMapLng(data.lng);
        if (data.placeName && !newProp.title) {
          setNewProp(prev => ({ ...prev, title: data.placeName }));
        }
        showToast(`📍 Pin placed: ${data.lat.toFixed(5)}, ${data.lng.toFixed(5)}${data.placeName ? ` (${data.placeName})` : ""}`);
      } else {
        if (clientParsed) {
          setMapLat(clientParsed.lat);
          setMapLng(clientParsed.lng);
          showToast(`Coordinates extracted: ${clientParsed.lat.toFixed(5)}, ${clientParsed.lng.toFixed(5)}`);
        } else {
          alert(data.error || "Could not automatically extract coordinates from this URL. You can still pin directly on the map below.");
        }
      }
    } catch (e: any) {
      if (clientParsed) {
        setMapLat(clientParsed.lat);
        setMapLng(clientParsed.lng);
        showToast(`Coordinates extracted: ${clientParsed.lat.toFixed(5)}, ${clientParsed.lng.toFixed(5)}`);
      } else {
        alert("Failed to resolve Google Maps link. You can pin directly on the map below.");
      }
    } finally {
      setIsResolvingMapUrl(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleApproveProperty = async (id: string) => {
    try {
      const authHeader = await getAuthHeader();
      if (!authHeader) { showToast('You must be signed in to do that.'); return; }
      const res = await fetch(`/api/properties/${id}`, {
        method: 'PATCH',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ approval_status: 'approved' })
      });
      if (res.ok) {
        setProperties((prev) => prev.map((p) => (p.id === id ? { ...p, approval_status: "approved" } : p)));
        showToast(`Property approved and listed live on Web & Mobile Apps!`);
      } else {
        const data = await res.json();
        alert(`Failed to approve: ${data.error || res.status}`);
      }
    } catch(e: any) {
      alert(`Network error: ${e.message}`);
    }
  };

  const handleMarkSoldOut = async (id: string) => {
    try {
      const authHeader = await getAuthHeader();
      if (!authHeader) { showToast('You must be signed in to do that.'); return; }
      const res = await fetch(`/api/properties/${id}`, {
        method: 'PATCH',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_sold_out: true })
      });
      if (res.ok) {
        setProperties((prev) => prev.map((p) => (p.id === id ? { ...p, is_sold_out: true } : p)));
        showToast(`Property marked as Sold Out.`);
      } else {
        const data = await res.json();
        alert(`Failed to mark sold out: ${data.error || res.status}`);
      }
    } catch(e: any) {
      alert(`Network error: ${e.message}`);
    }
  };

  const handleMakeLive = async (id: string) => {
    if (!confirm("Are you sure you want to make this property live again? This will also cancel any active investments assigned to it.")) return;
    try {
      const authHeader = await getAuthHeader();
      if (!authHeader) { showToast('You must be signed in to do that.'); return; }
      const res = await fetch(`/api/properties/${id}`, {
        method: 'PATCH',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_sold_out: false })
      });
      if (res.ok) {
        setProperties((prev) => prev.map((p) => {
          if (p.id === id) {
            return { ...p, is_sold_out: false, sold_fractions: 0, available_fractions: p.total_fractions || 1 };
          }
          return p;
        }));
        showToast(`Property is now live and on sale again.`);
      } else {
        const data = await res.json();
        alert(`Failed to make live: ${data.error || res.status}`);
      }
    } catch(e: any) {
      alert(`Network error: ${e.message}`);
    }
  };

  const handleOpenSellModal = async (p: Property) => {
    setSellModalProperty(p);
    setSelectedInvestor(null);
    setInvestorSearch("");
    setSaleAmount("");
    setLoadingInvestors(true);
    try {
      const authHeader = await getAuthHeader();
      if (!authHeader) { showToast('You must be signed in.'); setLoadingInvestors(false); return; }
      const res = await fetch('/api/investors', { headers: authHeader });
      if (res.ok) {
        const data = await res.json();
        setAllInvestors(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load investors:', err);
    } finally {
      setLoadingInvestors(false);
    }
  };

  const handleConfirmSell = async () => {
    if (!sellModalProperty || !selectedInvestor) return;
    if (!confirm(`Are you sure you want to sell "${sellModalProperty.title}" to ${selectedInvestor.full_name}? This action will mark the property as SOLD OUT and create an investment record.`)) {
      return;
    }
    setIsSelling(true);
    try {
      const authHeader = await getAuthHeader();
      if (!authHeader) { showToast('You must be signed in.'); setIsSelling(false); return; }
      const res = await fetch('/api/properties/sell', {
        method: 'POST',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: sellModalProperty.id,
          investorId: selectedInvestor.id,
          saleAmount: saleAmount ? Number(saleAmount) : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setProperties((prev) =>
          prev.map((p) =>
            p.id === sellModalProperty.id
              ? { ...p, is_sold_out: true, sold_fractions: p.total_fractions, available_fractions: 0 }
              : p
          )
        );
        setSellModalProperty(null);
        setSelectedInvestor(null);
        setInvestorSearch("");
        setSaleAmount("");
        showToast(`✅ ${data.message} Certificate: ${data.investment?.certificate_number}`);
      } else {
        alert(`Sale failed: ${data.error || 'Unknown error'}`);
      }
    } catch (e: any) {
      alert(`Network error: ${e.message}`);
    } finally {
      setIsSelling(false);
    }
  };

  const handleRejectProperty = async (id: string) => {
    try {
      const authHeader = await getAuthHeader();
      if (!authHeader) { showToast('You must be signed in to do that.'); return; }
      const res = await fetch(`/api/properties/${id}`, {
        method: 'PATCH',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ approval_status: 'rejected' })
      });
      if (res.ok) {
        setProperties((prev) => prev.map((p) => (p.id === id ? { ...p, approval_status: "rejected" } : p)));
        showToast(`Property submission rejected.`);
      } else {
        const data = await res.json();
        alert(`Failed to reject: ${data.error || res.status}`);
      }
    } catch(e: any) {
      alert(`Network error: ${e.message}`);
    }
  };

  const handleDeleteProperty = async (id: string) => {
    if (confirm("Are you sure you want to delete this property listing? This action cannot be undone.")) {
      try {
        const authHeader = await getAuthHeader();
        if (!authHeader) { showToast('You must be signed in to do that.'); return; }
        const res = await fetch(`/api/properties/${id}`, {
          method: 'DELETE',
          headers: authHeader
        });
        if (res.ok) {
          setProperties((prev) => prev.filter((p) => p.id !== id));
          showToast(`Property ${id} removed successfully by Admin.`);
        }
      } catch(e) {}
    }
  };

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProp.title || !newProp.locality) {
      alert("Please fill in the property title and locality.");
      return;
    }
    if (!newProp.description || newProp.description.trim().length < 5) {
      alert("Please provide a property description (at least 5 characters).");
      return;
    }
    if (!newProp.areaSqft || Number(newProp.areaSqft) <= 0) {
      alert("Please enter a valid property area in sq.ft.");
      return;
    }
    
    setIsUploading(true);
    const uploadedImageUrls: string[] = [];
    let videoUrl = "";

    try {
      // Upload all selected images to server storage (no Firebase)
      const authHeader = await getAuthHeader();
      if (!authHeader) { alert('You must be signed in to do that.'); setIsUploading(false); return; }

      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          try {
            const url = await uploadFileToServer(file, authHeader);
            uploadedImageUrls.push(url);
          } catch (uploadError: any) {
            console.error('Image upload failed:', uploadError);
            showToast(`Failed to upload ${file.name}: ${uploadError.message}`);
          }
        }
      }
      if (uploadedImageUrls.length === 0) {
        uploadedImageUrls.push("https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=250&fit=crop");
      }

      // Upload video if selected to server storage (no Firebase)
      if (selectedVideo) {
        try {
          videoUrl = await uploadFileToServer(selectedVideo, authHeader);
        } catch (uploadError: any) {
          console.error('Video upload failed:', uploadError);
          showToast(`Video upload failed: ${uploadError.message}`);
        }
      }

      const isEdit = !!editingPropertyId;
      const url = isEdit ? `/api/properties/${editingPropertyId}` : '/api/properties';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newProp.title.trim(),
          short_description: newProp.shortDescription.trim() || undefined,
          description: newProp.description.trim(),
          state: newProp.state,
          district: newProp.district,
          locality: newProp.locality.trim(),
          full_address: newProp.fullAddress.trim() || undefined,
          property_type: newProp.type,
          listing_type: newProp.listingType,
          area_sqft: Number(newProp.areaSqft),
          total_fractions: newProp.listingType === "fractional" ? Number(newProp.totalFractions) : 1,
          available_fractions: newProp.listingType === "fractional" ? Number(newProp.totalFractions) : 1,
          price_per_fraction: Number(newProp.price),
          booking_amount: Math.round(Number(newProp.price) * 0.1),
          assured_yield: Number(newProp.yield),
          target_irr: Number(newProp.irr),
          lat: mapLat,
          lng: mapLng,
          google_maps_url: newProp.googleMapsUrl || undefined,
          video_url: videoUrl || undefined,
          featured: false,
          image_urls: uploadedImageUrls,
          image_url: uploadedImageUrls[0],
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to save property to the database');
      }
      const created = await res.json();

      if (isEdit) {
        setProperties(properties.map(p => p.id === created.id ? created : p));
        showToast(`Property "${created.title}" successfully updated.`);
      } else {
        setProperties([created, ...properties]);
        showToast(`Property "${created.title}" successfully added with ${uploadedImageUrls.length} images${videoUrl ? ' and 1 video' : ''}.`);
      }
      setShowAddModal(false);
      setEditingPropertyId(null);
      setSelectedFiles([]);
      setSelectedVideo(null);
      setNewProp({ ...newProp, title: "", shortDescription: "", description: "", locality: "", fullAddress: "", googleMapsUrl: "" });
    } catch (error: any) {
      console.error("Error uploading property media:", error);
      showToast(error.message || "Failed to upload media. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const totalFractionsPool = properties.reduce((sum, p) => sum + (Number(p.total_fractions) || 0), 0);
  const totalSoldFractions = properties.reduce((sum, p) => sum + (Number(p.sold_fractions) || 0), 0);
  const totalAvailableFractions = properties.reduce((sum, p) => sum + (Number(p.available_fractions) || 0), 0);
  const pendingSubmissionsCount = properties.filter(isPending).length;
  const activeListingsCount = properties.filter(isActive).length;
  const soldOutCount = properties.filter(isSoldOut).length;

  return (
    <AdminLayout title="Property & Share Pool Management">
      {/* Toast */}
      {toastMessage && (
        <div
          style={{
            background: "linear-gradient(135deg, #059669, #10B981)",
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
          <span>✓ {toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
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

      {/* Share Pool Analytics Cards (Work Order 3.3 Requirement) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
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
          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase" }}>
            Total Share Pool
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "6px", color: "var(--text-primary)" }}>
            {totalFractionsPool} Fractions
          </div>
          <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: 4 }}>
            Across {properties.length} Properties
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
          <div style={{ fontSize: "0.75rem", color: "#16A34A", fontWeight: 600, textTransform: "uppercase" }}>
            Sold Fractions
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "6px", color: "#16A34A" }}>
            {totalSoldFractions} Fractions
          </div>
          <div style={{ fontSize: "0.75rem", color: "#16A34A", marginTop: 4 }}>
            {totalFractionsPool > 0 ? ((totalSoldFractions / totalFractionsPool) * 100).toFixed(1) : "0.0"}% Fractional Capital Raised
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
          <div style={{ fontSize: "0.75rem", color: "#2563EB", fontWeight: 600, textTransform: "uppercase" }}>
            Available Fractions
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "6px", color: "#2563EB" }}>
            {totalAvailableFractions} Fractions
          </div>
          <div style={{ fontSize: "0.75rem", color: "#2563EB", marginTop: 4 }}>
            Open for Investor Bookings
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
          <div style={{ fontSize: "0.75rem", color: "#D97706", fontWeight: 600, textTransform: "uppercase" }}>
            Builder Postings Queue
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "6px", color: "#D97706" }}>
            {pendingSubmissionsCount} Pending
          </div>
          <div style={{ fontSize: "0.75rem", color: "#D97706", marginTop: 4 }}>
            Awaiting Admin Review & Approval
          </div>
        </div>
      </div>

      {/* Share Pool Visualizer */}
      <div
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-color)",
          borderRadius: "12px",
          padding: "18px",
          marginBottom: "24px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "0.85rem", fontWeight: 600 }}>
          <span>Fractional Share Allocation Visualizer</span>
          <span>
            Sold: <strong style={{ color: "#16A34A" }}>{totalSoldFractions}</strong> | Available:{" "}
            <strong style={{ color: "#2563EB" }}>{totalAvailableFractions}</strong>
          </span>
        </div>
        <div style={{ height: "14px", width: "100%", background: "#E2E8F0", borderRadius: "7px", overflow: "hidden", display: "flex" }}>
          <div
            style={{
              width: `${totalFractionsPool > 0 ? (totalSoldFractions / totalFractionsPool) * 100 : 0}%`,
              background: "linear-gradient(90deg, #10B981, #059669)",
            }}
            title={`Sold: ${totalSoldFractions}`}
          />
          <div
            style={{
              width: `${totalFractionsPool > 0 ? (totalAvailableFractions / totalFractionsPool) * 100 : 0}%`,
              background: "linear-gradient(90deg, #3B82F6, #2563EB)",
            }}
            title={`Available: ${totalAvailableFractions}`}
          />
        </div>
      </div>

      {/* Main Table Controls */}
      <div className={styles.header}>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            className={`${styles.filterPill} ${statusTab === "All" ? styles.filterActive : ""}`}
            onClick={() => setStatusTab("All")}
          >
            All Listings ({properties.length})
          </button>
          <button
            className={`${styles.filterPill} ${statusTab === "Pending Approval" ? styles.filterActive : ""}`}
            onClick={() => setStatusTab("Pending Approval")}
            style={{
              borderColor: statusTab === "Pending Approval" ? "#F59E0B" : "var(--border-color)",
              color: statusTab === "Pending Approval" ? "#B45309" : "inherit",
              background: statusTab === "Pending Approval" ? "#FEF3C7" : "transparent",
            }}
          >
            ⚡ Builder Submissions ({pendingSubmissionsCount})
          </button>
          <button
            className={`${styles.filterPill} ${statusTab === "Active" ? styles.filterActive : ""}`}
            onClick={() => setStatusTab("Active")}
          >
            Active ({activeListingsCount})
          </button>
          <button
            className={`${styles.filterPill} ${statusTab === "Sold Out" ? styles.filterActive : ""}`}
            onClick={() => setStatusTab("Sold Out")}
          >
            Sold Out ({soldOutCount})
          </button>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.filterGroup}>
            {["All", "Commercial", "Fractional", "Residential", "Holiday", "Investor"].map((t) => (
              <button
                key={t}
                className={`${styles.filterPill} ${typeFilter === t ? styles.filterActive : ""}`}
                onClick={() => setTypeFilter(t)}
              >
                {t}
              </button>
            ))}
          </div>
          <button className={styles.addButton} onClick={() => {
            setEditingPropertyId(null);
            setNewProp({ title: "", shortDescription: "", description: "", state: "Telangana", district: "Hyderabad", locality: "", fullAddress: "", type: "Commercial", listingType: "fractional", areaSqft: 1200, googleMapsUrl: "", totalFractions: 50, price: 500000, yield: 8.5, irr: 15.0, postedBy: "Admin" });
            setShowAddModal(true);
          }}>
            + Post Property (Admin)
          </button>
        </div>
      </div>

      <div className={styles.searchBar}>
        <span>🔍</span>
        <input
          type="text"
          placeholder="Search properties by title, district, locality, or builder..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Properties Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Property & Location</th>
              <th className={styles.th}>Type</th>
              <th className={styles.th}>Posted By</th>
              <th className={styles.th}>Share Pool (Sold / Total)</th>
              <th className={styles.th}>Price / Frac</th>
              <th className={styles.th}>Yield / IRR</th>
              <th className={styles.th}>Status</th>
              <th className={styles.th}>Admin Actions</th>
            </tr>
          </thead>
          <tbody>
            {properties
            .filter((p) => {
              if (statusTab === "Pending Approval" && !isPending(p)) return false;
              if (statusTab === "Active" && !isActive(p)) return false;
              if (statusTab === "Sold Out" && !isSoldOut(p)) return false;

              if (typeFilter !== "All") {
                const filterLower = typeFilter.toLowerCase();
                const propTypeLower = (p.property_type || "").toLowerCase();
                const listingTypeLower = (p.listing_type || "").toLowerCase();
                if (filterLower === "fractional") {
                  if (propTypeLower !== "fractional" && listingTypeLower !== "fractional") return false;
                } else {
                  if (propTypeLower !== filterLower) return false;
                }
              }

              if (search.trim()) {
                const q = search.toLowerCase();
                const titleMatch = (p.title || "").toLowerCase().includes(q);
                const localityMatch = (p.locality || "").toLowerCase().includes(q);
                const districtMatch = (p.district || "").toLowerCase().includes(q);
                const stateMatch = (p.state || "").toLowerCase().includes(q);
                const postedMatch = (p.profile?.full_name || p.postedBy || "").toLowerCase().includes(q);
                if (!titleMatch && !localityMatch && !districtMatch && !stateMatch && !postedMatch) {
                  return false;
                }
              }
              return true;
            })
            .map((p) => (
              <tr key={p.id} className={styles.tr}>
                <td className={styles.td}>
                  <div className={styles.propCell}>
                    <img src={p.images?.[0]?.image_url || 'https://via.placeholder.com/150'} alt={p.title} className={styles.propThumb} />
                    <div>
                      <div className={styles.propTitle}>{p.title}</div>
                      <div className={styles.propLocation}>
                        {p.locality}, {p.district}
                      </div>
                      {p.views_count !== undefined && (
                        <div style={{ fontSize: "0.72rem", color: "#2563EB", fontWeight: 600, marginTop: "2px" }}>
                          👁️ {p.views_count.toLocaleString('en-IN')} views
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className={styles.td}>
                  <span
                    className={`${styles.badge} ${
                      (p.property_type || "").toLowerCase() === "holiday"
                        ? styles.badgeHoliday
                        : (p.property_type || "").toLowerCase() === "commercial"
                        ? styles.badgeCommercial
                        : styles.badgeInternational
                    }`}
                  >
                    {p.property_type}
                  </span>
                </td>
                <td className={styles.td}>
                  <strong>
                    {p.profile?.role
                      ? p.profile.role === "admin"
                        ? "Admin"
                        : p.profile.role.charAt(0).toUpperCase() + p.profile.role.slice(1)
                      : p.postedBy || "Admin"}
                  </strong>
                  {p.profile?.full_name && (
                    <div style={{ fontSize: "0.7rem", color: "#64748B" }}>
                      {p.profile.full_name}
                    </div>
                  )}
                  {p.builderContact && (
                    <div style={{ fontSize: "0.7rem", color: "#64748B" }}>
                      {p.builderContact}
                    </div>
                  )}
                </td>
                <td className={styles.td}>
                  {(p.listing_type || "fractional") !== "fractional" ? (
                    <span
                      className={styles.badge}
                      style={{ 
                        background: p.listing_type === "rental" ? "#DCFCE7" : p.listing_type === "resale" ? "#FEF9C3" : "#EDE9FE", 
                        color: p.listing_type === "rental" ? "#166534" : p.listing_type === "resale" ? "#854D0E" : "#6D28D9" 
                      }}
                    >
                      {(p.listing_type || "outright").charAt(0).toUpperCase() + (p.listing_type || "outright").slice(1)} · Whole Property
                    </span>
                  ) : (
                    <div className={styles.fractionCell}>
                      <span style={{ fontWeight: 600 }}>
                        {p.sold_fractions} sold / {p.available_fractions} avail ({p.total_fractions} total)
                      </span>
                      <div className={styles.miniProgress}>
                        <div
                          className={styles.miniFill}
                          style={{
                            width: `${p.total_fractions > 0 ? (p.sold_fractions / p.total_fractions) * 100 : 0}%`,
                            backgroundColor:
                              p.available_fractions === 0 ? "#DC2626" : "#16A34A",
                          }}
                        />
                      </div>
                    </div>
                  )}
                </td>
                <td className={styles.td}>
                  <strong>₹{Number(p.price_per_fraction).toLocaleString("en-IN")}</strong>
                  <div style={{ fontSize: "0.7rem", color: "#64748B" }}>
                    {p.listing_type === "outright"
                      ? "Full property price"
                      : `Booking: ₹${Number(p.booking_amount).toLocaleString("en-IN")}`}
                  </div>
                </td>
                <td className={styles.td}>
                  <span className={styles.yieldVal}>{p.assured_yield}% Yield</span>
                  <div style={{ fontSize: "0.7rem", color: "#7C3AED", fontWeight: 600 }}>
                    {p.target_irr}% IRR
                  </div>
                </td>
                <td className={styles.td}>
                  {isSoldOut(p) ? (
                    <span
                      style={{
                        display: "inline-block",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        background: "#FEF2F2",
                        color: "#991B1B",
                      }}
                    >
                      Sold Out
                    </span>
                  ) : (
                    <span
                      style={{
                        display: "inline-block",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        background:
                          p.approval_status === "approved"
                            ? "#DCFCE7"
                            : p.approval_status === "rejected"
                            ? "#FEE2E2"
                            : "#FEF9C3",
                        color:
                          p.approval_status === "approved"
                            ? "#166534"
                            : p.approval_status === "rejected"
                            ? "#991B1B"
                            : "#854D0E",
                      }}
                    >
                      {p.approval_status === "approved" ? "Active" : p.approval_status === "pending_approval" ? "Pending Approval" : p.approval_status}
                    </span>
                  )}
                </td>
                <td className={styles.td}>
                  <div className={styles.actions}>
                    {p.approval_status === "pending_approval" ? (
                      <>
                        <button
                          className={styles.actionBtnGreen}
                          onClick={() => handleApproveProperty(p.id)}
                        >
                          Approve
                        </button>
                        <button
                          className={styles.actionBtnRed}
                          onClick={() => handleRejectProperty(p.id)}
                        >
                          Reject
                        </button>
                      </>
                    ) : isActive(p) && !isSoldOut(p) ? (
                      <>
                        <button
                          className={styles.actionBtnGreen}
                          style={{ background: "#7C3AED" }}
                          onClick={() => handleOpenSellModal(p)}
                        >
                          Sell
                        </button>
                        <button
                          className={styles.actionBtnRed}
                          style={{ background: "#F59E0B" }}
                          onClick={() => handleMarkSoldOut(p.id)}
                        >
                          Mark Sold Out
                        </button>
                      </>
                    ) : isSoldOut(p) ? (
                      <button
                        className={styles.actionBtnGreen}
                        style={{ background: "#10B981" }}
                        onClick={() => handleMakeLive(p.id)}
                      >
                        Make Live
                      </button>
                    ) : (
                      <span className={styles.noAction}>-</span>
                    )}
                    <button
                      onClick={() => handleEditClick(p as any)}
                      className={styles.viewBtn}
                      style={{ background: "#3B82F6", color: "white", padding: "4px 8px", borderRadius: "4px", border: "none", cursor: "pointer", marginRight: "6px" }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setSelectedProperty(p as any)}
                      className={styles.viewBtn}
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDeleteProperty(p.id)}
                      className={styles.deleteBtn}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add New Property Modal */}
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
              maxWidth: "680px",
              maxHeight: "90vh",
              overflowY: "auto",
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
              <div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0F172A" }}>
                  {editingPropertyId ? "Edit Property Listing" : "Add New Property Listing"}
                </h2>
                <p style={{ fontSize: "0.8rem", color: "#64748B", marginTop: "2px" }}>
                  {editingPropertyId ? "Update property details" : "Create and publish a verified real estate investment listing"}
                </p>
              </div>
              <button
                onClick={() => { setShowAddModal(false); setEditingPropertyId(null); }}
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

            <form onSubmit={handleCreateProperty} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {/* 1. Listing Mode / Type */}
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "6px" }}>
                  1. Listing Mode (Property Type) <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                  {(
                    [
                      { key: "fractional", label: "Fractional", sub: "Invest / Shares" },
                      { key: "outright", label: "Outright", sub: "Buy / 100%" },
                      { key: "rental", label: "Rental", sub: "Monthly Yield" },
                      { key: "resale", label: "Resale", sub: "Secondary Sale" },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setNewProp({ ...newProp, listingType: item.key })}
                      style={{
                        padding: "10px 8px",
                        borderRadius: "8px",
                        border: newProp.listingType === item.key ? "2px solid #2563EB" : "1px solid #CBD5E1",
                        background: newProp.listingType === item.key ? "#EFF6FF" : "#FFFFFF",
                        color: newProp.listingType === item.key ? "#1D4ED8" : "#475569",
                        textAlign: "center",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>{item.label}</div>
                      <div style={{ fontSize: "0.7rem", color: newProp.listingType === item.key ? "#3B82F6" : "#94A3B8" }}>
                        {item.sub}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Financial & Pricing Details (Positioned directly below Listing Mode) */}
              <div style={{ background: "#F1F5F9", padding: "14px", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#1E293B", marginBottom: "10px" }}>
                  💰 Pricing & Investment Metrics
                </div>
                <div style={{ display: "grid", gridTemplateColumns: newProp.listingType === "fractional" ? "1fr 1fr 1fr 1fr" : "1fr 1fr 1fr", gap: "10px" }}>
                  {newProp.listingType === "fractional" && (
                    <div>
                      <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569" }}>Total Fractions <span style={{ color: "#EF4444" }}>*</span></label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={newProp.totalFractions}
                        onChange={(e) => setNewProp({ ...newProp, totalFractions: Number(e.target.value) })}
                        style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", marginTop: "4px", fontSize: "0.85rem", background: "#FFFFFF" }}
                      />
                    </div>
                  )}
                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569" }}>
                      {newProp.listingType === "fractional" ? "Price Per Fraction (₹)" : newProp.listingType === "rental" ? "Monthly Rent (₹)" : "Total Price (₹)"} <span style={{ color: "#EF4444" }}>*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={newProp.price}
                      onChange={(e) => setNewProp({ ...newProp, price: Number(e.target.value) })}
                      style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", marginTop: "4px", fontSize: "0.85rem", background: "#FFFFFF" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569" }}>Assured Yield (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={newProp.yield}
                      onChange={(e) => setNewProp({ ...newProp, yield: Number(e.target.value) })}
                      style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", marginTop: "4px", fontSize: "0.85rem", background: "#FFFFFF" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569" }}>Target IRR (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={newProp.irr}
                      onChange={(e) => setNewProp({ ...newProp, irr: Number(e.target.value) })}
                      style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", marginTop: "4px", fontSize: "0.85rem", background: "#FFFFFF" }}
                    />
                  </div>
                </div>
              </div>

              {/* 3. Category & Area */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>
                    Category <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <select
                    value={newProp.type}
                    onChange={(e) => setNewProp({ ...newProp, type: e.target.value as any })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1", marginTop: "4px", background: "#fff" }}
                  >
                    <option value="Commercial">Commercial</option>
                    <option value="Fractional">Fractional</option>
                    <option value="Residential">Residential</option>
                    <option value="Holiday">Holiday</option>
                    <option value="Investor">Investor</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>
                    Total Area (Sq. Ft.) <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    placeholder="e.g. 1500"
                    value={newProp.areaSqft}
                    onChange={(e) => setNewProp({ ...newProp, areaSqft: Number(e.target.value) })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1", marginTop: "4px" }}
                  />
                </div>
              </div>

              {/* 4. Title */}
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>
                  Property Title <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. One Cyber City Commercial Office Space"
                  value={newProp.title}
                  onChange={(e) => setNewProp({ ...newProp, title: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1", marginTop: "4px" }}
                />
              </div>

              {/* 4.5. Short Description */}
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>
                  Short Description
                </label>
                <input
                  type="text"
                  placeholder="Visible on the home screen property cards"
                  value={newProp.shortDescription}
                  onChange={(e) => setNewProp({ ...newProp, shortDescription: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1", marginTop: "4px" }}
                />
              </div>

              {/* 5. Description */}
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>
                  Property Description <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Detailed overview of property features, tenant profile, lease terms, and capital appreciation prospects..."
                  value={newProp.description}
                  onChange={(e) => setNewProp({ ...newProp, description: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1", marginTop: "4px", resize: "vertical", fontFamily: "inherit" }}
                />
              </div>

              {/* 6. Location Details */}
              <div style={{ background: "#F8FAFC", padding: "16px", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1E293B", marginBottom: "12px" }}>
                  📍 Location & Mapping
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569" }}>City / District <span style={{ color: "#EF4444" }}>*</span></label>
                    <select
                      value={MAJOR_CITIES.some(c => c.name.toLowerCase() === (newProp.district || "").toLowerCase() && c.name !== "Other") ? newProp.district : "Other"}
                      onChange={(e) => {
                        const selectedCityName = e.target.value;
                        if (selectedCityName === "Other") {
                          setNewProp(prev => ({ ...prev, district: "" }));
                        } else {
                          const cityObj = MAJOR_CITIES.find(c => c.name === selectedCityName);
                          if (cityObj) {
                            setNewProp(prev => ({
                              ...prev,
                              district: cityObj.name,
                              state: cityObj.state || prev.state,
                            }));
                            setMapLat(cityObj.lat);
                            setMapLng(cityObj.lng);
                          }
                        }
                      }}
                      style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", marginTop: "4px", background: "#FFFFFF", fontSize: "0.85rem" }}
                    >
                      <option value="" disabled>Select City</option>
                      {MAJOR_CITIES.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.name}{c.state ? ` (${c.state})` : ""}
                        </option>
                      ))}
                    </select>
                    {(!MAJOR_CITIES.some(c => c.name.toLowerCase() === (newProp.district || "").toLowerCase() && c.name !== "Other")) && (
                      <input
                        type="text"
                        required
                        placeholder="Type custom city"
                        value={newProp.district}
                        onChange={(e) => setNewProp({ ...newProp, district: e.target.value })}
                        style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #CBD5E1", marginTop: "4px", fontSize: "0.8rem" }}
                      />
                    )}
                  </div>
                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569" }}>State <span style={{ color: "#EF4444" }}>*</span></label>
                    <input
                      type="text"
                      required
                      value={newProp.state}
                      onChange={(e) => setNewProp({ ...newProp, state: e.target.value })}
                      style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", marginTop: "4px", fontSize: "0.85rem" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569" }}>Locality <span style={{ color: "#EF4444" }}>*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Gachibowli"
                      value={newProp.locality}
                      onChange={(e) => setNewProp({ ...newProp, locality: e.target.value })}
                      style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", marginTop: "4px", fontSize: "0.85rem" }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: "10px" }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569" }}>Full Street Address / Landmark</label>
                  <input
                    type="text"
                    placeholder="e.g. Tower B, 4th Floor, Financial District, Nanakramguda"
                    value={newProp.fullAddress}
                    onChange={(e) => setNewProp({ ...newProp, fullAddress: e.target.value })}
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", marginTop: "4px", fontSize: "0.85rem" }}
                  />
                </div>

                {/* Google Maps Link & Auto-Pin */}
                <div style={{ marginTop: "12px" }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569" }}>Google Maps URL / Share Link</label>
                  <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                    <input
                      type="url"
                      placeholder="Paste Google Maps URL (e.g. https://maps.google.com/?q=17.385,78.486)"
                      value={newProp.googleMapsUrl}
                      onChange={(e) => setNewProp({ ...newProp, googleMapsUrl: e.target.value })}
                      style={{ flex: 1, padding: "8px 10px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.8rem" }}
                    />
                    <button
                      type="button"
                      disabled={isResolvingMapUrl}
                      onClick={handleExtractMapLocation}
                      style={{
                        padding: "8px 14px",
                        background: isResolvingMapUrl ? "#94A3B8" : "#0EA5E9",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        cursor: isResolvingMapUrl ? "not-allowed" : "pointer",
                        fontWeight: 600,
                        fontSize: "0.8rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      {isResolvingMapUrl ? (
                        <>
                          <span style={{ display: "inline-block", width: "12px", height: "12px", border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                          Resolving...
                        </>
                      ) : (
                        "Extract & Pin"
                      )}
                    </button>
                  </div>
                </div>

                {/* Leaflet Map Picker */}
                <div style={{ marginTop: "12px" }}>
                  <div style={{ fontSize: "0.7rem", color: "#64748B", marginBottom: "6px" }}>
                    Drop a pin on the map or click to adjust exact coordinates
                  </div>
                  <LocationPicker
                    lat={mapLat}
                    lng={mapLng}
                    onLocationChange={(lat, lng, address) => {
                      setMapLat(lat);
                      setMapLng(lng);
                      if (address) {
                        const parts = address.split(",").map((s: string) => s.trim());
                        if (parts.length >= 2 && !newProp.locality) {
                          setNewProp(prev => ({
                            ...prev,
                            locality: parts[0] + (parts[1] ? ", " + parts[1] : ""),
                          }));
                        }
                      }
                    }}
                  />
                  <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
                    <div style={{ flex: 1, fontSize: "0.75rem", color: "#64748B" }}>
                      <strong>Lat:</strong> {mapLat.toFixed(6)} | <strong>Lng:</strong> {mapLng.toFixed(6)}
                    </div>
                    <button
                      type="button"
                      onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${mapLat},${mapLng}`, "_blank")}
                      style={{ background: "none", border: "none", color: "#2563EB", cursor: "pointer", fontSize: "0.75rem", textDecoration: "underline" }}
                    >
                      Open in Google Maps ↗
                    </button>
                  </div>
                </div>
              </div>

              {/* 7. Property Images - Multi Upload */}
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569", marginBottom: "6px", display: "block" }}>
                  Property Images (Multiple)
                </label>
                <div
                  style={{
                    border: "2px dashed #CBD5E1",
                    borderRadius: "12px",
                    padding: "18px",
                    textAlign: "center",
                    background: "#F8FAFC",
                    cursor: "pointer",
                    transition: "border-color 0.2s",
                  }}
                  onClick={() => document.getElementById('multi-image-input')?.click()}
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#2563EB'; }}
                  onDragLeave={(e) => { e.currentTarget.style.borderColor = '#CBD5E1'; }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.borderColor = '#CBD5E1';
                    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
                    setSelectedFiles(prev => [...prev, ...files]);
                  }}
                >
                  <div style={{ fontSize: "1.8rem", marginBottom: "4px" }}>📸</div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#475569" }}>Click or drag & drop images to upload</div>
                  <div style={{ fontSize: "0.75rem", color: "#94A3B8", marginTop: "2px" }}>First selected image will be the primary cover</div>
                  <input
                    id="multi-image-input"
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: "none" }}
                    onChange={(e) => {
                      if (e.target.files) {
                        setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                      }
                    }}
                  />
                </div>
                {/* Preview thumbnails */}
                {selectedFiles.length > 0 && (
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "12px" }}>
                    {selectedFiles.map((file, idx) => (
                      <div key={idx} style={{ position: "relative", width: "72px", height: "72px", borderRadius: "8px", overflow: "hidden", border: idx === 0 ? "2px solid #2563EB" : "1px solid #E2E8F0" }}>
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${idx + 1}`}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                        {idx === 0 && (
                          <span style={{ position: "absolute", bottom: "0", left: "0", right: "0", background: "#2563EB", color: "#fff", fontSize: "9px", textAlign: "center", fontWeight: 700 }}>Cover</span>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))}
                          style={{
                            position: "absolute", top: "2px", right: "2px",
                            width: "18px", height: "18px", borderRadius: "50%",
                            background: "rgba(220, 38, 38, 0.9)", color: "#fff",
                            border: "none", cursor: "pointer", fontSize: "11px",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 8. Video Upload */}
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569", marginBottom: "6px", display: "block" }}>Property Walkthrough Video (Optional)</label>
                <div
                  style={{
                    border: "2px dashed #CBD5E1",
                    borderRadius: "10px",
                    padding: "14px",
                    textAlign: "center",
                    background: "#F8FAFC",
                    cursor: "pointer",
                  }}
                  onClick={() => document.getElementById('video-input')?.click()}
                >
                  <div style={{ fontSize: "1.3rem", marginBottom: "2px" }}>🎬</div>
                  <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>
                    {selectedVideo ? selectedVideo.name : "Click to upload walkthrough video (MP4, WEBM)"}
                  </div>
                  <input
                    id="video-input"
                    type="file"
                    accept="video/*"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedVideo(e.target.files[0]);
                      }
                    }}
                  />
                </div>
                {selectedVideo && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
                    <span style={{ fontSize: "0.8rem", color: "#16A34A", fontWeight: 600 }}>✓ {selectedVideo.name} ({(selectedVideo.size / 1024 / 1024).toFixed(1)} MB)</span>
                    <button
                      type="button"
                      onClick={() => setSelectedVideo(null)}
                      style={{ background: "none", border: "none", color: "#DC2626", cursor: "pointer", fontWeight: 700, fontSize: "0.8rem" }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px", paddingTop: "12px", borderTop: "1px solid #E2E8F0" }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: "10px 18px", borderRadius: "8px", border: "1px solid #CBD5E1", background: "#fff", cursor: "pointer", fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  style={{ padding: "10px 24px", borderRadius: "8px", background: "#2563EB", color: "#fff", border: "none", cursor: isUploading ? "not-allowed" : "pointer", fontWeight: 700 }}
                >
                  {isUploading ? `Uploading media...` : "Publish Property Listing"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Property Modal (read-only) */}
      {selectedProperty && (
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
              maxWidth: "720px",
              maxHeight: "90vh",
              overflowY: "auto",
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
              <div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0F172A" }}>{selectedProperty.title}</h2>
                <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                  <span style={{ fontSize: "0.75rem", padding: "2px 8px", borderRadius: "4px", background: "#EFF6FF", color: "#1D4ED8", fontWeight: 600 }}>
                    {selectedProperty.listing_type === "fractional" ? "INVEST / FRACTIONAL" : "BUY / OUTRIGHT"}
                  </span>
                  <span style={{ fontSize: "0.75rem", padding: "2px 8px", borderRadius: "4px", background: "#F1F5F9", color: "#475569", fontWeight: 600 }}>
                    {selectedProperty.property_type}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedProperty(null)}
                style={{ background: "#F1F5F9", border: "none", borderRadius: "8px", padding: "6px 12px", cursor: "pointer", fontWeight: 700 }}
              >
                ✕
              </button>
            </div>

            {selectedProperty.images && selectedProperty.images.length > 0 && (
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "20px" }}>
                {selectedProperty.images.map((img: any, idx: number) => (
                  <img
                    key={img.id || idx}
                    src={img.image_url}
                    alt={`${selectedProperty.title} ${idx + 1}`}
                    style={{ width: "140px", height: "100px", objectFit: "cover", borderRadius: "8px", border: "1px solid #E2E8F0" }}
                  />
                ))}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", fontSize: "0.85rem", color: "#334155" }}>
              <div><strong>Location:</strong> {selectedProperty.locality}, {selectedProperty.district}, {selectedProperty.state}</div>
              <div><strong>Area:</strong> {selectedProperty.area_sqft ? `${Number(selectedProperty.area_sqft).toLocaleString("en-IN")} sq.ft.` : "—"}</div>
              <div><strong>Listing Type:</strong> {selectedProperty.listing_type || "fractional"}</div>
              <div><strong>Approval Status:</strong> {selectedProperty.approval_status}</div>
              <div><strong>Price / Fraction:</strong> ₹{Number(selectedProperty.price_per_fraction).toLocaleString("en-IN")}</div>
              <div><strong>Booking Amount:</strong> ₹{Number(selectedProperty.booking_amount).toLocaleString("en-IN")}</div>
              <div><strong>Assured Yield:</strong> {selectedProperty.assured_yield ? `${selectedProperty.assured_yield}%` : "—"}</div>
              <div><strong>Target IRR:</strong> {selectedProperty.target_irr ? `${selectedProperty.target_irr}%` : "—"}</div>
              <div>
                <strong>Posted By:</strong>{" "}
                {selectedProperty.profile?.full_name || selectedProperty.postedBy || "Admin"}
                {selectedProperty.profile?.role ? ` (${selectedProperty.profile.role})` : ""}
              </div>
              <div><strong>Full Address:</strong> {selectedProperty.full_address || "—"}</div>
              {selectedProperty.google_maps_url && (
                <div style={{ gridColumn: "span 2" }}>
                  <strong>Google Maps:</strong>{" "}
                  <a href={selectedProperty.google_maps_url} target="_blank" rel="noopener noreferrer" style={{ color: "#2563EB", textDecoration: "underline" }}>
                    {selectedProperty.google_maps_url} ↗
                  </a>
                </div>
              )}
            </div>

            <div style={{ marginTop: "20px", padding: "16px", background: "#F8FAFC", borderRadius: "10px" }}>
              <div style={{ fontWeight: 700, marginBottom: "8px", fontSize: "0.85rem" }}>Share Pool Status</div>
              {(selectedProperty.listing_type || "fractional") === "fractional" ? (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "6px" }}>
                    <span>Sold: <strong style={{ color: "#16A34A" }}>{selectedProperty.sold_fractions}</strong></span>
                    <span>Available: <strong style={{ color: "#2563EB" }}>{selectedProperty.available_fractions}</strong></span>
                    <span>Total: <strong>{selectedProperty.total_fractions}</strong></span>
                  </div>
                  <div style={{ height: "10px", width: "100%", background: "#E2E8F0", borderRadius: "5px", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${selectedProperty.total_fractions > 0 ? (selectedProperty.sold_fractions / selectedProperty.total_fractions) * 100 : 0}%`,
                        background: "linear-gradient(90deg, #10B981, #059669)",
                      }}
                    />
                  </div>
                </>
              ) : (
                <div style={{ fontSize: "0.85rem" }}>
                  Whole-property listing ({selectedProperty.listing_type}) — single unit, 100% ownership.
                </div>
              )}
            </div>

            {selectedProperty.description && (
              <div style={{ marginTop: "20px" }}>
                <div style={{ fontWeight: 700, marginBottom: "6px", fontSize: "0.85rem" }}>Description</div>
                <div style={{ fontSize: "0.85rem", color: "#475569", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{selectedProperty.description}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sell Property to Investor Modal */}
      {sellModalProperty && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(4px)",
            zIndex: 200,
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
              maxWidth: "600px",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid #E2E8F0",
                padding: "20px 24px",
              }}
            >
              <div>
                <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0F172A", margin: 0 }}>
                  Sell Property to Investor
                </h2>
                <p style={{ fontSize: "0.8rem", color: "#64748B", marginTop: "4px", margin: 0 }}>
                  {sellModalProperty.title} — {sellModalProperty.locality}, {sellModalProperty.district}
                </p>
              </div>
              <button
                onClick={() => {
                  setSellModalProperty(null);
                  setSelectedInvestor(null);
                  setInvestorSearch("");
                  setSaleAmount("");
                }}
                style={{
                  background: "#F1F5F9",
                  border: "none",
                  borderRadius: "8px",
                  padding: "6px 12px",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: "1rem",
                }}
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
              {/* Sale Amount */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "6px" }}>
                  Sale Amount (₹)
                </label>
                <input
                  type="number"
                  placeholder={`Default: ₹${(Number(sellModalProperty.price_per_fraction) * sellModalProperty.total_fractions).toLocaleString("en-IN")}`}
                  value={saleAmount}
                  onChange={(e) => setSaleAmount(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #CBD5E1",
                    fontSize: "0.9rem",
                  }}
                />
                <div style={{ fontSize: "0.72rem", color: "#94A3B8", marginTop: "4px" }}>
                  Leave blank to use default: ₹{(Number(sellModalProperty.price_per_fraction) * sellModalProperty.total_fractions).toLocaleString("en-IN")} ({sellModalProperty.total_fractions} fractions × ₹{Number(sellModalProperty.price_per_fraction).toLocaleString("en-IN")})
                </div>
              </div>

              {/* Investor Selection */}
              <div style={{ marginBottom: "12px" }}>
                <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "6px" }}>
                  Select Investor / Buyer
                </label>
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={investorSearch}
                  onChange={(e) => setInvestorSearch(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #CBD5E1",
                    fontSize: "0.85rem",
                  }}
                />
              </div>

              {/* Selected Investor Chip */}
              {selectedInvestor && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    background: "#EDE9FE",
                    border: "2px solid #7C3AED",
                    marginBottom: "12px",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#4C1D95" }}>
                      ✓ {selectedInvestor.full_name}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#6D28D9" }}>
                      {selectedInvestor.email} • {selectedInvestor.phone_number}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedInvestor(null)}
                    style={{ background: "none", border: "none", color: "#7C3AED", fontWeight: 800, cursor: "pointer", fontSize: "0.9rem" }}
                  >
                    Change
                  </button>
                </div>
              )}

              {/* Investor List */}
              {!selectedInvestor && (
                <div
                  style={{
                    border: "1px solid #E2E8F0",
                    borderRadius: "10px",
                    maxHeight: "280px",
                    overflowY: "auto",
                  }}
                >
                  {loadingInvestors ? (
                    <div style={{ padding: "24px", textAlign: "center", color: "#94A3B8", fontSize: "0.85rem" }}>
                      Loading investors...
                    </div>
                  ) : (() => {
                    const q = investorSearch.toLowerCase();
                    const filtered = allInvestors.filter(
                      (inv) =>
                        (inv.full_name || "").toLowerCase().includes(q) ||
                        (inv.email || "").toLowerCase().includes(q) ||
                        (inv.phone_number || "").includes(q)
                    );
                    if (filtered.length === 0) {
                      return (
                        <div style={{ padding: "24px", textAlign: "center", color: "#94A3B8", fontSize: "0.85rem" }}>
                          No investors found{investorSearch ? ` matching "${investorSearch}"` : ""}.
                        </div>
                      );
                    }
                    return filtered.map((inv, idx) => (
                      <div
                        key={inv.id}
                        onClick={() => setSelectedInvestor(inv)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "12px 14px",
                          cursor: "pointer",
                          borderBottom: idx < filtered.length - 1 ? "1px solid #F1F5F9" : "none",
                          transition: "background 0.15s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFC")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#1E293B" }}>
                            {inv.full_name}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "#64748B" }}>
                            {inv.email} {inv.phone_number !== "—" ? `• ${inv.phone_number}` : ""}
                          </div>
                        </div>
                        <div style={{ fontSize: "0.7rem", color: "#94A3B8", textAlign: "right" }}>
                          {inv.total_invested ? `₹${Number(inv.total_invested).toLocaleString("en-IN")} invested` : "No investments yet"}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                padding: "16px 24px",
                borderTop: "1px solid #E2E8F0",
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
              }}
            >
              <button
                onClick={() => {
                  setSellModalProperty(null);
                  setSelectedInvestor(null);
                  setInvestorSearch("");
                  setSaleAmount("");
                }}
                style={{
                  padding: "10px 18px",
                  borderRadius: "8px",
                  border: "1px solid #CBD5E1",
                  background: "#fff",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                disabled={!selectedInvestor || isSelling}
                onClick={handleConfirmSell}
                style={{
                  padding: "10px 24px",
                  borderRadius: "8px",
                  background: !selectedInvestor || isSelling ? "#C4B5FD" : "#7C3AED",
                  color: "#fff",
                  border: "none",
                  cursor: !selectedInvestor || isSelling ? "not-allowed" : "pointer",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                }}
              >
                {isSelling ? "Processing Sale..." : "Confirm Sale & Transfer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
