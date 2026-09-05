import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';
import { auth } from '@/lib/firebase';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com';

function formatPrice(n: number) {
  if (n >= 10000000) return `\u20b9${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `\u20b9${(n / 100000).toFixed(2)} L`;
  return `\u20b9${n.toLocaleString('en-IN')}`;
}

export default function OwnerDashboardScreen() {
  const router = useRouter();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        const token = await user.getIdToken();
        const res = await fetch(`${API_URL}/api/properties/builder`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setListings(Array.isArray(data) ? data : data.properties || []);
        }
      } catch (e) {
        console.log('Failed to load listings', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const activeCount = listings.filter((l) => l.approval_status === 'approved').length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>\u2190</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Owner Dashboard</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Quick Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Active Listings</Text>
            <Text style={styles.statValue}>{loading ? '—' : activeCount}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Listings</Text>
            <Text style={styles.statValue}>{loading ? '—' : listings.length}</Text>
          </View>
        </View>
        <Text style={styles.statsNote}>
          View, save and call analytics aren't tracked yet -- this will show real engagement
          numbers once that's built.
        </Text>

        {/* Action Center */}
        <View style={styles.actionCenter}>
          <Text style={styles.sectionTitle}>Action Center</Text>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/leads' as any)}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: GoldSystem.paleGold }]}>
              <Text style={styles.actionIcon}>\ud83d\udc65</Text>
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Manage Leads</Text>
              <Text style={styles.actionDesc}>View inquiries from interested buyers</Text>
            </View>
            <Text style={styles.arrowIcon}>\u2192</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/property-management' as any)}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: Neutrals.gray100 }]}>
              <Text style={styles.actionIcon}>\ud83c\udfe2</Text>
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Property Management</Text>
              <Text style={styles.actionDesc}>Manage rent, maintenance & tenants</Text>
            </View>
            <Text style={styles.arrowIcon}>\u2192</Text>
          </TouchableOpacity>
        </View>

        {/* Your Listings */}
        <View style={styles.listingsSection}>
          <Text style={styles.sectionTitle}>Your Listings</Text>

          {loading ? (
            <ActivityIndicator color={GoldSystem.primaryGold} style={{ marginTop: 20 }} />
          ) : listings.length === 0 ? (
            <Text style={styles.emptyText}>You haven't posted any properties yet.</Text>
          ) : (
            listings.map((listing) => (
              <View key={listing.id} style={styles.listingCard}>
                <View style={styles.listingHeader}>
                  <Text style={styles.listingTitle}>{listing.title}</Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{listing.approval_status}</Text>
                  </View>
                </View>
                <Text style={styles.listingPrice}>
                  {formatPrice(Number(listing.price_per_fraction) * (listing.total_fractions || 1))}
                </Text>
                <TouchableOpacity onPress={() => router.push(`/property/${listing.id}` as any)}>
                  <Text style={styles.viewLink}>View Listing \u2192</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
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
    paddingTop: Platform.OS === 'web' ? 18 : 50,
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
    gap: 12,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
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
    marginBottom: 4,
  },
  statValue: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
  },
  statsNote: {
    ...Typography.caption,
    color: Neutrals.gray500,
    marginBottom: 24,
    marginTop: 8,
  },
  actionCenter: {
    marginBottom: 32,
  },
  sectionTitle: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
    marginBottom: 16,
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
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  actionIcon: {
    fontSize: 22,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    ...Typography.labelLarge,
    color: Neutrals.obsidian,
  },
  actionDesc: {
    ...Typography.caption,
    color: Neutrals.gray500,
    marginTop: 2,
  },
  arrowIcon: {
    fontSize: 18,
    color: Neutrals.gray400,
  },
  listingsSection: {
    marginBottom: 24,
  },
  emptyText: {
    ...Typography.bodyMedium,
    color: Neutrals.gray500,
    textAlign: 'center',
    marginTop: 20,
  },
  listingCard: {
    backgroundColor: Neutrals.surface,
    padding: 20,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Neutrals.border,
    marginBottom: 16,
    ...Shadows.soft,
  },
  listingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  listingTitle: {
    ...Typography.labelLarge,
    color: Neutrals.obsidian,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    backgroundColor: Neutrals.gray100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  statusText: {
    ...Typography.caption,
    color: Neutrals.obsidian,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  listingPrice: {
    ...Typography.headlineMedium,
    color: GoldSystem.primaryGold,
    marginBottom: 12,
  },
  viewLink: {
    ...Typography.labelMedium,
    color: Neutrals.obsidian,
  },
});
