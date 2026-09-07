import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SectionHeader } from '../ui/SectionHeader';
import { PropertyCard } from '../ui/PropertyCard';
import { propertyToCardProps } from '@/lib/formatters';
import { useRouter } from 'expo-router';
import { ResponsiveRail } from '../layout/ResponsiveRail';
import { getApiUrl } from '@/lib/api';

interface HotProjectsProps {
  properties: any[];
}

export function HotProjects({ properties }: HotProjectsProps) {
  const router = useRouter();

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
