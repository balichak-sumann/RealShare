import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';

interface MapPickerProps {
  lat: number;
  lng: number;
  onLocationChange: (lat: number, lng: number) => void;
}

export function MapPicker(props: MapPickerProps) {
  const [MapComponent, setMapComponent] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Dynamically import to avoid "window is not defined" SSR errors
      import('./LeafletMapComponent.web').then(mod => {
        setMapComponent(() => mod.default);
      }).catch(err => {
        console.error("Failed to load map:", err);
      });
    }
  }, []);

  return (
    <View style={styles.container}>
      {MapComponent ? (
        <MapComponent {...props} />
      ) : (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#2563EB" />
          <Text style={styles.loadingText}>Loading Map...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 250,
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 10,
    marginBottom: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC'
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500'
  }
});
