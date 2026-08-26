import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Image, TouchableOpacity, TextInput, Platform, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useRouter, Link } from 'expo-router';

export default function ExploreScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filtering States
  const [activeLocation, setActiveLocation] = useState('Location');
  const [activeType, setActiveType] = useState('Property Type');
  const [activePrice, setActivePrice] = useState('Price Range');
  const [activeYield, setActiveYield] = useState('Investment Demand');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageIndices, setImageIndices] = useState<Record<string, number>>({});

  const goToImage = (propertyId: string, direction: 'prev' | 'next', totalImages: number) => {
    setImageIndices(prev => {
      const current = prev[propertyId] || 0;
      let next;
      if (direction === 'next') {
        next = current < totalImages - 1 ? current + 1 : 0;
      } else {
        next = current > 0 ? current - 1 : totalImages - 1;
      }
      return { ...prev, [propertyId]: next };
    });
  };

  useEffect(() => {
    fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com'}/api/properties`)
      .then(res => res.json())
      .then(data => {
        setProperties(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch properties:', err);
        setLoading(false);
      });
  }, []);

  const filteredProperties = properties.filter(prop => {
    const matchesSearch = prop.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          prop.district.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          prop.state.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesLocation = activeLocation === 'Location' || prop.state === activeLocation;
    const matchesType = activeType === 'Property Type' || prop.property_type === activeType;
    
    let matchesPrice = true;
    const price = Number(prop.price_per_fraction);
    if (activePrice === 'Under ₹5L') matchesPrice = price < 500000;
    if (activePrice === '₹5L - ₹10L') matchesPrice = price >= 500000 && price <= 1000000;
    if (activePrice === 'Above ₹10L') matchesPrice = price > 1000000;
    
    let matchesYield = true;
    const propYield = Number(prop.assured_yield);
    if (activeYield === 'High Yield (>9%)') matchesYield = propYield > 9;
    if (activeYield === 'Standard Yield (7-9%)') matchesYield = propYield >= 7 && propYield <= 9;
                          
    return matchesSearch && matchesLocation && matchesType && matchesPrice && matchesYield;
  });

  const generateMapHtml = (properties: any[]) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { margin: 0; padding: 0; }
        #map { width: 100%; height: 100%; position: absolute; top: 0; left: 0; }
        .custom-pin {
          background: #1A56DB;
          color: #fff;
          padding: 6px 12px;
          border-radius: 20px;
          font-weight: 700;
          font-size: 13px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          border: 2px solid #fff;
          cursor: pointer;
          white-space: nowrap;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 8px 30px rgba(0,0,0,0.1);
        }
        .leaflet-popup-content { margin: 0; }
        .popup-card { width: 240px; }
        .popup-card img { width: 100%; height: 120px; object-fit: cover; border-radius: 12px 12px 0 0; }
        .popup-info { padding: 12px; }
        .popup-info h3 { margin: 0 0 4px; font-size: 15px; color: #111827; }
        .popup-info p { margin: 0 0 10px; font-size: 13px; color: #4B5563; }
        .popup-info a {
          display: block;
          text-align: center;
          background: #1A56DB;
          color: #fff;
          padding: 10px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 700;
          font-size: 14px;
        }
        .popup-info a:hover { background: #1E429F; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', { zoomControl: true }).setView([17.3850, 78.4867], 10);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          attribution: ''
        }).addTo(map);

        var props = ${JSON.stringify(properties)};
        var bounds = L.latLngBounds();

        props.forEach(function(p) {
          if (!p.lat || !p.lng) return;
          var icon = L.divIcon({
            className: '',
            html: '<div class="custom-pin">₹ ' + (p.price_per_fraction/100000).toFixed(2) + 'L</div>',
            iconSize: [80, 30],
            iconAnchor: [40, 15]
          });

          var popupHtml = '<div class="popup-card">'
            + '<img src="' + (p.images && p.images[0] ? p.images[0].image_url : 'https://via.placeholder.com/200') + '" />'
            + '<div class="popup-info">'
            + '<h3>' + p.title + '</h3>'
            + '<p>' + p.locality + '</p>'
            + '<a href="/property/' + p.id + '" target="_top" style="display:block;text-align:center;background:#1A56DB;color:#fff;padding:8px;border-radius:6px;text-decoration:none;font-weight:bold;margin-top:8px;">View Details</a>'
            + '</div></div>';

          L.marker([p.lat, p.lng], { icon: icon })
            .addTo(map)
            .bindPopup(popupHtml, { maxWidth: 260, minWidth: 240, padding: [0,0] });

          bounds.extend([p.lat, p.lng]);
        });

        if (props.length > 0 && bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
        }
      </script>
    </body>
    </html>
  `;

  const router = useRouter();

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#1A56DB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore Properties</Text>
      </View>

      <View style={[styles.filterSection, { zIndex: 100, elevation: 100 }]}>
        <View style={styles.searchRow}>
          <TextInput 
            style={styles.searchInput} 
            placeholder="Search location, property..." 
            placeholderTextColor="#9CA3AF" 
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity style={styles.filterBtn}>
            <Text style={styles.filterBtnText}>Search</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.pillScroll}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {/* Location Filter */}
            <TouchableOpacity 
              style={[styles.pill, activeLocation !== 'Location' && styles.pillActive]}
              onPress={() => setOpenDropdown(openDropdown === 'Location' ? null : 'Location')}
            >
              <Text style={activeLocation !== 'Location' ? styles.pillTextActive : styles.pillText}>
                {activeLocation} ▾
              </Text>
            </TouchableOpacity>

            {/* Property Type Filter */}
            <TouchableOpacity 
              style={[styles.pill, activeType !== 'Property Type' && styles.pillActive]}
              onPress={() => setOpenDropdown(openDropdown === 'Property Type' ? null : 'Property Type')}
            >
              <Text style={activeType !== 'Property Type' ? styles.pillTextActive : styles.pillText}>
                {activeType === 'Property Type' ? activeType : activeType.charAt(0).toUpperCase() + activeType.slice(1)} ▾
              </Text>
            </TouchableOpacity>

            {/* Price Range Filter */}
            <TouchableOpacity 
              style={[styles.pill, activePrice !== 'Price Range' && styles.pillActive]}
              onPress={() => setOpenDropdown(openDropdown === 'Price Range' ? null : 'Price Range')}
            >
              <Text style={activePrice !== 'Price Range' ? styles.pillTextActive : styles.pillText}>
                {activePrice} ▾
              </Text>
            </TouchableOpacity>

            {/* Yield / Investment Demand Filter */}
            <TouchableOpacity 
              style={[styles.pill, activeYield !== 'Investment Demand' && styles.pillActive]}
              onPress={() => setOpenDropdown(openDropdown === 'Investment Demand' ? null : 'Investment Demand')}
            >
              <Text style={activeYield !== 'Investment Demand' ? styles.pillTextActive : styles.pillText}>
                {activeYield} ▾
              </Text>
            </TouchableOpacity>
            
            {/* Clear Filters Button */}
            {(activeLocation !== 'Location' || activeType !== 'Property Type' || activePrice !== 'Price Range' || activeYield !== 'Investment Demand') && (
              <TouchableOpacity 
                style={[styles.pill, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}
                onPress={() => {
                  setActiveLocation('Location');
                  setActiveType('Property Type');
                  setActivePrice('Price Range');
                  setActiveYield('Investment Demand');
                }}
              >
                <Text style={[styles.pillText, { color: '#DC2626' }]}>Clear All ✕</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* Dropdown Selection Area */}
        {openDropdown !== null && (
          <>
            {/* Invisible fixed overlay to catch clicks ANYWHERE outside */}
            <TouchableOpacity 
              style={{
                position: Platform.OS === 'web' ? 'fixed' as any : 'absolute',
                top: -500, bottom: -1000, left: -500, right: -500,
                zIndex: 90,
                elevation: 90,
                backgroundColor: 'transparent'
              }} 
              activeOpacity={1} 
              onPress={() => setOpenDropdown(null)} 
            />

            {/* Dropdown Content */}
            <View style={{ zIndex: 100, elevation: 100, position: 'relative' }}>
              {openDropdown === 'Location' && (
                <ScrollView style={[styles.dropdownList, { maxHeight: 250 }]}>
                  {['Location', ...Array.from(new Set(properties.map(p => p.state)))].map(loc => (
                    <TouchableOpacity key={loc as string} style={styles.dropdownItem} onPress={() => { setActiveLocation(loc as string); setOpenDropdown(null); }}>
                      <Text style={activeLocation === loc ? styles.dropdownTextActive : styles.dropdownText}>{loc as string}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {openDropdown === 'Property Type' && (
                <ScrollView style={[styles.dropdownList, { maxHeight: 250 }]}>
                  {['Property Type', 'commercial', 'holiday', 'residential'].map(type => (
                    <TouchableOpacity key={type} style={styles.dropdownItem} onPress={() => { setActiveType(type); setOpenDropdown(null); }}>
                      <Text style={activeType === type ? styles.dropdownTextActive : styles.dropdownText}>
                        {type === 'Property Type' ? type : type.charAt(0).toUpperCase() + type.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {openDropdown === 'Price Range' && (
                <ScrollView style={[styles.dropdownList, { maxHeight: 250 }]}>
                  {['Price Range', 'Under ₹5L', '₹5L - ₹10L', 'Above ₹10L'].map(price => (
                    <TouchableOpacity key={price} style={styles.dropdownItem} onPress={() => { setActivePrice(price); setOpenDropdown(null); }}>
                      <Text style={activePrice === price ? styles.dropdownTextActive : styles.dropdownText}>{price}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {openDropdown === 'Investment Demand' && (
                <ScrollView style={[styles.dropdownList, { maxHeight: 250 }]}>
                  {['Investment Demand', 'Standard Yield (7-9%)', 'High Yield (>9%)'].map(yieldOpt => (
                    <TouchableOpacity key={yieldOpt} style={styles.dropdownItem} onPress={() => { setActiveYield(yieldOpt); setOpenDropdown(null); }}>
                      <Text style={activeYield === yieldOpt ? styles.dropdownTextActive : styles.dropdownText}>{yieldOpt}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          </>
        )}
      </View>

      <View style={{ flex: 1, flexDirection: isDesktop ? 'row' : 'column' }}>
        <View style={[styles.mapContainer, { flex: isDesktop ? 1.5 : undefined, height: isDesktop ? '100%' : 300 }]}>
          {Platform.OS === 'web' ? (
            <iframe 
              width="100%" 
              height="100%" 
              style={{ border: 0 }}
              srcDoc={generateMapHtml(filteredProperties)}
            />
          ) : (
            <View style={styles.mapPlaceholder}>
              <Text style={styles.mapText}>Interactive Google Map View</Text>
              <Text style={styles.mapSubtext}>Showing {filteredProperties.length} properties</Text>
            </View>
          )}
        </View>

        <ScrollView style={{ flex: isDesktop ? 1 : undefined }} contentContainerStyle={{ paddingBottom: 100 }}>
          <View style={styles.listContainer}>
            {filteredProperties.length === 0 && (
              <Text style={{ textAlign: 'center', marginTop: 40, color: '#6B7280', width: '100%' }}>No properties found.</Text>
            )}
            {filteredProperties.map((prop) => (
              <View key={prop.id} style={styles.card}>
                  <View style={{ position: 'relative' }}>
                    <Image source={{ uri: prop.images?.[(imageIndices[prop.id] || 0)]?.image_url || 'https://via.placeholder.com/300' }} style={styles.cardImage} />
                    {prop.images && prop.images.length > 1 && (
                      <>
                        <TouchableOpacity
                          style={[styles.sliderArrow, styles.sliderArrowLeft]}
                          onPress={() => goToImage(prop.id, 'prev', prop.images.length)}
                        >
                          <Text style={styles.sliderArrowText}>‹</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.sliderArrow, styles.sliderArrowRight]}
                          onPress={() => goToImage(prop.id, 'next', prop.images.length)}
                        >
                          <Text style={styles.sliderArrowText}>›</Text>
                        </TouchableOpacity>
                        <View style={styles.dotContainer}>
                          {prop.images.map((_: any, idx: number) => (
                            <View key={idx} style={[styles.dot, (imageIndices[prop.id] || 0) === idx && styles.dotActive]} />
                          ))}
                        </View>
                      </>
                    )}
                    <View style={styles.cardBadge}>
                       <Text style={styles.badgeText}>NEW LAUNCH</Text>
                    </View>
                  </View>
                  <View style={styles.cardContent}>
                    
                    <Text style={styles.cardTitle}>{prop.title}</Text>
                    <Text style={styles.cardLocation}>{prop.district}, {prop.state}</Text>
                    
                    <View style={styles.cardStats}>
                      <View style={styles.statBox}>
                        <Text style={styles.statValue}>₹ {Number(prop.price_per_fraction).toLocaleString('en-IN')}</Text>
                        <Text style={styles.statLabel}>Min. Investment</Text>
                      </View>
                      <View style={styles.statBoxDivider} />
                      <View style={styles.statBox}>
                        <Text style={styles.statValueYield}>{prop.assured_yield}%</Text>
                        <Text style={styles.statLabel}>Expected ROI</Text>
                      </View>
                    </View>

                    <Link href={`/property/${prop.id}`} asChild>
                      <TouchableOpacity style={styles.cardBtn}>
                        <Text style={styles.cardBtnText}>View Details</Text>
                      </TouchableOpacity>
                    </Link>

                  </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  filterSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#111827',
    fontSize: 14,
  },
  filterBtn: {
    backgroundColor: '#1A56DB',
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  filterBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  pillScroll: {
    flexDirection: 'row',
  },
  pill: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  pillActive: {
    backgroundColor: '#1A56DB',
    borderColor: '#1A56DB',
  },
  pillText: {
    color: '#4B5563',
    fontWeight: '600',
    fontSize: 13,
  },
  pillTextActive: {
    color: '#1A56DB',
    fontWeight: '700',
    fontSize: 13,
  },
  dropdownList: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownText: {
    color: '#4B5563',
    fontSize: 14,
    fontWeight: '500',
  },
  dropdownTextActive: {
    color: '#1A56DB',
    fontSize: 14,
    fontWeight: '700',
  },
  mapContainer: {
    height: 300,
    backgroundColor: '#E5E7EB',
    position: 'relative',
    width: '100%',
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  mapText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
  },
  mapSubtext: {
    color: '#6B7280',
    marginTop: 6,
    fontSize: 14,
  },
  listContainer: {
    padding: 20,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: 200,
  },
  sliderArrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  sliderArrowLeft: {
    left: 10,
  },
  sliderArrowRight: {
    right: 10,
  },
  sliderArrowText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 24,
  },
  dotContainer: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
    width: 20,
    borderRadius: 4,
  },
  cardBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#E1EFFE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  badgeText: {
    color: '#1A56DB',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  cardLocation: {
    color: '#6B7280',
    fontSize: 14,
    marginBottom: 16,
    fontWeight: '500',
  },
  cardStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
  },
  statBoxDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  statValue: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  statValueYield: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '600',
  },
  cardBtn: {
    backgroundColor: '#1A56DB',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cardBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});

