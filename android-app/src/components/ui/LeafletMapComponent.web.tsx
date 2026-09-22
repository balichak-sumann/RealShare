import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon issue
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface MapPickerProps {
  lat: number;
  lng: number;
  onLocationChange: (lat: number, lng: number) => void;
}

function MapEvents({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function SearchControl({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  const map = useMap();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);

  const search = async (text: string) => {
    setQuery(text);
    if (text.length < 3) return setResults([]);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&limit=5`);
      const data = await res.json();
      setResults(data);
    } catch {}
  };

  return (
    <div style={{ position: 'absolute', top: 10, left: 50, right: 10, zIndex: 1000 }}>
      <input
        type="text"
        value={query}
        onChange={(e) => search(e.target.value)}
        placeholder="🔍 Search location..."
        style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '2px solid #E2E8F0', outline: 'none' }}
      />
      {results.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 8, marginTop: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxHeight: 150, overflowY: 'auto' }}>
          {results.map((r, i) => (
            <div
              key={i}
              onClick={() => {
                const lLat = parseFloat(r.lat);
                const lLng = parseFloat(r.lon);
                map.flyTo([lLat, lLng], 15);
                onSelect(lLat, lLng);
                setResults([]);
                setQuery(r.display_name.split(',')[0]);
              }}
              style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', fontSize: 12 }}
            >
              {r.display_name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LeafletMapComponent({ lat, lng, onLocationChange }: MapPickerProps) {
  const validLat = isNaN(lat) || !lat ? 17.3850 : Number(lat);
  const validLng = isNaN(lng) || !lng ? 78.4867 : Number(lng);

  return (
    <MapContainer
      center={[validLat, validLng]}
      zoom={12}
      style={{ height: '100%', width: '100%', borderRadius: 12 }}
      scrollWheelZoom={true}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={[validLat, validLng]} icon={defaultIcon} />
      <MapEvents onChange={onLocationChange} />
      <SearchControl onSelect={onLocationChange} />
    </MapContainer>
  );
}
