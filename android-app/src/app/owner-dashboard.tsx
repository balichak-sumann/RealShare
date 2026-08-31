import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';

export default function OwnerDashboardScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Owner Dashboard</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Quick Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Active Listings</Text>
            <Text style={styles.statValue}>2</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Views</Text>
            <Text style={styles.statValue}>1,245</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>New Leads</Text>
            <Text style={[styles.statValue, { color: '#10B981' }]}>14</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Avg. Score</Text>
            <Text style={styles.statValue}>92</Text>
          </View>
        </View>

        {/* Action Center */}
        <View style={styles.actionCenter}>
          <Text style={styles.sectionTitle}>Action Center</Text>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/leads' as any)}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: GoldSystem.paleGold }]}>
              <Text style={styles.actionIcon}>👥</Text>
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Manage Leads</Text>
              <Text style={styles.actionDesc}>14 new inquiries need your attention</Text>
            </View>
            <Text style={styles.arrowIcon}>→</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/property-management' as any)}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: Neutrals.gray100 }]}>
              <Text style={styles.actionIcon}>🏢</Text>
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Property Management</Text>
              <Text style={styles.actionDesc}>Manage rent, maintenance & tenants</Text>
            </View>
            <Text style={styles.arrowIcon}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Your Listings */}
        <View style={styles.listingsSection}>
          <Text style={styles.sectionTitle}>Your Listings</Text>
          
          <View style={styles.listingCard}>
            <View style={styles.listingHeader}>
              <Text style={styles.listingTitle}>3 BHK Villa, Jubilee Hills</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>Active</Text>
              </View>
            </View>
            <Text style={styles.listingPrice}>₹4.5 Cr</Text>
            <View style={styles.listingMetrics}>
              <Text style={styles.metric}>👁️ 845 Views</Text>
              <Text style={styles.metric}>❤️ 42 Saves</Text>
              <Text style={styles.metric}>📞 12 Calls</Text>
            </View>
            <View style={styles.listingActions}>
              <TouchableOpacity style={styles.btnOutline}>
                <Text style={styles.btnOutlineText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnOutline, { marginLeft: 12 }]}>
                <Text style={styles.btnOutlineText}>Boost</Text>
              </TouchableOpacity>
            </View>
          </View>

        </View>

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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    width: '47%',
    backgroundColor: Neutrals.surface,
    padding: 16,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Neutrals.border,
    ...Shadows.soft,
  },
  statLabel: {
    ...Typography.caption,
    color: Neutrals.gray500,
    marginBottom: 8,
  },
  statValue: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
  },
  sectionTitle: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
    marginBottom: 16,
  },
  actionCenter: {
    marginBottom: 32,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Neutrals.surface,
    padding: 16,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Neutrals.border,
    marginBottom: 12,
    ...Shadows.soft,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  actionIcon: {
    fontSize: 24,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    ...Typography.labelLarge,
    color: Neutrals.obsidian,
    marginBottom: 4,
  },
  actionDesc: {
    ...Typography.caption,
    color: Neutrals.textSecondary,
  },
  arrowIcon: {
    fontSize: 20,
    color: Neutrals.gray400,
  },
  listingsSection: {
    marginBottom: 32,
  },
  listingCard: {
    backgroundColor: Neutrals.surface,
    padding: 20,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Neutrals.border,
    ...Shadows.soft,
  },
  listingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  listingTitle: {
    ...Typography.labelLarge,
    color: Neutrals.obsidian,
    flex: 1,
  },
  statusBadge: {
    backgroundColor: '#DEF7EC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  statusText: {
    ...Typography.caption,
    color: '#03543F',
    fontWeight: '700',
  },
  listingPrice: {
    ...Typography.headlineMedium,
    color: GoldSystem.primaryGold,
    marginBottom: 16,
  },
  listingMetrics: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Neutrals.border,
  },
  metric: {
    ...Typography.caption,
    color: Neutrals.gray600,
  },
  listingActions: {
    flexDirection: 'row',
  },
  btnOutline: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Neutrals.border,
    alignItems: 'center',
  },
  btnOutlineText: {
    ...Typography.labelMedium,
    color: Neutrals.obsidian,
  },
});
