import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MapPickerProps {
  lat: number;
  lng: number;
  onLocationChange: (lat: number, lng: number) => void;
}

export function MapPicker({ lat, lng, onLocationChange }: MapPickerProps) {
  // Native fallback (you can implement react-native-maps here in the future)
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Map picker is only available on Web currently.</Text>
      <Text style={styles.subText}>Latitude: {lat}</Text>
      <Text style={styles.subText}>Longitude: {lng}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 250,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  text: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
  subText: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
  }
});
