import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';

const AGENTS = [
  { id: '1', name: 'Ravi Kumar', type: 'Premium Agent', locality: 'Gachibowli, Hyderabad', rating: 4.9, reviews: 124, listings: 45 },
  { id: '2', name: 'Prestige Group', type: 'Top Developer', locality: 'Pan India', rating: 4.8, reviews: 3400, listings: 12 },
  { id: '3', name: 'Sneha Reddy', type: 'Verified Agent', locality: 'Jubilee Hills, Hyderabad', rating: 4.7, reviews: 89, listings: 28 },
];

export default function AgentsScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState('All');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find Professionals</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        
        <View style={styles.filterRow}>
          {['All', 'Agents', 'Developers'].map((f) => (
            <TouchableOpacity 
              key={f} 
              style={[styles.filterPill, filter === f && styles.filterPillActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {AGENTS.map(agent => (
          <View key={agent.id} style={styles.agentCard}>
            <View style={styles.agentHeader}>
              <View style={styles.agentAvatar}>
                <Text style={styles.avatarText}>{agent.name.charAt(0)}</Text>
              </View>
              <View style={styles.agentInfo}>
                <Text style={styles.agentName}>{agent.name}</Text>
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>{agent.type}</Text>
                </View>
              </View>
            </View>

            <View style={styles.locationRow}>
              <Text style={styles.locationIcon}>📍</Text>
              <Text style={styles.locationText}>{agent.locality}</Text>
            </View>

            <View style={styles.metricsRow}>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>★ {agent.rating}</Text>
                <Text style={styles.metricLabel}>{agent.reviews} Reviews</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{agent.listings}</Text>
                <Text style={styles.metricLabel}>Active Listings</Text>
              </View>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.outlineBtn}>
                <Text style={styles.outlineBtnText}>View Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtn}>
                <Text style={styles.primaryBtnText}>Contact</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Neutrals.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 50,
    backgroundColor: Neutrals.surface,
    borderBottomWidth: 1,
    borderBottomColor: Neutrals.border,
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  backIcon: {
    fontSize: 24,
    color: Neutrals.obsidian,
  },
  headerTitle: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Neutrals.surface,
    borderWidth: 1,
    borderColor: Neutrals.border,
  },
  filterPillActive: {
    backgroundColor: Neutrals.obsidian,
    borderColor: Neutrals.obsidian,
  },
  filterText: {
    ...Typography.labelMedium,
    color: Neutrals.obsidian,
  },
  filterTextActive: {
    color: Neutrals.surface,
  },
  agentCard: {
    backgroundColor: Neutrals.surface,
    borderRadius: Radius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: Neutrals.border,
    marginBottom: 16,
    ...Shadows.soft,
  },
  agentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  agentAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: GoldSystem.paleGold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    ...Typography.headlineMedium,
    color: GoldSystem.darkGold,
  },
  agentInfo: {
    flex: 1,
  },
  agentName: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
    marginBottom: 4,
  },
  badgeContainer: {
    backgroundColor: '#DEF7EC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    alignSelf: 'flex-start',
  },
  badgeText: {
    ...Typography.caption,
    color: '#03543F',
    fontWeight: '700',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  locationText: {
    ...Typography.bodyMedium,
    color: Neutrals.gray600,
  },
  metricsRow: {
    flexDirection: 'row',
    backgroundColor: Neutrals.gray100,
    borderRadius: Radius.md,
    padding: 16,
    marginBottom: 20,
  },
  metric: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    backgroundColor: Neutrals.border,
  },
  metricValue: {
    ...Typography.labelLarge,
    color: Neutrals.obsidian,
    marginBottom: 4,
  },
  metricLabel: {
    ...Typography.caption,
    color: Neutrals.gray500,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  outlineBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Neutrals.border,
    alignItems: 'center',
  },
  outlineBtnText: {
    ...Typography.labelMedium,
    color: Neutrals.obsidian,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: Neutrals.obsidian,
    paddingVertical: 12,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  primaryBtnText: {
    ...Typography.labelMedium,
    color: Neutrals.surface,
  },
});
