import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SectionHeader } from '../ui/SectionHeader';
import { PropertyCard } from '../ui/PropertyCard';
import { propertyToCardProps } from '@/lib/formatters';
import { useRouter } from 'expo-router';

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
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {properties.map((prop) => (
          <View key={prop.id} style={{ width: 220, marginRight: 12 }}>
            <PropertyCard {...propertyToCardProps(prop)} compact />
          </View>
        ))}
      </ScrollView>
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
