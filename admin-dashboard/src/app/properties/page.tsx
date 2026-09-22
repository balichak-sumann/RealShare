"use client";
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import AdminLayout from "@/components/layout/AdminLayout";
import { getAuthHeader } from "@/lib/api-auth";
import { useAuth } from "@/contexts/AuthContext";
import { uploadFileToServer } from "@/lib/upload";
import DeleteOtpModal from "@/components/modals/DeleteOtpModal";
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
  area_sqft_max?: number | string;
  rera_number?: string;
  permission_number?: string;
  google_maps_url?: string;
  lat?: number | string;
  lng?: number | string;
  views_count?: number;
  is_sold_out?: boolean;
  area_unit?: string;
  sub_type?: string;
  floor_type?: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  flooring?: string;
  kitchen_type?: string;
  parking_count?: number | null;
  club_house?: boolean;
  amenities?: string;
  furnished?: boolean;
  plug_and_play?: boolean;
  central_ac?: boolean;
  preleased?: boolean;
  maintenance_avail?: boolean;
  fencing?: boolean;
  electricity_avail?: boolean;
  farm_shed?: boolean;
  bore_wells?: boolean;
  plants_available?: boolean;
  loan_availability?: boolean;
  land_registered?: boolean;
  pass_book?: boolean;
  raithu_bharosa?: boolean;
  approach_road?: string;
  under_irrigation?: boolean;
  speciality?: string;
  deposit_type?: string;
  deposit_months?: number | null;
  deposit_amount?: number | string | null;
  rental_amount?: number | string | null;
  documents?: Array<{ id: string; title: string; document_url: string; file_type: string; file_size?: number | null }>;
  expires_at?: string;
}

