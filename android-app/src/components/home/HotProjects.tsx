import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SectionHeader } from '../ui/SectionHeader';
import { PropertyCard } from '../ui/PropertyCard';
import { propertyToCardProps } from '@/lib/formatters';
import { useRouter } from 'expo-router';
import { ResponsiveRail } from '../layout/ResponsiveRail';

export function HotProjects() {
  const router = useRouter();
  const [properties, setProperties] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com'}/api/properties`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          // API already orders by created_at desc, so the newest listings come first.
          setProperties(data.slice(0, 8));
        }
      })
      .catch(() => {});
  }, []);

  if (properties.length === 0) return null;

  return (
    <View style={styles.container}>
      <SectionHeader title="New Projects" onViewAll={() => router.push('/(tabs)/search')} />
      <ResponsiveRail contentContainerStyle={styles.scrollContent}>
        {properties.map((prop) => (
          <PropertyCard key={prop.id} {...propertyToCardProps(prop)} compact />
        ))}
      </ResponsiveRail>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20, // For shadow
  },
});
