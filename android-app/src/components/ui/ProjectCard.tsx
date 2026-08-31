import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Neutrals, GoldSystem, Radius, Typography } from '@/constants/design';
import { PremiumCard } from './PremiumCard';
import { useRouter } from 'expo-router';
import { TrustBadge } from './TrustBadge';

interface ProjectCardProps {
  id: string;
  name: string;
  developer: string;
  location: string;
  image: string;
  priceRange: string;
  possession: string;
  hasRera?: boolean;
}

export function ProjectCard({
  id,
  name,
  developer,
  location,
  image,
  priceRange,
  possession,
  hasRera = true,
}: ProjectCardProps) {
  const router = useRouter();

  return (
    <PremiumCard style={styles.card} onPress={() => router.push(`/project/${id}` as any)}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: image }} style={styles.image} />
        <View style={styles.badgesTop}>
          {hasRera && <TrustBadge type="rera" />}
        </View>
        <View style={styles.imageOverlay}>
          <Text style={styles.priceRange}>{priceRange}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        <Text style={styles.developer}>by {developer}</Text>
        
        <View style={styles.detailsRow}>
          <Text style={styles.location}>📍 {location}</Text>
          <Text style={styles.possession}>Status: {possession}</Text>
        </View>
      </View>
    </PremiumCard>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 300,
    marginRight: 16,
    marginBottom: 8,
  },
  imageContainer: {
    width: '100%',
    height: 160,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
  },
  badgesTop: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    paddingTop: 32,
    backgroundColor: 'rgba(0,0,0,0.4)', // Simulated gradient
  },
  priceRange: {
    ...Typography.headlineMedium,
    color: Neutrals.white,
    fontWeight: '700',
  },
  content: {
    padding: 16,
  },
  name: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
    marginBottom: 4,
  },
  developer: {
    ...Typography.bodyMedium,
    color: Neutrals.textSecondary,
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  location: {
    ...Typography.bodyMedium,
    color: Neutrals.obsidian,
  },
  possession: {
    ...Typography.labelMedium,
    color: GoldSystem.primaryGold,
  },
});
