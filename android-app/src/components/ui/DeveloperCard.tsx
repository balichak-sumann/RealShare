import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';
import { TrustBadge } from './TrustBadge';

interface DeveloperCardProps {
  id: string;
  name: string;
  logoInitial: string;
  rating: number;
  projects: number;
  ongoing: number;
  hasRera: boolean;
  onPress: () => void;
}

export function DeveloperCard({ name, logoInitial, rating, projects, ongoing, hasRera, onPress }: DeveloperCardProps) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>{logoInitial}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{name}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.rating}>⭐ {rating}</Text>
            {hasRera && <TrustBadge type="rera" />}
          </View>
        </View>
      </View>
      
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{projects}</Text>
          <Text style={styles.statLabel}>Total Projects</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{ongoing}</Text>
          <Text style={styles.statLabel}>Ongoing</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Neutrals.surface,
    borderRadius: Radius.lg,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Neutrals.border,
    ...Shadows.soft,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Neutrals.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: Neutrals.border,
  },
  logoText: {
    ...Typography.headlineMedium,
    color: GoldSystem.primaryGold,
  },
  info: {
    flex: 1,
  },
  name: {
    ...Typography.labelLarge,
    color: Neutrals.obsidian,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    ...Typography.caption,
    color: Neutrals.obsidian,
    marginRight: 8,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Neutrals.background,
    borderRadius: Radius.md,
    padding: 12,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
    marginBottom: 2,
  },
  statLabel: {
    ...Typography.caption,
    color: Neutrals.gray500,
  },
  divider: {
    width: 1,
    backgroundColor: Neutrals.border,
    marginHorizontal: 12,
  },
});
