"use client";
import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon issue in Next.js/webpack
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface LocationPickerProps {
  lat: number;
  lng: number;
  onLocationChange: (lat: number, lng: number, address?: string) => void;
}

function MapClickHandler({ onLocationChange }: { onLocationChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function SearchControl({ onLocationChange }: { onLocationChange: (lat: number, lng: number, address?: string) => void }) {
  const map = useMap();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearch = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length < 3) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=5&countrycodes=in`
        );
        const data = await res.json();
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  };

  const selectResult = (r: any) => {
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    map.flyTo([lat, lng], 16, { duration: 1.2 });
    onLocationChange(lat, lng, r.display_name);
    setResults([]);
    setQuery(r.display_name.split(",").slice(0, 2).join(","));
  };

  return (
    <div
      style={{
        position: "absolute",
        top: "10px",
        left: "50px",
        right: "10px",
        zIndex: 1000,
      }}
    >
      <input
        type="text"
        placeholder="🔍 Search location (e.g. Madhapur, Hyderabad)"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        style={{
          width: "100%",
          padding: "10px 14px",
          borderRadius: "8px",
          border: "2px solid #E2E8F0",
          fontSize: "0.85rem",
          fontWeight: 500,
          boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
          outline: "none",
          background: "#fff",
        }}
        onFocus={(e) => (e.target.style.borderColor = "#2563EB")}
        onBlur={(e) => (e.target.style.borderColor = "#E2E8F0")}
      />
      {results.length > 0 && (
        <div
          style={{
            background: "#fff",
            borderRadius: "8px",
            marginTop: "4px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
            maxHeight: "200px",
            overflowY: "auto",
          }}
        >
          {results.map((r, i) => (
            <div
              key={i}
              onClick={() => selectResult(r)}
              style={{
                padding: "10px 14px",
                cursor: "pointer",
                borderBottom: i < results.length - 1 ? "1px solid #F1F5F9" : "none",
                fontSize: "0.8rem",
                color: "#334155",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#F1F5F9")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
            >
              📍 {r.display_name}
            </div>
          ))}
        </div>
      )}
      {searching && (
        <div style={{ fontSize: "0.75rem", color: "#94A3B8", marginTop: "4px", paddingLeft: "4px" }}>
          Searching...
        </div>
      )}
    </div>
  );
}

export default function LocationPicker({ lat, lng, onLocationChange }: LocationPickerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        style={{
          height: "280px",
          borderRadius: "12px",
          background: "#F1F5F9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#94A3B8",
          fontSize: "0.85rem",
        }}
      >
        Loading map...
      </div>
    );
  }

  return (
    <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden", border: "2px solid #E2E8F0" }}>
      <MapContainer
        center={[lat, lng]}
        zoom={13}
        style={{ height: "280px", width: "100%", borderRadius: "10px" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <Marker position={[lat, lng]} icon={defaultIcon} />
        <MapClickHandler
          onLocationChange={(newLat, newLng) => {
            // Reverse geocode to get address
            fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${newLat}&lon=${newLng}`
            )
              .then((res) => res.json())
              .then((data) => {
                onLocationChange(newLat, newLng, data.display_name);
              })
              .catch(() => {
                onLocationChange(newLat, newLng);
              });
          }}
        />
        <SearchControl onLocationChange={onLocationChange} />
      </MapContainer>
      <div
        style={{
          position: "absolute",
          bottom: "8px",
          left: "8px",
          background: "rgba(255,255,255,0.95)",
          padding: "4px 10px",
          borderRadius: "6px",
          fontSize: "0.7rem",
          color: "#64748B",
          fontWeight: 600,
          zIndex: 1000,
          boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
        }}
      >
        📍 {lat.toFixed(5)}, {lng.toFixed(5)}
      </div>
    </div>
  );
}