const INITIAL_NEW_PROP_STATE = {
  title: "",
  shortDescription: "",
  description: "",
  state: "Telangana",
  district: "Hyderabad",
  locality: "",
  fullAddress: "",
  type: "Commercial" as "Commercial" | "Fractional" | "Residential" | "Holiday" | "Plots & Farms",
  listingType: "fractional" as "fractional" | "outright" | "rental" | "resale",
  areaSqft: 1200,
  areaSqftMax: null as number | null,
  areaUnit: "sqft" as "sqft" | "sqyards" | "acres",
  reraNumber: "",
  permissionNumber: "",
  googleMapsUrl: "",
  totalFractions: "" as unknown as number,
  totalPrice: "" as unknown as number, // total property price for fractional
  price: "" as unknown as number,        // price per fraction (auto-calculated) or direct price for outright/rental
  yield: "" as unknown as number,
  irr: "" as unknown as number,
  postedBy: "Admin" as const,
  subType: "",
  floorType: "",
  bedrooms: null as number | null,
  bathrooms: null as number | null,
  flooring: "",
  kitchenType: "",
  parkingCount: null as number | null,
  clubHouse: false,
  amenities: "",
  furnished: false,
  plugAndPlay: false,
  centralAc: false,
  preleased: false,
  maintenanceAvail: false,
  fencing: false,
  electricityAvail: false,
  farmShed: false,
  boreWells: false,
  plantsAvailable: false,
  loanAvailability: false,
  landRegistered: false,
  passBook: false,
  raithuBharosa: false,
  approachRoad: "",
  underIrrigation: false,
  // New fields
  speciality: "",
  depositType: "months" as "months" | "custom",
  depositMonths: 2 as number,
  depositAmount: null as number | null,
  rentalAmount: null as number | null,
};


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
  const { userProfile } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusTab, setStatusTab] = useState<"All" | "Pending Approval" | "Active" | "Sold Out">("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [bhkAreas, setBhkAreas] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

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
      type: (["Commercial", "Fractional", "Residential", "Holiday", "Plots & Farms"].includes(p.property_type ? p.property_type.trim().charAt(0).toUpperCase() + p.property_type.trim().slice(1).toLowerCase() : "") 
        ? p.property_type.trim().charAt(0).toUpperCase() + p.property_type.trim().slice(1).toLowerCase() 
        : "Commercial") as any,
      listingType: (p.listing_type as any) || "fractional",
      areaSqft: Number(p.area_sqft) || 1200,
      areaSqftMax: p.area_sqft_max ? Number(p.area_sqft_max) : null,
      areaUnit: (p.area_unit as any) || "sqft",
      reraNumber: p.rera_number || "",
      permissionNumber: p.permission_number || "",
      googleMapsUrl: p.google_maps_url || "",
      totalFractions: p.total_fractions != null ? p.total_fractions : ("" as unknown as number),
      totalPrice: p.price_per_fraction != null ? Number(p.price_per_fraction) * (p.total_fractions || 1) : ("" as unknown as number),
      price: p.price_per_fraction != null ? Number(p.price_per_fraction) : ("" as unknown as number),
      yield: p.assured_yield != null ? Number(p.assured_yield) : ("" as unknown as number),
      irr: p.target_irr != null ? Number(p.target_irr) : ("" as unknown as number),
      postedBy: "Admin",
      // Shared
      subType: p.sub_type || "",
      floorType: p.floor_type || "",
      // Residential
      bedrooms: p.bedrooms ?? null,
      bathrooms: p.bathrooms ?? null,
      flooring: p.flooring || "",
      kitchenType: p.kitchen_type || "",
      parkingCount: p.parking_count ?? null,
      clubHouse: p.club_house ?? false,
      amenities: p.amenities || "",
      // Commercial
      furnished: p.furnished ?? false,
      plugAndPlay: p.plug_and_play ?? false,
      centralAc: p.central_ac ?? false,
      preleased: p.preleased ?? false,
      maintenanceAvail: p.maintenance_avail ?? false,
      // Farm/Plot
      fencing: p.fencing ?? false,
      electricityAvail: p.electricity_avail ?? false,
      farmShed: p.farm_shed ?? false,
      boreWells: p.bore_wells ?? false,
      plantsAvailable: p.plants_available ?? false,
      loanAvailability: p.loan_availability ?? false,
      landRegistered: p.land_registered ?? false,
      passBook: p.pass_book ?? false,
      raithuBharosa: p.raithu_bharosa ?? false,
      approachRoad: p.approach_road || "",
      underIrrigation: p.under_irrigation ?? false,
      // New fields
      speciality: p.speciality || "",
      depositType: (p.deposit_type as any) || "months",
      depositMonths: p.deposit_months ?? 2,
      depositAmount: p.deposit_amount ? Number(p.deposit_amount) : null,
      rentalAmount: p.rental_amount ? Number(p.rental_amount) : null,
    });
    setMapLat(Number(p.lat) || 17.385);
    setMapLng(Number(p.lng) || 78.4867);
    // Load existing documents
    setExistingDocs(p.documents || []);
    setSelectedDocs([]);
    setShowAddModal(true);
  };

  // New Property Form State
  const [newProp, setNewProp] = useState({ ...INITIAL_NEW_PROP_STATE });
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
  const [selectedDocs, setSelectedDocs] = useState<File[]>([]);
  const [existingDocs, setExistingDocs] = useState<Array<{ id: string; title: string; document_url: string; file_type: string }>>([]);
  const [customAmenityInput, setCustomAmenityInput] = useState("");
  const [showCustomAmenityInput, setShowCustomAmenityInput] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [mapLat, setMapLat] = useState(17.385);
  const [mapLng, setMapLng] = useState(78.4867);
  const HOME_APP_URL = process.env.NEXT_PUBLIC_HOME_APP_URL || 'https://realshare.in';

  // Preview & Publish state
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [previewBlobUrls, setPreviewBlobUrls] = useState<string[]>([]);

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

  const handleUpdateExpiresAt = async (id: string, newDateStr: string) => {
    try {
      const authHeader = await getAuthHeader();
      if (!authHeader) { showToast('You must be signed in to do that.'); return; }
      const res = await fetch(`/api/properties/${id}`, {
        method: 'PATCH',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ expires_at: newDateStr })
      });
      if (res.ok) {
        setProperties((prev) => prev.map((p) => {
          if (p.id === id) {
            return { ...p, expires_at: newDateStr };
          }
          return p;
        }));
        showToast(`Property expiration date updated.`);
      } else {
        const data = await res.json();
        alert(`Failed to update expiration: ${data.error || res.status}`);
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
      const res = await fetch('/api/buyers', { headers: authHeader });
      if (res.ok) {
        const data = await res.json();
        setAllInvestors(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load buyers:', err);
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

  const handleDeleteProperty = (id: string) => {
    const targetProp = properties.find((p) => p.id === id);
    setDeleteTarget({ id, title: targetProp?.title || id });
  };

  // ── Validate required fields; returns array of error messages ──
  const validateForm = (): string[] => {
    const errors: string[] = [];
    if (!newProp.title || !newProp.title.trim()) errors.push("Property Title is required.");
    if (!newProp.locality || !newProp.locality.trim()) errors.push("Locality is required.");
    if (!newProp.description || newProp.description.trim().length < 5)
      errors.push("Description must be at least 5 characters.");
    if (!newProp.areaSqft || Number(newProp.areaSqft) <= 0)
      errors.push("A valid property area (sq.ft / acres / sq.yards) is required.");
    return errors;
  };

  // ── Called by 'Preview & Publish' button ──
  const handlePreviewAndPublish = () => {
    // Sync BHK Areas for Residential/Holiday
    if (['Residential', 'Holiday'].includes(newProp.type)) {
      const areas = Object.values(bhkAreas).map(v => Number(v)).filter(v => v > 0);
      if (areas.length > 0) {
        const minArea = Math.min(...areas);
        const maxArea = Math.max(...areas);
        newProp.areaSqft = minArea;
        newProp.areaSqftMax = maxArea > minArea ? maxArea : null;
        
        // Auto-set bedrooms if a single BHK was selected
        if (areas.length === 1) {
          const bhkKey = Object.keys(bhkAreas)[0];
          const bhkNum = parseInt(bhkKey);
          if (!isNaN(bhkNum)) newProp.bedrooms = bhkNum;
        }
      } else {
        newProp.areaSqft = 0; // Trigger validation error
      }
    }

    const errors = validateForm();
    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors([]);
    // Build blob preview URLs for selected images
    const blobs = selectedFiles.map((f) => URL.createObjectURL(f));
    setPreviewBlobUrls(blobs);
    setShowPreviewModal(true);
  };

  const handleCreateProperty = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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

      // Upload documents if selected
      const uploadedDocumentUrls: Array<{ url: string; title: string; file_type: string; file_size: number }> = [];
      if (selectedDocs.length > 0) {
        for (const file of selectedDocs) {
          try {
            const url = await uploadFileToServer(file, authHeader);
            const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
            uploadedDocumentUrls.push({ url, title: file.name, file_type: ext, file_size: file.size });
          } catch (uploadError: any) {
            console.error('Document upload failed:', uploadError);
            showToast(`Failed to upload ${file.name}: ${uploadError.message}`);
          }
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
          area_sqft_max: newProp.areaSqftMax ? Number(newProp.areaSqftMax) : undefined,
          area_unit: newProp.areaUnit || 'sqft',
          rera_number: newProp.reraNumber || undefined,
          permission_number: newProp.permissionNumber || undefined,
          total_fractions: newProp.listingType === "fractional" ? Number(newProp.totalFractions) : 1,
          available_fractions: newProp.listingType === "fractional" ? Number(newProp.totalFractions) : 1,
          // Fractional: fraction price = totalPrice / totalFractions; else direct price
          price_per_fraction: newProp.listingType === "fractional"
            ? Math.round(Number((newProp as any).totalPrice || 0) / Math.max(1, Number(newProp.totalFractions)))
            : Number(newProp.price),
          booking_amount: newProp.listingType === "fractional"
            ? Math.round(Number((newProp as any).totalPrice || 0) / Math.max(1, Number(newProp.totalFractions)) * 0.1)
            : Math.round(Number(newProp.price) * 0.1),
          // Yield / IRR (non-rental)
          assured_yield: newProp.listingType !== 'rental' ? Number(newProp.yield) : undefined,
          target_irr: newProp.listingType !== 'rental' ? Number(newProp.irr) : undefined,
          // Rental-specific
          rental_amount: newProp.listingType === 'rental' ? Number((newProp as any).rentalAmount) || undefined : undefined,
          deposit_type: newProp.listingType === 'rental' ? (newProp as any).depositType || undefined : undefined,
          deposit_months: newProp.listingType === 'rental' && (newProp as any).depositType === 'months' ? Number((newProp as any).depositMonths) || undefined : undefined,
          deposit_amount: newProp.listingType === 'rental' && (newProp as any).depositType === 'custom' ? Number((newProp as any).depositAmount) || undefined : undefined,
          // Speciality
          speciality: (newProp as any).speciality || undefined,
          lat: mapLat,
          lng: mapLng,
          google_maps_url: newProp.googleMapsUrl || undefined,
          video_url: videoUrl || undefined,
          featured: false,
          image_urls: uploadedImageUrls,
          image_url: uploadedImageUrls[0],
          document_urls: uploadedDocumentUrls.length > 0 ? uploadedDocumentUrls : undefined,
          // Shared
          sub_type: newProp.subType || undefined,
          floor_type: newProp.floorType || undefined,
          // Residential
          bedrooms: newProp.bedrooms ?? undefined,
          bathrooms: newProp.bathrooms ?? undefined,
          flooring: newProp.flooring || undefined,
          kitchen_type: newProp.kitchenType || undefined,
          parking_count: newProp.parkingCount ?? undefined,
          club_house: newProp.clubHouse,
          amenities: newProp.amenities || undefined,
          // Commercial
          furnished: newProp.furnished,
          plug_and_play: newProp.plugAndPlay,
          central_ac: newProp.centralAc,
          preleased: newProp.preleased,
          maintenance_avail: newProp.maintenanceAvail,
          // Farm/Plot
          fencing: newProp.fencing,
          electricity_avail: newProp.electricityAvail,
          farm_shed: newProp.farmShed,
          bore_wells: newProp.boreWells,
          plants_available: newProp.plantsAvailable,
          loan_availability: newProp.loanAvailability,
          land_registered: newProp.landRegistered,
          pass_book: newProp.passBook,
          raithu_bharosa: newProp.raithuBharosa,
          approach_road: newProp.approachRoad || undefined,
          under_irrigation: newProp.underIrrigation,
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
        showToast(`Property "${created.title}" successfully added with ${uploadedImageUrls.length} images${videoUrl ? ' and 1 video' : ''}${uploadedDocumentUrls.length > 0 ? ` and ${uploadedDocumentUrls.length} document(s)` : ''}.`);
      }
      setShowAddModal(false);
      setEditingPropertyId(null);
      setSelectedFiles([]);
      setSelectedVideo(null);
      setSelectedDocs([]);
      setExistingDocs([]);
      setShowCustomAmenityInput(false);
      setCustomAmenityInput("");
      setNewProp({ ...INITIAL_NEW_PROP_STATE });
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
      <div className="rs-grid-3"
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
          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase" }}>
            Total Properties
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "6px", color: "var(--text-primary)" }}>
            {properties.length}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: 4 }}>
            Across all categories
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
            Live Properties
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "6px", color: "#16A34A" }}>
            {activeListingsCount}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#16A34A", marginTop: 4 }}>
            Currently active & available
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
          <div style={{ fontSize: "0.75rem", color: "#EF4444", fontWeight: 600, textTransform: "uppercase" }}>
            Sold Out Properties
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "6px", color: "#EF4444" }}>
            {soldOutCount}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#EF4444", marginTop: 4 }}>
            Fully funded / sold out
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
            {["All", "Commercial", "Fractional", "Residential", "Holiday", "Plots & Farms"].map((t) => (
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
            setNewProp({ ...INITIAL_NEW_PROP_STATE });
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
                const filterMap: Record<string, string[]> = {
                  "Residential": ["residential"],
                  "Commercial": ["commercial"],
                  "Fractional": ["fractional"],
                  "Investor": ["buyer", "investor"],
                  "Plots & Farms": ["buyer", "plot", "plots & farms"],
                  "Holiday Homes": ["holiday", "holiday homes"],
                };
                const allowedTypes = filterMap[typeFilter] || [];
                const propTypeLower = (p.property_type || "").toLowerCase();
                const listingTypeLower = (p.listing_type || "").toLowerCase();

                if (typeFilter === "Fractional") {
                  if (propTypeLower !== "fractional" && listingTypeLower !== "fractional") return false;
                } else {
                  if (!allowedTypes.includes(propTypeLower)) return false;
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
                      <div
                        className={styles.propTitle}
                        style={{ cursor: 'pointer', color: '#2563EB', textDecoration: 'underline' }}
                        onClick={() => window.open(`${HOME_APP_URL}/property/${p.id}`, '_blank')}
                        title="View on Home App"
                      >
                        {p.title}
                      </div>
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
                    {p.listing_type === "rental"
                      ? `Rent: ₹${Number((p as any).rental_amount || p.price_per_fraction).toLocaleString("en-IN")}/mo`
                      : p.listing_type === "outright"
                      ? "Full property price"
                      : `Booking: ₹${Number(p.booking_amount).toLocaleString("en-IN")}`}
                  </div>
                </td>
                <td className={styles.td}>
                  {p.listing_type === 'rental' ? (
                    <div>
                      <span className={styles.yieldVal} style={{ color: '#059669' }}>
                        {(p as any).deposit_months ? `${(p as any).deposit_months}M Deposit` : (p as any).deposit_amount ? `₹${Number((p as any).deposit_amount).toLocaleString('en-IN')} Dep.` : '—'}
                      </span>
                      <div style={{ fontSize: "0.7rem", color: "#7C3AED", fontWeight: 600 }}>Rental</div>
                    </div>
                  ) : (
                    <div>
                      <span className={styles.yieldVal}>{p.assured_yield}% Yield</span>
                      <div style={{ fontSize: "0.7rem", color: "#7C3AED", fontWeight: 600 }}>{p.target_irr}% IRR</div>
                    </div>
                  )}
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
                  <div style={{ marginTop: '6px', fontSize: '0.7rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ color: '#64748B', fontWeight: 600 }}>Expire:</span>
                    <input 
                      type="date" 
                      value={p.expires_at ? new Date(p.expires_at).toISOString().split('T')[0] : ''}
                      onChange={(e) => {
                        if(e.target.value) handleUpdateExpiresAt(p.id, new Date(e.target.value).toISOString());
                      }}
                      style={{ border: '1px solid #E2E8F0', borderRadius: '4px', padding: '2px 4px', fontSize: '0.7rem', marginTop: '2px', cursor: 'pointer', outline: 'none' }}
                    />
                  </div>
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
                    {userProfile?.role === 'superadmin' && (
                      <button
                        onClick={() => handleDeleteProperty(p.id)}
                        className={styles.deleteBtn}
                      >
                        Delete
                      </button>
                    )}
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
          className="rs-modal-overlay"
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
                <div className="rs-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
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

              {/* 2. Financial & Pricing Details */}
              <div style={{ background: "#F1F5F9", padding: "14px", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#1E293B", marginBottom: "10px" }}>
                  💰 Pricing & Investment Metrics
                </div>
                {/* FRACTIONAL MODE */}
                {newProp.listingType === "fractional" && (
                  <div className="rs-grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569" }}>Total Property Price (₹) <span style={{ color: "#EF4444" }}>*</span></label>
                      <input
                        type="number" required min={0}
                        placeholder="e.g. 25000000"
                        value={(newProp as any).totalPrice || ""}
                        onChange={(e) => {
                          const tp = Number(e.target.value);
                          const fp = Math.round(tp / Math.max(1, Number(newProp.totalFractions)));
                          setNewProp({ ...newProp, totalPrice: tp, price: fp } as any);
                        }}
                        style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", marginTop: "4px", fontSize: "0.85rem", background: "#FFFFFF" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569" }}>No. of Fractions <span style={{ color: "#EF4444" }}>*</span></label>
                      <input
                        type="number" required min={1}
                        value={newProp.totalFractions}
                        onChange={(e) => {
                          const tf = Number(e.target.value);
                          const fp = Math.round(Number((newProp as any).totalPrice || 0) / Math.max(1, tf));
                          setNewProp({ ...newProp, totalFractions: tf, price: fp } as any);
                        }}
                        style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", marginTop: "4px", fontSize: "0.85rem", background: "#FFFFFF" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569" }}>Price Per Fraction (₹) — Auto</label>
                      <div style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", marginTop: "4px", fontSize: "0.95rem", background: "#F0FDF4", color: "#065F46", fontWeight: 800, minHeight: "36px", display: "flex", alignItems: "center" }}>
                        ₹ {newProp.price > 0 ? Number(newProp.price).toLocaleString('en-IN') : '—'}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "#64748B", marginTop: "2px" }}>Calculated automatically</div>
                    </div>
                  </div>
                )}
                {/* OUTRIGHT / RESALE */}
                {(newProp.listingType === "outright" || newProp.listingType === "resale") && (
                  <div className="rs-grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569" }}>Total Price (₹) <span style={{ color: "#EF4444" }}>*</span></label>
                      <input type="number" required min={0} value={newProp.price}
                        onChange={(e) => setNewProp({ ...newProp, price: Number(e.target.value) })}
                        style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", marginTop: "4px", fontSize: "0.85rem", background: "#FFFFFF" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569" }}>Assured Yield (%)</label>
                      <input type="number" step="0.1" value={newProp.yield}
                        onChange={(e) => setNewProp({ ...newProp, yield: Number(e.target.value) })}
                        style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", marginTop: "4px", fontSize: "0.85rem", background: "#FFFFFF" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569" }}>Target IRR (%)</label>
                      <input type="number" step="0.1" value={newProp.irr}
                        onChange={(e) => setNewProp({ ...newProp, irr: Number(e.target.value) })}
                        style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", marginTop: "4px", fontSize: "0.85rem", background: "#FFFFFF" }} />
                    </div>
                  </div>
                )}
                {/* RENTAL MODE */}
                {newProp.listingType === "rental" && (
                  <div className="rs-grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569" }}>Monthly Rent (₹) <span style={{ color: "#EF4444" }}>*</span></label>
                      <input
                        type="number" required min={0}
                        placeholder="e.g. 45000"
                        value={(newProp as any).rentalAmount || ""}
                        onChange={(e) => setNewProp({ ...newProp, rentalAmount: Number(e.target.value), price: Number(e.target.value) } as any)}
                        style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", marginTop: "4px", fontSize: "0.85rem", background: "#FFFFFF" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569" }}>Security Deposit</label>
                      <select
                        value={(newProp as any).depositType === 'custom' ? 'custom' : ((newProp as any).depositMonths || 2).toString()}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'custom') {
                            setNewProp({ ...newProp, depositType: 'custom' } as any);
                          } else {
                            setNewProp({ ...newProp, depositType: 'months', depositMonths: Number(val) } as any);
                          }
                        }}
                        style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", marginTop: "4px", background: "#fff", fontSize: "0.85rem" }}
                      >
                        {[1,2,3,4,5,6].map(m => <option key={m} value={m}>{m} Month{m > 1 ? 's' : ''} = ₹{((newProp as any).rentalAmount ? Number((newProp as any).rentalAmount) * m : 0).toLocaleString('en-IN')}</option>)}
                        <option value="custom">Custom Amount</option>
                      </select>
                      
                      {/* Custom amount input */}
                      {(newProp as any).depositType === 'custom' && (
                        <input
                          type="number" min={0}
                          placeholder="Custom deposit amount (₹)"
                          value={(newProp as any).depositAmount || ""}
                          onChange={(e) => setNewProp({ ...newProp, depositAmount: Number(e.target.value) } as any)}
                          style={{ width: "100%", padding: "6px", borderRadius: "6px", border: "1px solid #CBD5E1", marginTop: "4px", fontSize: "0.8rem" }}
                        />
                      )}
                    </div>
                    <div>
                      <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569" }}>Deposit Summary</label>
                      <div style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", marginTop: "4px", fontSize: "0.85rem", background: "#F0FDF4", color: "#065F46", fontWeight: 700, minHeight: "36px", display: "flex", alignItems: "center" }}>
                        {(newProp as any).depositType === 'custom'
                          ? `₹ ${Number((newProp as any).depositAmount || 0).toLocaleString('en-IN')} (Custom)`
                          : `₹ ${((newProp as any).rentalAmount ? Number((newProp as any).rentalAmount) * Number((newProp as any).depositMonths || 2) : 0).toLocaleString('en-IN')} (${(newProp as any).depositMonths || 2} months)`
                        }
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Category, Sub-type & Area */}
              <div className="rs-grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>
                    Category <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <select
                    value={newProp.type}
                    onChange={(e) => setNewProp({ ...newProp, type: e.target.value as any, subType: "" })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1", marginTop: "4px", background: "#fff" }}
                  >
                    <option value="Commercial">🏢 Commercial</option>
                    <option value="Fractional">📊 Fractional</option>
                    <option value="Residential">🏠 Residential / Apartment</option>
                    <option value="Holiday">🌴 Holiday / Resort</option>
                    <option value="Buyer">🌾 Plot / Farm Land</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>Sub-Type</label>
                  <select
                    value={newProp.subType}
                    onChange={(e) => setNewProp({ ...newProp, subType: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1", marginTop: "4px", background: "#fff" }}
                  >
                    <option value="">— Select —</option>
                    {(newProp.type === "Residential" || newProp.type === "Holiday")
                      ? ["Apartment", "Villa", "Independent House", "Row House", "Studio", "Penthouse"].map(s => <option key={s} value={s}>{s}</option>)
                      : (newProp.type === "Plots & Farms")
                      ? ["Open Plot", "Farm Land", "Agricultural Land"].map(s => <option key={s} value={s}>{s}</option>)
                      : ["Office Space", "Retail Shop", "Showroom", "Warehouse", "Co-working"].map(s => <option key={s} value={s}>{s}</option>)
                    }
                  </select>
                </div>
                {['Residential', 'Holiday'].includes(newProp.type) ? (
                  <div style={{ gridColumn: "span 2", background: "#F8FAFC", padding: "12px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                    <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>
                      Available Configurations <span style={{ color: "#EF4444" }}>*</span>
                    </label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
                      {['1 BHK', '2 BHK', '3 BHK', '4 BHK', '5 BHK', '5+ BHK'].map(bhk => (
                        <button
                          key={bhk}
                          type="button"
                          onClick={() => {
                            const newAreas = { ...bhkAreas };
                            if (newAreas[bhk] !== undefined) delete newAreas[bhk];
                            else newAreas[bhk] = '';
                            setBhkAreas(newAreas);
                          }}
                          style={{
                            padding: "6px 12px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer",
                            background: bhkAreas[bhk] !== undefined ? "#1E293B" : "#FFFFFF",
                            color: bhkAreas[bhk] !== undefined ? "#FFFFFF" : "#64748B",
                            border: `1px solid ${bhkAreas[bhk] !== undefined ? "#1E293B" : "#CBD5E1"}`
                          }}
                        >
                          {bhk}
                        </button>
                      ))}
                    </div>

                    {Object.keys(bhkAreas).length > 0 && (
                      <div style={{ marginTop: "12px", borderTop: "1px solid #E2E8F0", paddingTop: "12px" }}>
                        <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748B" }}>Enter Area (Sq.Ft) for selected configurations:</label>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
                          {Object.keys(bhkAreas).sort().map(bhk => (
                            <div key={bhk} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569", width: "50px" }}>{bhk}</span>
                              <input
                                type="number" required min={1}
                                placeholder={`e.g. ${bhk === '1 BHK' ? '600' : '1200'}`}
                                value={bhkAreas[bhk]}
                                onChange={(e) => setBhkAreas({ ...bhkAreas, [bhk]: e.target.value })}
                                style={{ flex: 1, padding: "6px 10px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.8rem" }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div>
                      <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>
                        Area (Min) <span style={{ color: "#EF4444" }}>*</span>
                      </label>
                      <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                        <input
                          type="number" required min={0}
                          placeholder={newProp.areaUnit === "acres" ? "e.g. 4" : newProp.areaUnit === "sqyards" ? "e.g. 150" : "e.g. 1200"}
                          value={newProp.areaSqft}
                          onChange={(e) => setNewProp({ ...newProp, areaSqft: Number(e.target.value) })}
                          style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1" }}
                        />
                        <select
                          value={newProp.areaUnit || 'sqft'}
                          onChange={(e) => setNewProp({ ...newProp, areaUnit: e.target.value as any })}
                          style={{ padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1", background: "#fff", fontSize: "0.85rem", minWidth: "90px" }}
                        >
                          <option value="sqft">Sq.Ft</option>
                          <option value="sqyards">Sq.Yards</option>
                          <option value="acres">Acres</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>
                        Area (Max) <span style={{ fontSize: "0.7rem", color: "#94A3B8" }}>(Optional)</span>
                      </label>
                      <input
                        type="number" min={0}
                        placeholder={newProp.areaUnit === "acres" ? "e.g. 6" : newProp.areaUnit === "sqyards" ? "e.g. 200" : "e.g. 1500"}
                        value={newProp.areaSqftMax || ""}
                        onChange={(e) => setNewProp({ ...newProp, areaSqftMax: e.target.value ? Number(e.target.value) : null })}
                        style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1", marginTop: "4px" }}
                      />
                      <div style={{ fontSize: "0.7rem", color: "#94A3B8", marginTop: "2px" }}>{newProp.areaUnit === "acres" ? "Acres" : newProp.areaUnit === "sqyards" ? "Sq. Yards" : "Sq. Ft."}</div>
                    </div>
                  </>
                )}
              </div>

              {/* 4. Title */}
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>
                  Property Title <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input
                  type="text" required
                  placeholder="e.g. Rajapushpa Provincia, Financial District"
                  value={newProp.title}
                  onChange={(e) => setNewProp({ ...newProp, title: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1", marginTop: "4px" }}
                />
              </div>

              {/* 4.5. Short Description */}
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>Short Description</label>
                <input
                  type="text"
                  placeholder="Visible on home screen property cards"
                  value={newProp.shortDescription}
                  onChange={(e) => setNewProp({ ...newProp, shortDescription: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1", marginTop: "4px" }}
                />
              </div>

              {/* RERA and Permission Numbers */}
              <div className="rs-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginTop: "14px" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>RERA Number <span style={{ fontSize: "0.7rem", color: "#94A3B8" }}>(Optional)</span></label>
                  <input
                    type="text"
                    placeholder="e.g. P02400001234"
                    value={newProp.reraNumber}
                    onChange={(e) => setNewProp({ ...newProp, reraNumber: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1", marginTop: "4px" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>Permission Number <span style={{ fontSize: "0.7rem", color: "#94A3B8" }}>(Optional)</span></label>
                  <input
                    type="text"
                    placeholder="e.g. HMDA/123/2024"
                    value={newProp.permissionNumber}
                    onChange={(e) => setNewProp({ ...newProp, permissionNumber: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1", marginTop: "4px" }}
                  />
                </div>
              </div>

              {/* 5. Long Description */}
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>
                  Property Description <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <textarea
                  required rows={3}
                  placeholder="Detailed overview of features, tenant profile, lease terms, amenities..."
                  value={newProp.description}
                  onChange={(e) => setNewProp({ ...newProp, description: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1", marginTop: "4px", resize: "vertical", fontFamily: "inherit" }}
                />
              </div>

              {/* 5.5. Dynamic Property-Specific Details */}
              <div style={{ background: "#F8FAFC", padding: "16px", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1E293B", marginBottom: "14px" }}>
                  {newProp.type === "Residential" || newProp.type === "Holiday" ? "🏠 Apartment / Residential Details"
                    : newProp.type === "Plots & Farms" ? "🌾 Plot / Farm Land Details"
                    : "🏢 Commercial Property Details"}
                </div>

                {/* ---- RESIDENTIAL / HOLIDAY ---- */}
                {(newProp.type === "Residential" || newProp.type === "Holiday") && (
                  <>
                    <div className="rs-grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                      <div>
                        <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569" }}>Bedrooms</label>
                        <select value={newProp.bedrooms ?? ""} onChange={(e) => setNewProp({ ...newProp, bedrooms: e.target.value ? Number(e.target.value) : null })}
                          style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", marginTop: "4px", background: "#fff", fontSize: "0.85rem" }}>
                          <option value="">—</option>
                          {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} BHK</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569" }}>Bathrooms</label>
                        <select value={newProp.bathrooms ?? ""} onChange={(e) => setNewProp({ ...newProp, bathrooms: e.target.value ? Number(e.target.value) : null })}
                          style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", marginTop: "4px", background: "#fff", fontSize: "0.85rem" }}>
                          <option value="">—</option>
                          {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569" }}>Floor Type</label>
                        <select value={newProp.floorType} onChange={(e) => setNewProp({ ...newProp, floorType: e.target.value })}
                          style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", marginTop: "4px", background: "#fff", fontSize: "0.85rem" }}>
                          <option value="">—</option>
                          {["High Rise", "Low Rise", "Multiple"].map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569" }}>Flooring</label>
                        <select value={newProp.flooring} onChange={(e) => setNewProp({ ...newProp, flooring: e.target.value })}
                          style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", marginTop: "4px", background: "#fff", fontSize: "0.85rem" }}>
                          <option value="">—</option>
                          {["Vitrified Tiles", "Marble", "Wooden", "Granite", "Ceramic", "Other"].map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569" }}>Kitchen</label>
                        <select value={newProp.kitchenType} onChange={(e) => setNewProp({ ...newProp, kitchenType: e.target.value })}
                          style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", marginTop: "4px", background: "#fff", fontSize: "0.85rem" }}>
                          <option value="">—</option>
                          {["Modular", "Open", "Semi-Modular", "Dry Kitchen"].map(k => <option key={k} value={k}>{k}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569" }}>Car Parking</label>
                        <select value={newProp.parkingCount ?? ""} onChange={(e) => setNewProp({ ...newProp, parkingCount: e.target.value ? Number(e.target.value) : null })}
                          style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", marginTop: "4px", background: "#fff", fontSize: "0.85rem" }}>
                          <option value="">—</option>
                          {[0,1,2,3,4].map(n => <option key={n} value={n}>{n} Car{n !== 1 ? "s" : ""}</option>)}
                        </select>
                      </div>
                    </div>
                    <div style={{ marginBottom: "12px" }}>
                      <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569", display: "flex", alignItems: "center", gap: "8px" }}>
                        Club House
                        <button type="button" onClick={() => setNewProp({ ...newProp, clubHouse: !newProp.clubHouse })}
                          style={{ padding: "2px 10px", borderRadius: "12px", border: "none", background: newProp.clubHouse ? "#059669" : "#CBD5E1", color: "#fff", cursor: "pointer", fontSize: "0.7rem", fontWeight: 700 }}>
                          {newProp.clubHouse ? "Yes" : "No"}
                        </button>
                      </label>
                    </div>
                    <div>
                      <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: "6px", display: "block" }}>Amenities (select all that apply)</label>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {[
                          "Swimming Pool", "Gymnasium", "Crèche / Day Care", "Lounge", "Children's Play Area / TOT LOT",
                          "Theatre", "Rooftop Lounge", "Landscape Garden", "Food Court", "Convenience Store",
                          "Cafeteria", "ATM", "Senior Citizen Lounge", "Fire Safety System", "Power Backup",
                          "24/7 Security", "CCTV", "Central Air Conditioning", "High Speed Lifts", "Conference Room",
                          "Party Hall", "Games Room", "Outdoor Seating", "Gym", "Club House",
                          "Jogging Track", "Lift", "Visitor Parking", "Garden", "Tennis Court", "Badminton Court"
                        ].map(a => {
                          const selected = (newProp.amenities || "").split(",").map(x => x.trim()).includes(a);
                          return (
                            <button key={a} type="button"
                              onClick={() => {
                                const current = (newProp.amenities || "").split(",").map(x => x.trim()).filter(Boolean);
                                const updated = selected ? current.filter(x => x !== a) : [...current, a];
                                setNewProp({ ...newProp, amenities: updated.join(", ") });
                              }}
                              style={{ padding: "4px 10px", borderRadius: "12px", border: `1px solid ${selected ? "#2563EB" : "#CBD5E1"}`, background: selected ? "#EFF6FF" : "#fff", color: selected ? "#1D4ED8" : "#475569", cursor: "pointer", fontSize: "0.75rem", fontWeight: selected ? 700 : 400 }}>
                              {a}
                            </button>
                          );
                        })}
                        {/* "+" Add Custom Amenity */}
                        <button type="button"
                          onClick={() => setShowCustomAmenityInput(true)}
                          style={{ padding: "4px 12px", borderRadius: "12px", border: "1px dashed #2563EB", background: "#EFF6FF", color: "#2563EB", cursor: "pointer", fontSize: "0.75rem", fontWeight: 700 }}>
                          + Add Custom
                        </button>
                      </div>
                      {showCustomAmenityInput && (
                        <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                          <input
                            type="text"
                            placeholder="Type custom amenity name"
                            value={customAmenityInput}
                            onChange={(e) => setCustomAmenityInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (customAmenityInput.trim()) {
                                  const current = (newProp.amenities || "").split(",").map(x => x.trim()).filter(Boolean);
                                  setNewProp({ ...newProp, amenities: [...current, customAmenityInput.trim()].join(", ") });
                                  setCustomAmenityInput("");
                                  setShowCustomAmenityInput(false);
                                }
                              }
                            }}
                            style={{ flex: 1, padding: "6px 10px", borderRadius: "6px", border: "1px solid #2563EB", fontSize: "0.8rem" }}
                            autoFocus
                          />
                          <button type="button"
                            onClick={() => {
                              if (customAmenityInput.trim()) {
                                const current = (newProp.amenities || "").split(",").map(x => x.trim()).filter(Boolean);
                                setNewProp({ ...newProp, amenities: [...current, customAmenityInput.trim()].join(", ") });
                                setCustomAmenityInput("");
                                setShowCustomAmenityInput(false);
                              }
                            }}
                            style={{ padding: "6px 12px", borderRadius: "6px", background: "#2563EB", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.8rem" }}>✓ Add</button>
                          <button type="button"
                            onClick={() => { setCustomAmenityInput(""); setShowCustomAmenityInput(false); }}
                            style={{ padding: "6px 10px", borderRadius: "6px", background: "#F1F5F9", color: "#475569", border: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.8rem" }}>✕</button>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* ---- COMMERCIAL / FRACTIONAL ---- */}
                {(newProp.type === "Commercial" || newProp.type === "Fractional") && (
                  <>
                    <div className="rs-grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                      <div>
                        <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569" }}>Floor Type</label>
                        <select value={newProp.floorType} onChange={(e) => setNewProp({ ...newProp, floorType: e.target.value })}
                          style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", marginTop: "4px", background: "#fff", fontSize: "0.85rem" }}>
                          <option value="">—</option>
                          {["High Rise", "Low Rise", "Multiple"].map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569" }}>Flooring</label>
                        <select value={newProp.flooring} onChange={(e) => setNewProp({ ...newProp, flooring: e.target.value })}
                          style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", marginTop: "4px", background: "#fff", fontSize: "0.85rem" }}>
                          <option value="">—</option>
                          {["Vitrified Tiles", "Marble", "Wooden", "Granite", "Ceramic", "Other"].map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569" }}>Car Parking</label>
                        <select value={newProp.parkingCount ?? ""} onChange={(e) => setNewProp({ ...newProp, parkingCount: e.target.value ? Number(e.target.value) : null })}
                          style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", marginTop: "4px", background: "#fff", fontSize: "0.85rem" }}>
                          <option value="">—</option>
                          {["No", "Yes – 1 Car", "Yes – 2 Cars", "Yes – 4+ Cars"].map((v, i) => <option key={i} value={i}>{v}</option>)}
                        </select>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "12px" }}>
                      {[
                        { label: "Furnished", key: "furnished" },
                        { label: "Plug & Play", key: "plugAndPlay" },
                        { label: "Central AC", key: "centralAc" },
                        { label: "Preleased", key: "preleased" },
                        { label: "Maintenance", key: "maintenanceAvail" },
                      ].map(({ label, key }) => (
                        <label key={key} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", fontWeight: 600, color: "#475569", cursor: "pointer" }}>
                          <button type="button" onClick={() => setNewProp({ ...newProp, [key]: !(newProp as any)[key] })}
                            style={{ padding: "2px 10px", borderRadius: "12px", border: "none", background: (newProp as any)[key] ? "#059669" : "#CBD5E1", color: "#fff", cursor: "pointer", fontSize: "0.7rem", fontWeight: 700 }}>
                            {(newProp as any)[key] ? "Yes" : "No"}
                          </button>
                          {label}
                        </label>
                      ))}
                    </div>
                    <div>
                      <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: "6px", display: "block" }}>Amenities (select all that apply)</label>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {[
                          "Food Court", "High Speed Lifts", "Central Air Conditioning", "Power Backup", "24/7 Security",
                          "CCTV", "Visitor Parking", "Conference Room", "Cafeteria", "ATM",
                          "Fire Safety System", "Gymnasium", "Swimming Pool", "Lounge", "Rooftop Lounge",
                          "Games Room", "Party Hall", "Outdoor Seating", "Crèche / Day Care", "Senior Citizen Lounge",
                          "Landscape Garden", "Convenience Store", "Theatre", "Children's Play Area / TOT LOT"
                        ].map(a => {
                          const selected = (newProp.amenities || "").split(",").map(x => x.trim()).includes(a);
                          return (
                            <button key={a} type="button"
                              onClick={() => {
                                const current = (newProp.amenities || "").split(",").map(x => x.trim()).filter(Boolean);
                                const updated = selected ? current.filter(x => x !== a) : [...current, a];
                                setNewProp({ ...newProp, amenities: updated.join(", ") });
                              }}
                              style={{ padding: "4px 10px", borderRadius: "12px", border: `1px solid ${selected ? "#2563EB" : "#CBD5E1"}`, background: selected ? "#EFF6FF" : "#fff", color: selected ? "#1D4ED8" : "#475569", cursor: "pointer", fontSize: "0.75rem", fontWeight: selected ? 700 : 400 }}>
                              {a}
                            </button>
                          );
                        })}
                        {/* "+" Add Custom Amenity */}
                        <button type="button"
                          onClick={() => setShowCustomAmenityInput(true)}
                          style={{ padding: "4px 12px", borderRadius: "12px", border: "1px dashed #2563EB", background: "#EFF6FF", color: "#2563EB", cursor: "pointer", fontSize: "0.75rem", fontWeight: 700 }}>
                          + Add Custom
                        </button>
                      </div>
                      {showCustomAmenityInput && (
                        <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                          <input
                            type="text"
                            placeholder="Type custom amenity name"
                            value={customAmenityInput}
                            onChange={(e) => setCustomAmenityInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (customAmenityInput.trim()) {
                                  const current = (newProp.amenities || "").split(",").map(x => x.trim()).filter(Boolean);
                                  setNewProp({ ...newProp, amenities: [...current, customAmenityInput.trim()].join(", ") });
                                  setCustomAmenityInput("");
                                  setShowCustomAmenityInput(false);
                                }
                              }
                            }}
                            style={{ flex: 1, padding: "6px 10px", borderRadius: "6px", border: "1px solid #2563EB", fontSize: "0.8rem" }}
                            autoFocus
                          />
                          <button type="button"
                            onClick={() => {
                              if (customAmenityInput.trim()) {
                                const current = (newProp.amenities || "").split(",").map(x => x.trim()).filter(Boolean);
                                setNewProp({ ...newProp, amenities: [...current, customAmenityInput.trim()].join(", ") });
                                setCustomAmenityInput("");
                                setShowCustomAmenityInput(false);
                              }
                            }}
                            style={{ padding: "6px 12px", borderRadius: "6px", background: "#2563EB", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.8rem" }}>✓ Add</button>
                          <button type="button"
                            onClick={() => { setCustomAmenityInput(""); setShowCustomAmenityInput(false); }}
                            style={{ padding: "6px 10px", borderRadius: "6px", background: "#F1F5F9", color: "#475569", border: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.8rem" }}>✕</button>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* ---- BUYER / PLOT / FARM ---- */}
                {newProp.type === "Plots & Farms" && (
                  <>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "12px" }}>
                      {[
                        { label: "Fencing", key: "fencing" },
                        { label: "Electricity", key: "electricityAvail" },
                        { label: "Farm Shed", key: "farmShed" },
                        { label: "Bore Wells", key: "boreWells" },
                        { label: "Plants", key: "plantsAvailable" },
                        { label: "Loan Availability", key: "loanAvailability" },
                      ].map(({ label, key }) => (
                        <label key={key} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", fontWeight: 600, color: "#475569", cursor: "pointer" }}>
                          <button type="button" onClick={() => setNewProp({ ...newProp, [key]: !(newProp as any)[key] })}
                            style={{ padding: "2px 10px", borderRadius: "12px", border: "none", background: (newProp as any)[key] ? "#059669" : "#CBD5E1", color: "#fff", cursor: "pointer", fontSize: "0.7rem", fontWeight: 700 }}>
                            {(newProp as any)[key] ? "Yes" : "No"}
                          </button>
                          {label}
                        </label>
                      ))}
                    </div>
                    <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#475569", marginBottom: "8px" }}>📋 Legal & Ownership</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "12px" }}>
                      {[
                        { label: "Registered", key: "landRegistered" },
                        { label: "Pass Book", key: "passBook" },
                        { label: "Raithu Bharosa", key: "raithuBharosa" },
                        { label: "Under Irrigation", key: "underIrrigation" },
                      ].map(({ label, key }) => (
                        <label key={key} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", fontWeight: 600, color: "#475569", cursor: "pointer" }}>
                          <button type="button" onClick={() => setNewProp({ ...newProp, [key]: !(newProp as any)[key] })}
                            style={{ padding: "2px 10px", borderRadius: "12px", border: "none", background: (newProp as any)[key] ? "#059669" : "#CBD5E1", color: "#fff", cursor: "pointer", fontSize: "0.7rem", fontWeight: 700 }}>
                            {(newProp as any)[key] ? "Yes" : "No"}
                          </button>
                          {label}
                        </label>
                      ))}
                    </div>
                    <div style={{ maxWidth: "260px" }}>
                      <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569" }}>Approach Road</label>
                      <select value={newProp.approachRoad} onChange={(e) => setNewProp({ ...newProp, approachRoad: e.target.value })}
                        style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", marginTop: "4px", background: "#fff", fontSize: "0.85rem" }}>
                        <option value="">— Select —</option>
                        {["BT Road", "Village Road", "Katcha"].map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  </>
                )}
              </div>

              {/* 5.9 Property Speciality Card (optional, shown on home property detail) */}
              <div style={{ background: "linear-gradient(135deg, #FFFBEB, #FEF9C3)", padding: "16px", borderRadius: "12px", border: "1px solid #FDE68A" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "1.2rem" }}>⭐</span>
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#92400E" }}>Property Speciality</div>
                    <div style={{ fontSize: "0.72rem", color: "#B45309" }}>Optional — Will be shown as a highlighted card on the property detail page</div>
                  </div>
                </div>
                <textarea
                  rows={3}
                  placeholder="e.g. Prime location in Financial District • Award-winning architecture • IGBC Gold Rated • 5 mins from Metro • Managed by renowned developer"
                  value={(newProp as any).speciality || ""}
                  onChange={(e) => setNewProp({ ...newProp, speciality: e.target.value } as any)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #FDE68A", resize: "vertical", fontFamily: "inherit", fontSize: "0.85rem", background: "#fff", color: "#1E293B" }}
                />
              </div>

              {/* 6. Location Details */}
              <div style={{ background: "#F8FAFC", padding: "16px", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1E293B", marginBottom: "12px" }}>
                  📍 Location & Mapping
                </div>
                <div className="rs-grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
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

              {/* 9. Document Upload */}
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569", marginBottom: "6px", display: "block" }}>
                  📄 Property Documents (Brochure, Legal Docs, etc.) — Optional
                </label>
                {/* Existing documents (on edit) */}
                {existingDocs.length > 0 && (
                  <div style={{ marginBottom: "10px" }}>
                    <div style={{ fontSize: "0.72rem", color: "#64748B", marginBottom: "6px", fontWeight: 600 }}>Uploaded Documents:</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      {existingDocs.map((doc) => (
                        <div key={doc.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 10px", background: "#F8FAFC", borderRadius: "6px", border: "1px solid #E2E8F0" }}>
                          <span style={{ fontSize: "0.75rem", padding: "2px 6px", borderRadius: "4px", background: doc.file_type === 'pdf' ? '#FEE2E2' : doc.file_type.startsWith('ppt') ? '#FEF3C7' : '#DBEAFE', color: doc.file_type === 'pdf' ? '#DC2626' : doc.file_type.startsWith('ppt') ? '#D97706' : '#2563EB', fontWeight: 700, textTransform: 'uppercase' }}>{doc.file_type}</span>
                          <a href={doc.document_url} target="_blank" rel="noopener noreferrer" style={{ flex: 1, fontSize: "0.8rem", color: "#1E293B", textDecoration: "none", fontWeight: 600 }}>{doc.title}</a>
                          <button type="button" onClick={() => setExistingDocs(prev => prev.filter(d => d.id !== doc.id))} style={{ background: "none", border: "none", color: "#DC2626", cursor: "pointer", fontWeight: 700, fontSize: "0.8rem" }}>✕</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div
                  style={{ border: "2px dashed #CBD5E1", borderRadius: "10px", padding: "14px", textAlign: "center", background: "#F8FAFC", cursor: "pointer" }}
                  onClick={() => document.getElementById('doc-input')?.click()}
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#2563EB'; }}
                  onDragLeave={(e) => { e.currentTarget.style.borderColor = '#CBD5E1'; }}
                  onDrop={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#CBD5E1'; const files = Array.from(e.dataTransfer.files); setSelectedDocs(prev => [...prev, ...files]); }}
                >
                  <div style={{ fontSize: "1.3rem", marginBottom: "2px" }}>📄</div>
                  <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>Click or drag PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX files</div>
                  <div style={{ fontSize: "0.72rem", color: "#94A3B8", marginTop: "2px" }}>Max 50MB per file • Multiple files allowed</div>
                  <input id="doc-input" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt" multiple style={{ display: "none" }}
                    onChange={(e) => { if (e.target.files) setSelectedDocs(prev => [...prev, ...Array.from(e.target.files!)]); }} />
                </div>
                {selectedDocs.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "8px" }}>
                    {selectedDocs.map((file, idx) => {
                      const ext = file.name.split('.').pop()?.toLowerCase() || 'doc';
                      return (
                        <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 10px", background: "#F0FDF4", borderRadius: "6px", border: "1px solid #D1FAE5" }}>
                          <span style={{ fontSize: "0.72rem", padding: "2px 6px", borderRadius: "4px", background: ext === 'pdf' ? '#FEE2E2' : ext.startsWith('ppt') ? '#FEF3C7' : '#DBEAFE', color: ext === 'pdf' ? '#DC2626' : ext.startsWith('ppt') ? '#D97706' : '#2563EB', fontWeight: 700, textTransform: 'uppercase' }}>{ext}</span>
                          <span style={{ flex: 1, fontSize: "0.8rem", color: "#1E293B", fontWeight: 600 }}>{file.name}</span>
                          <span style={{ fontSize: "0.72rem", color: "#64748B" }}>{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                          <button type="button" onClick={() => setSelectedDocs(prev => prev.filter((_, i) => i !== idx))} style={{ background: "none", border: "none", color: "#DC2626", cursor: "pointer", fontWeight: 700, fontSize: "0.8rem" }}>✕</button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Inline validation error banner */}
              {formErrors.length > 0 && (
                <div style={{
                  background: "#FEF2F2",
                  border: "1px solid #FECACA",
                  borderRadius: "10px",
                  padding: "12px 16px",
                  marginTop: "8px",
                  marginBottom: "4px",
                }}>
                  <div style={{ fontWeight: 700, color: "#DC2626", fontSize: "0.85rem", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                    ⚠️ Please fill in all required fields before previewing:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: "20px" }}>
                    {formErrors.map((err, i) => (
                      <li key={i} style={{ color: "#B91C1C", fontSize: "0.8rem", marginBottom: "2px" }}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", marginTop: "8px", paddingTop: "12px", borderTop: "1px solid #E2E8F0" }}>
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setEditingPropertyId(null); setFormErrors([]); }}
                  style={{ padding: "10px 18px", borderRadius: "8px", border: "1px solid #CBD5E1", background: "#fff", cursor: "pointer", fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePreviewAndPublish}
                  disabled={isUploading}
                  style={{
                    padding: "10px 28px",
                    borderRadius: "8px",
                    background: isUploading ? "#93C5FD" : "linear-gradient(135deg, #1D4ED8, #2563EB)",
                    color: "#fff",
                    border: "none",
                    cursor: isUploading ? "not-allowed" : "pointer",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    boxShadow: "0 4px 12px rgba(37,99,235,0.3)",
                  }}
                >
                  {isUploading ? (
                    <><span style={{ display: "inline-block", width: "14px", height: "14px", border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /> Uploading...</>
                  ) : (
                    <>👁️ Preview &amp; Publish</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Property Preview Modal (Property Details Page Replica) ── */}
      {showPreviewModal && (
        <div
          className="rs-modal-overlay"
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(15,23,42,0.85)",
            backdropFilter: "blur(4px)",
            zIndex: 300,
            display: "flex", justifyContent: "center", alignItems: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#F8FAFC",
              borderRadius: "20px",
              width: "100%",
              maxWidth: "1100px",
              maxHeight: "94vh",
              overflowY: "auto",
              boxShadow: "0 32px 80px rgba(0,0,0,0.4)",
              position: "relative",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Top Close Button (Floating) */}
            <button
              onClick={() => { setShowPreviewModal(false); previewBlobUrls.forEach(u => URL.revokeObjectURL(u)); setPreviewBlobUrls([]); }}
              style={{ position: "absolute", top: "16px", right: "20px", background: "#fff", border: "1px solid #E2E8F0", borderRadius: "50%", width: "36px", height: "36px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
            >
              <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "#64748B" }}>✕</span>
            </button>

            {/* Header (Top Navbar mock) */}
            <div style={{ background: "#fff", padding: "12px 32px", borderBottom: "1px solid #E2E8F0", display: "flex", alignItems: "center" }}>
              <div style={{ fontSize: "0.85rem", color: "#64748B" }}>
                Home &nbsp;&gt;&nbsp; Properties &nbsp;&gt;&nbsp; <span style={{ fontWeight: 600, color: "#1E293B" }}>{newProp.title || "Draft Property"}</span>
              </div>
            </div>

            {/* Main Content Area */}
            <div style={{ padding: "32px", flex: 1, display: "flex", gap: "32px", alignItems: "flex-start" }}>
              
              {/* Left & Center Section (Flex 1) */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "32px" }}>
                
                {/* Top Row: Text (Left) + Image (Center) */}
                <div style={{ display: "flex", gap: "32px" }}>
                  
                  {/* Text Column */}
                  <div style={{ width: "320px", display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div>
                      <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#1E293B", margin: "0 0 4px 0", lineHeight: 1.2 }}>
                        {newProp.title || "Property Title"}
                      </h1>
                      <div style={{ fontSize: "0.85rem", color: "#64748B", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>📍</span>
                        <span>{[newProp.locality, newProp.district, newProp.state].filter(Boolean).join(", ")}</span>
                        <span style={{ color: "#1E293B", fontWeight: 700, marginLeft: "8px", cursor: "pointer" }}>Open in Google Maps ↗</span>
                      </div>
                    </div>

                    <div style={{ fontSize: "0.85rem", color: "#64748B", lineHeight: 1.6 }}>
                      {newProp.description ? (
                        newProp.description.substring(0, 150) + (newProp.description.length > 150 ? "..." : "")
                      ) : "Property description will appear here..."}
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="rs-grid-2" style={{ background: "#F8FAFC", borderRadius: "12px", border: "1px solid #E2E8F0", padding: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "1.2rem", color: "#64748B" }}>🏢</span>
                        <div>
                          <div style={{ fontSize: "0.65rem", color: "#94A3B8", fontWeight: 600, textTransform: "uppercase" }}>Type</div>
                          <div style={{ fontSize: "0.85rem", color: "#1E293B", fontWeight: 700 }}>{newProp.type || "Commercial"}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "1.2rem", color: "#64748B" }}>📐</span>
                        <div>
                          <div style={{ fontSize: "0.65rem", color: "#94A3B8", fontWeight: 600, textTransform: "uppercase" }}>Area</div>
                          <div style={{ fontSize: "0.85rem", color: "#1E293B", fontWeight: 700 }}>{Number(newProp.areaSqft || 0).toLocaleString("en-IN")} sqft</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", gridColumn: "span 2" }}>
                        <span style={{ fontSize: "1.2rem", color: "#D4AF37" }}>💳</span>
                        <div>
                          <div style={{ fontSize: "0.65rem", color: "#94A3B8", fontWeight: 600, textTransform: "uppercase" }}>Facilities</div>
                          <div style={{ fontSize: "0.85rem", color: "#1E293B", fontWeight: 700 }}>ATMs, 24x7 Security</div>
                        </div>
                      </div>
                    </div>

                    {/* Posted By Box */}
                    <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #E2E8F0", padding: "12px", display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "40px", height: "40px", borderRadius: "20px", background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", color: "#94A3B8", fontSize: "1.2rem" }}>👤</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "0.6rem", color: "#64748B", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Property Posted By User</div>
                        <div style={{ fontSize: "0.9rem", color: "#1E293B", fontWeight: 700 }}>Realshare Admin</div>
                      </div>
                      <span style={{ color: "#059669", fontSize: "1.2rem" }}>✓</span>
                    </div>

                    <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: "10px", padding: "10px", fontSize: "0.75rem", color: "#92400E" }}>
                      ℹ️ <strong>Live Preview</strong> - Ready to post.
                    </div>
                  </div>

                  {/* Gallery Column (Center) */}
                  <div style={{ flex: 1 }}>
                    <div style={{ position: "relative", width: "100%", height: "400px", borderRadius: "16px", overflow: "hidden", background: "#E2E8F0" }}>
                      {previewBlobUrls.length > 0 ? (
                        <img src={previewBlobUrls[0]} alt="Preview Cover" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#94A3B8" }}>
                          <span style={{ fontSize: "3rem", marginBottom: "8px" }}>🏠</span>
                          <span>No cover image selected</span>
                        </div>
                      )}
                      
                      {/* Floating actions over image */}
                      <div style={{ position: "absolute", top: "16px", right: "72px", width: "40px", height: "40px", background: "#fff", borderRadius: "20px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
                        <span style={{ fontSize: "1.1rem" }}>♡</span>
                      </div>
                      <div style={{ position: "absolute", top: "16px", right: "16px", width: "40px", height: "40px", background: "#fff", borderRadius: "20px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
                        <span style={{ fontSize: "1.1rem" }}>↗</span>
                      </div>
                      <div style={{ position: "absolute", bottom: "16px", right: "16px", background: "rgba(0,0,0,0.7)", color: "#fff", padding: "8px 16px", borderRadius: "20px", fontSize: "0.85rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                        ▶ View Gallery
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabs Section (Static Mock) */}
                <div style={{ marginTop: "16px" }}>
                  <div style={{ display: "flex", gap: "24px", borderBottom: "1px solid #E2E8F0", paddingBottom: "12px", marginBottom: "24px" }}>
                    {["Overview", "Property Details", "Amenities", "Location", "Developer", "Documents"].map((tab, idx) => (
                      <div key={tab} style={{ fontSize: "0.85rem", fontWeight: 700, color: idx === 0 ? "#D4AF37" : "#64748B", position: "relative", cursor: "pointer" }}>
                        {tab}
                        {idx === 0 && <div style={{ position: "absolute", bottom: "-13px", left: 0, right: 0, height: "2px", background: "#D4AF37" }} />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column (Price & Actions) */}
              <div style={{ width: "320px", display: "flex", flexDirection: "column", gap: "24px" }}>
                
                {/* Price Card */}
                <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #E2E8F0", padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
                  <div style={{ fontSize: "0.85rem", color: "#64748B", fontWeight: 600, marginBottom: "4px" }}>Estimated Price</div>
                  <div style={{ fontSize: "2rem", fontWeight: 800, color: "#D4AF37", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>₹</span>
                    <span>
                      {newProp.listingType === "fractional"
                        ? Math.round(Number(newProp.totalPrice || 0) / Math.max(1, Number(newProp.totalFractions))).toLocaleString("en-IN")
                        : Number(newProp.price || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <button style={{ width: "100%", background: "#B48811", color: "#fff", border: "none", borderRadius: "8px", padding: "14px", fontWeight: 700, fontSize: "0.95rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", cursor: "pointer" }}>
                    📅 Request Details
                  </button>
                  <div style={{ fontSize: "0.7rem", color: "#94A3B8", textAlign: "center", marginTop: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                    <span style={{ color: "#059669" }}>✓</span> Your information is secure with Realshare
                  </div>
                </div>

                {/* Calculator Mock */}
                <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #E2E8F0", padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
                  <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1E293B", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>🧮</span> Payment Calculator
                  </div>
                  <div style={{ marginBottom: "12px" }}>
                    <div style={{ fontSize: "0.75rem", color: "#64748B", marginBottom: "6px" }}>Property Price (₹)</div>
                    <div style={{ border: "1px solid #E2E8F0", borderRadius: "8px", padding: "10px", fontSize: "0.9rem", color: "#1E293B" }}>{Number(newProp.price || 0).toLocaleString("en-IN")}</div>
                  </div>
                  <div style={{ marginBottom: "12px" }}>
                    <div style={{ fontSize: "0.75rem", color: "#64748B", marginBottom: "6px" }}>Down Payment (%)</div>
                    <div style={{ border: "1px solid #E2E8F0", borderRadius: "8px", padding: "10px", fontSize: "0.9rem", color: "#1E293B" }}>20</div>
                  </div>
                </div>

              </div>
            </div>

            {/* Bottom Sticky Action Bar */}
            <div style={{ position: "sticky", bottom: 0, background: "#fff", borderTop: "1px solid #E2E8F0", padding: "16px 32px", display: "flex", justifyContent: "flex-end", gap: "16px", borderBottomLeftRadius: "20px", borderBottomRightRadius: "20px", boxShadow: "0 -4px 12px rgba(0,0,0,0.02)" }}>
              <button
                type="button"
                onClick={() => { setShowPreviewModal(false); previewBlobUrls.forEach(u => URL.revokeObjectURL(u)); setPreviewBlobUrls([]); }}
                style={{ padding: "12px 24px", borderRadius: "8px", border: "1px solid #CBD5E1", background: "#fff", cursor: "pointer", fontWeight: 700, fontSize: "0.95rem", color: "#475569" }}
              >
                Back to Edit
              </button>
              <button
                type="button"
                disabled={isUploading}
                onClick={async () => {
                  setShowPreviewModal(false);
                  previewBlobUrls.forEach(u => URL.revokeObjectURL(u));
                  setPreviewBlobUrls([]);
                  await handleCreateProperty();
                }}
                style={{
                  padding: "12px 32px",
                  borderRadius: "8px",
                  background: isUploading ? "#93C5FD" : "linear-gradient(135deg, #059669, #10B981)",
                  color: "#fff",
                  border: "none",
                  cursor: isUploading ? "not-allowed" : "pointer",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 4px 12px rgba(16,185,129,0.3)",
                }}
              >
                {isUploading ? (
                  <><span style={{ display: "inline-block", width: "16px", height: "16px", border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /> Uploading...</>
                ) : editingPropertyId ? (
                  <>✅ Update Live Property</>
                ) : (
                  <>🚀 Confirm &amp; Post Property</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Property Modal (read-only) */}
      {selectedProperty && (
        <div
          className="rs-modal-overlay"
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

            <div className="rs-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", fontSize: "0.85rem", color: "#334155" }}>
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

      {/* Sell Property to Buyer Modal */}
      {sellModalProperty && (
        <div
          className="rs-modal-overlay"
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
                  Sell Property to Buyer
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

              {/* Buyer Selection */}
              <div style={{ marginBottom: "12px" }}>
                <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "6px" }}>
                  Select Buyer / Buyer
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

              {/* Selected Buyer Chip */}
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

              {/* Buyer List */}
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
                      Loading buyers...
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
                          No buyers found{investorSearch ? ` matching "${investorSearch}"` : ""}.
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
      {/* OTP Deletion Confirmation Modal */}
      <DeleteOtpModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        targetId={deleteTarget?.id || ""}
        targetName={deleteTarget?.title || ""}
        targetType="Property"
        deleteUrl={`/api/properties/${deleteTarget?.id}`}
        onSuccess={() => {
          if (deleteTarget) {
            setProperties((prev) => prev.filter((p) => p.id !== deleteTarget.id));
            showToast(`Property "${deleteTarget.title}" permanently deleted.`);
          }
        }}
      />
    </AdminLayout>
  );
}
