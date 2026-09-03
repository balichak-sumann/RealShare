import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, TextInput, ScrollView, Platform, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';
import { propertyToCardProps } from '@/lib/formatters';
import { PropertyCard } from '@/components/ui/PropertyCard';
import { MapPropertyMarker } from '@/components/ui/MapPropertyMarker';

const { width, height } = Dimensions.get('window');

export default function MapSearchScreen() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [properties, setProperties] = useState<any[]>([]);

  useEffect(() => {
    const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com';
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/properties`);
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : data.properties || [];
          setProperties(list.slice(0, 3).map(propertyToCardProps));
        }
      } catch (e) {
        console.log('Failed to load properties for map', e);
      }
    })();
  }, []);

  // For this demo, we'll overlay markers on a grey background if native, or use webview for web
  return (
    <View style={styles.container}>
      {/* Map Area */}
      <View style={styles.mapArea}>
        {Platform.OS === 'web' ? (
          <div style={{ width: '100%', height: '100%' }}
            dangerouslySetInnerHTML={{ __html: 
              `<iframe width="100%" height="100%" frameborder="0" style="border:0;" loading="lazy" allowfullscreen src="https://maps.google.com/maps?q=Hyderabad&z=12&output=embed"></iframe>`
            }}
          />
        ) : (
          <View style={styles.nativeMapPlaceholder}>
            {/* Fake Map Grid */}
            <View style={styles.gridLineV1} />
            <View style={styles.gridLineV2} />
            <View style={styles.gridLineH1} />
            <View style={styles.gridLineH2} />
            
            <Text style={styles.mapPlaceholderText}>Real map view coming soon — showing nearby listings below</Text>

            {/* Markers use real listed prices/ids; their positions are an
                illustrative layout since we don't yet render a real map SDK
                with actual lat/lng placement on native. */}
            {properties[0] && (
              <View style={{ position: 'absolute', top: 150, left: 80 }}>
                <MapPropertyMarker price={properties[0].price} isSelected={selectedId === properties[0].id} onPress={() => setSelectedId(properties[0].id)} />
              </View>
            )}
            {properties[1] && (
              <View style={{ position: 'absolute', top: 250, left: 220 }}>
                <MapPropertyMarker price={properties[1].price} isSelected={selectedId === properties[1].id} onPress={() => setSelectedId(properties[1].id)} />
              </View>
            )}
            {properties[2] && (
              <View style={{ position: 'absolute', top: 350, left: 120 }}>
                <MapPropertyMarker price={properties[2].price} isSelected={selectedId === properties[2].id} onPress={() => setSelectedId(properties[2].id)} />
              </View>
            )}
          </View>
        )}
      </View>

      {/* Top Overlay Actions */}
      <View style={styles.topOverlay}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Text style={styles.iconText}>←</Text>
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput 
            style={styles.searchInput}
            placeholder="Search this area..."
            placeholderTextColor={Neutrals.gray400}
          />
        </View>
        <TouchableOpacity style={styles.iconBtn}>
          <Text style={styles.iconText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Map Tools Overlay */}
      <View style={styles.mapToolsOverlay}>
        <TouchableOpacity style={styles.toolBtn}>
          <Text style={styles.toolIcon}>✏️</Text>
          <Text style={styles.toolLabel}>Draw</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolBtn}>
          <Text style={styles.toolIcon}>📍</Text>
          <Text style={styles.toolLabel}>Nearby</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet - Selected Property */}
      {selectedId && (
        <View style={styles.bottomOverlay}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
            {properties.filter(p => p.id === selectedId).map(prop => (
              <PropertyCard key={prop.id} {...prop} compact />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Bottom Action - List View Toggle */}
      {!selectedId && (
        <TouchableOpacity style={styles.listViewBtn} onPress={() => router.push('/search' as any)}>
          <Text style={styles.listViewIcon}>≣</Text>
          <Text style={styles.listViewText}>List View</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Neutrals.background,
  },
  mapArea: {
    ...(StyleSheet.absoluteFill as object),
  },
  nativeMapPlaceholder: {
    flex: 1,
    backgroundColor: '#E2E8F0', // Soft map-like blue/grey
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridLineV1: { position: 'absolute', left: '33%', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255,255,255,0.4)' },
  gridLineV2: { position: 'absolute', left: '66%', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255,255,255,0.4)' },
  gridLineH1: { position: 'absolute', top: '33%', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.4)' },
  gridLineH2: { position: 'absolute', top: '66%', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.4)' },
  mapPlaceholderText: {
    ...Typography.bodyLarge,
    color: Neutrals.gray500,
    marginTop: -100,
  },
  topOverlay: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Neutrals.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.medium,
  },
  iconText: {
    fontSize: 20,
    color: Neutrals.obsidian,
  },
  searchBar: {
    flex: 1,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Neutrals.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    ...Shadows.medium,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    ...Typography.bodyMedium,
    color: Neutrals.obsidian,
  },
  mapToolsOverlay: {
    position: 'absolute',
    top: 120,
    right: 16,
    gap: 12,
  },
  toolBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Neutrals.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.medium,
  },
  toolIcon: {
    fontSize: 16,
  },
  toolLabel: {
    ...Typography.caption,
    color: Neutrals.obsidian,
    fontSize: 8,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 32,
    left: 0,
    right: 0,
  },
  listViewBtn: {
    position: 'absolute',
    bottom: 32,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Neutrals.obsidian,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: Radius.full,
    ...Shadows.strong,
  },
  listViewIcon: {
    fontSize: 16,
    color: Neutrals.surface,
    marginRight: 8,
  },
  listViewText: {
    ...Typography.labelMedium,
    color: Neutrals.surface,
  },
});
