import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';
import { auth } from '@/lib/firebase';
import { EmptyState } from '@/components/ui/EmptyState';

export default function MyAssetsScreen() {
  const router = useRouter();
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      setError(null);
      const user = auth.currentUser;
      if (!user) {
        setError('Please sign in to view your assets.');
        setLoading(false);
        return;
      }
      const token = await user.getIdToken();
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com'}/api/assets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setAssets(data);
      } else {
        setError('Failed to load assets.');
      }
    } catch (err) {
      console.warn(err);
      setError('Network error.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAssets();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Assets</Text>
        <TouchableOpacity onPress={() => router.push('/my-assets/new')} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={GoldSystem.primaryGold} />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <EmptyState title="Error" subtitle={error} icon="⚠️" />
        </View>
      ) : assets.length === 0 ? (
        <View style={styles.centerContainer}>
          <EmptyState 
            title="No Assets Yet" 
            subtitle="Add properties you own to track documents and rental income." 
            icon="🏠" 
          />
          <TouchableOpacity style={styles.ctaBtn} onPress={() => router.push('/my-assets/new')}>
            <Text style={styles.ctaText}>Add Property</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView 
          style={styles.content}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {assets.map((asset) => (
            <TouchableOpacity 
              key={asset.id} 
              style={styles.assetCard}
              onPress={() => router.push(`/my-assets/${asset.id}`)}
            >
              <View style={styles.assetHeader}>
                <Text style={styles.assetTitle} numberOfLines={1}>{asset.title}</Text>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeText}>{asset.property_type}</Text>
                </View>
              </View>
              <Text style={styles.assetAddress} numberOfLines={2}>{asset.address}</Text>
              
              <View style={styles.assetFooter}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Purchase Price</Text>
                  <Text style={styles.statValue}>
                    {asset.purchase_price ? `₹${Number(asset.purchase_price).toLocaleString('en-IN')}` : 'N/A'}
                  </Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Documents</Text>
                  <Text style={styles.statValue}>{asset.documents?.length || 0}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Agreements</Text>
                  <Text style={styles.statValue}>{asset.rental_agreements?.length || 0}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Neutrals.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, paddingTop: 50, backgroundColor: Neutrals.surface,
    borderBottomWidth: 1, borderBottomColor: Neutrals.border,
  },
  backBtn: { padding: 8, marginLeft: -8 },
  backIcon: { fontSize: 24, color: Neutrals.obsidian },
  headerTitle: { ...Typography.headlineMedium, color: Neutrals.obsidian },
  addBtn: { backgroundColor: Neutrals.gray100, paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full },
  addBtnText: { ...Typography.labelMedium, color: Neutrals.obsidian },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  content: { flex: 1 },
  ctaBtn: {
    marginTop: 20,
    backgroundColor: GoldSystem.primaryGold,
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: Radius.md,
  },
  ctaText: { ...Typography.labelLarge, color: Neutrals.obsidian, fontWeight: '700' },
  assetCard: {
    backgroundColor: Neutrals.surface,
    padding: 16,
    borderRadius: Radius.lg,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Neutrals.border,
    ...Shadows.soft,
  },
  assetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  assetTitle: { ...Typography.labelLarge, color: Neutrals.obsidian, flex: 1, marginRight: 8, fontWeight: '700' },
  typeBadge: { backgroundColor: Neutrals.gray100, paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.sm },
  typeText: { ...Typography.caption, color: Neutrals.gray700 },
  assetAddress: { ...Typography.bodyMedium, color: Neutrals.gray500, marginBottom: 16 },
  assetFooter: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: Neutrals.border, paddingTop: 12 },
  statBox: { flex: 1 },
  statLabel: { ...Typography.caption, color: Neutrals.gray500, marginBottom: 4 },
  statValue: { ...Typography.labelMedium, color: Neutrals.obsidian },
});
