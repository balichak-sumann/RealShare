import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';
import { MOCK_LOCALITIES, MOCK_PROPERTIES } from '@/constants/mockData';
import { PropertyCard } from '@/components/ui/PropertyCard';
import { InvestmentScore } from '@/components/ui/InvestmentScore';

export default function LocalityDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const locality = MOCK_LOCALITIES.find(l => l.id === id) || MOCK_LOCALITIES[0];

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
            <Text style={styles.sectionTitle}>Locality Score</Text>
            <Text style={styles.scoreDesc}>Excellent connectivity and high rental demand make this a premium investment choice.</Text>
          </View>
          <InvestmentScore score={locality.rating * 20} size={80} showLabel={false} strokeWidth={6} />
        </View>

        {/* Infrastructure */}
        <Text style={styles.sectionTitle}>Infrastructure</Text>
        <View style={styles.infraList}>
          <View style={styles.infraRow}>
            <Text style={styles.infraIcon}>🚇</Text>
            <View style={styles.infraTextContainer}>
              <Text style={styles.infraTitle}>Metro Station</Text>
              <Text style={styles.infraDesc}>2 stations within 3km radius</Text>
            </View>
          </View>
          <View style={styles.infraRow}>
            <Text style={styles.infraIcon}>🏫</Text>
            <View style={styles.infraTextContainer}>
              <Text style={styles.infraTitle}>Schools & Education</Text>
              <Text style={styles.infraDesc}>5 premium international schools</Text>
            </View>
          </View>
          <View style={styles.infraRow}>
            <Text style={styles.infraIcon}>🏢</Text>
            <View style={styles.infraTextContainer}>
              <Text style={styles.infraTitle}>IT Parks</Text>
              <Text style={styles.infraDesc}>Cyber Towers, Mindspace nearby</Text>
            </View>
          </View>
        </View>

        {/* Properties in Locality */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Properties in {locality.name}</Text>
          <TouchableOpacity><Text style={styles.viewAllText}>View All</Text></TouchableOpacity>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16, paddingHorizontal: 16 }}>
          {MOCK_PROPERTIES.map(prop => (
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
