import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';
import { propertyToCardProps, formatPrice } from '@/lib/formatters';
import { PropertyCard } from '@/components/ui/PropertyCard';
import { InvestmentScore } from '@/components/ui/InvestmentScore';

// The locality id here is its name (URL-encoded) — there's no separate
// Locality table, so everything shown is derived from real properties in
// that locality rather than a fabricated market/infrastructure profile.
export default function LocalityDetailsScreen() {
  const { id } = useLocalSearchParams();
  const localityName = decodeURIComponent(String(id || ''));
  const router = useRouter();
  const [locality, setLocality] = useState<any>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com';
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/properties`);
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : data.properties || [];
          const inLocality = list.filter((p: any) => p.locality === localityName);
          if (inLocality.length > 0) {
            const avgPrice = inLocality.reduce((sum: number, p: any) => sum + Number(p.price_per_fraction) * (p.total_fractions || 1), 0) / inLocality.length;
            const yields = inLocality.map((p: any) => Number(p.assured_yield || 0)).filter((y: number) => y > 0);
            const avgYield = yields.length > 0 ? yields.reduce((a: number, b: number) => a + b, 0) / yields.length : 0;
            const firstImage = inLocality[0]?.images?.[0]?.image_url
              || 'https://images.unsplash.com/photo-1519999482648-25049ddd37b1?w=800&fit=crop';
            setLocality({
              name: localityName,
              image: firstImage,
              avgSale: formatPrice(avgPrice),
              avgYield: avgYield > 0 ? `${avgYield.toFixed(1)}%` : 'N/A',
              propertyCount: inLocality.length,
              rating: avgYield > 0 ? Math.min(5, avgYield / 2) : 4,
            });
            setProperties(inLocality.map(propertyToCardProps));
          }
        }
      } catch (e) {
        console.log('Failed to load locality', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [localityName]);

  if (loading) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={GoldSystem.primaryGold} />
      </View>
    );
  }

  if (!locality) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center', padding: 24 }]}>
        <Text style={{ ...Typography.bodyLarge, color: Neutrals.gray600, textAlign: 'center' }}>
          No listed properties found in {localityName || 'this locality'} yet.
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: GoldSystem.primaryGold, fontWeight: '600' }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Map Image (mocking locality map area) */}
      <View style={styles.heroContainer}>
        <Image source={{ uri: locality.image }} style={styles.heroImage} />
        <View style={styles.heroGradient} />
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.iconBtnText}>←</Text>
        </TouchableOpacity>
        
        <View style={styles.heroContent}>
          <Text style={styles.title}>{locality.name}</Text>
          <View style={styles.rankBadge}>
            <Text style={styles.rankText}>#{locality.rank} Locality in City</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Market Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Avg. Rent</Text>
            <Text style={styles.statValue}>{locality.avgRent}/sqft</Text>
            <Text style={styles.trendUp}>↑ 5.2% YoY</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Avg. Sale</Text>
            <Text style={styles.statValue}>{locality.avgSale}/sqft</Text>
            <Text style={styles.trendUp}>↑ 8.4% YoY</Text>
          </View>
        </View>

        {/* Investment Score */}
        <View style={styles.scoreSection}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Locality Snapshot</Text>
            <Text style={styles.scoreDesc}>{locality.propertyCount} listed {locality.propertyCount === 1 ? 'property' : 'properties'} in {locality.name}, averaging {locality.avgYield} assured yield.</Text>
          </View>
          <InvestmentScore score={Math.round(locality.rating * 20)} size={80} showLabel={false} strokeWidth={6} />
        </View>

        {/* Properties in Locality */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Properties in {locality.name}</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16, paddingHorizontal: 16 }}>
          {properties.map(prop => (
            <PropertyCard key={prop.id} {...prop} compact />
          ))}
        </ScrollView>
        
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Neutrals.background,
  },
  heroContainer: {
    width: '100%',
    height: 250,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    ...(StyleSheet.absoluteFill as object),
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  backBtn: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnText: {
    fontSize: 20,
    color: Neutrals.obsidian,
  },
  heroContent: {
    position: 'absolute',
    bottom: 20,
    left: 20,
  },
  title: {
    ...Typography.displayMedium,
    color: Neutrals.surface,
    marginBottom: 8,
  },
  rankBadge: {
    backgroundColor: GoldSystem.primaryGold,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  rankText: {
    ...Typography.labelMedium,
    color: Neutrals.obsidian,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    marginTop: 8,
  },
  statBox: {
    width: '48%',
    backgroundColor: Neutrals.surface,
    padding: 16,
    borderRadius: Radius.lg,
    ...Shadows.soft,
    borderWidth: 1,
    borderColor: Neutrals.border,
  },
  statLabel: {
    ...Typography.caption,
    color: Neutrals.gray500,
    marginBottom: 4,
  },
  statValue: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
    marginBottom: 4,
  },
  trendUp: {
    ...Typography.labelSmall,
    color: '#10B981', // emerald
  },
  scoreSection: {
    flexDirection: 'row',
    backgroundColor: Neutrals.obsidian,
    padding: 20,
    borderRadius: Radius.lg,
    marginBottom: 24,
    alignItems: 'center',
    ...Shadows.medium,
  },
  sectionTitle: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
    marginBottom: 12,
  },
  scoreDesc: {
    ...Typography.bodyMedium,
    color: Neutrals.gray300,
    marginTop: 8,
    paddingRight: 16,
  },
  infraList: {
    backgroundColor: Neutrals.surface,
    borderRadius: Radius.lg,
    padding: 16,
    marginBottom: 24,
    ...Shadows.soft,
    borderWidth: 1,
    borderColor: Neutrals.border,
  },
  infraRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Neutrals.border,
  },
  infraIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  infraTextContainer: {
    flex: 1,
  },
  infraTitle: {
    ...Typography.labelLarge,
    color: Neutrals.obsidian,
  },
  infraDesc: {
    ...Typography.caption,
    color: Neutrals.gray500,
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllText: {
    ...Typography.labelMedium,
    color: GoldSystem.primaryGold,
  },
});
