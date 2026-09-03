import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';
import { propertyToCardProps } from '@/lib/formatters';
import { PropertyCard } from '@/components/ui/PropertyCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { useRouter } from 'expo-router';
import { auth } from '@/lib/firebase';

const COLLECTIONS = ['High Commission', 'Premium Residential', 'Commercial', 'Recently Viewed'];
const DEFAULT_COMMISSION_RATE_PCT = 2.5;

export function AgentEarningsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(COLLECTIONS[0]);
  const [properties, setProperties] = useState<any[]>([]);
  const [rawProperties, setRawProperties] = useState<any[]>([]);
  const [commissionRatePct, setCommissionRatePct] = useState(DEFAULT_COMMISSION_RATE_PCT);

  useEffect(() => {
    const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com';
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/properties`);
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : data.properties || [];
          setRawProperties(list);
          setProperties(list.map(propertyToCardProps));
        }
      } catch (e) {
        console.log('Failed to load properties for agent earnings view', e);
      }
    })();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shortlist</Text>
        <TouchableOpacity style={styles.addBtn}>
          <Text style={styles.addIcon}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer} contentContainerStyle={styles.tabsContent}>
        {COLLECTIONS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.activeTabBtn]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.listContainer} contentContainerStyle={styles.listContent}>
        {properties.length === 0 ? (
          <EmptyState
            icon="♡"
            title="No properties saved"
            subtitle="Properties you shortlist will appear here."
            actionTitle="Explore Properties"
            onAction={() => router.push('/search' as any)}
          />
        ) : (
          <>
            <View style={styles.actionsRow}>
              <Text style={styles.countText}>{properties.length} Properties in list</Text>
              <TouchableOpacity onPress={() => alert('Sharing selected properties...')}>
                <Text style={styles.compareText}>Share Selected</Text>
              </TouchableOpacity>
            </View>

            {properties.map(prop => (
              <View key={prop.id} style={styles.cardWrapper}>
                <PropertyCard {...prop} />
                
                {/* Overlay Checkbox for Selection */}
                <TouchableOpacity style={styles.checkboxOverlay}>
                  <View style={styles.checkbox} />
                </TouchableOpacity>

                {/* Agent Commission Badge Overlaid — estimate off the property's
                    real listed price and the agent's actual commission rate. */}
                <View style={styles.commissionBadge}>
                  <Text style={styles.commissionBadgeText}>
                    Est. Comm: ₹ {(() => {
                      const raw = rawProperties.find((rp: any) => rp.id === prop.id);
                      const totalValue = raw ? Number(raw.price_per_fraction) * raw.total_fractions : 0;
                      return Math.round(totalValue * (commissionRatePct / 100)).toLocaleString('en-IN');
                    })()}
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: Neutrals.surface,
  },
  headerTitle: {
    ...Typography.displayMedium,
    color: Neutrals.obsidian,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Neutrals.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIcon: {
    fontSize: 24,
    color: Neutrals.obsidian,
  },
  tabsContainer: {
    backgroundColor: Neutrals.surface,
    borderBottomWidth: 1,
    borderBottomColor: Neutrals.border,
  },
  tabsContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
  },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Neutrals.gray100,
    marginRight: 8,
  },
  activeTabBtn: {
    backgroundColor: Neutrals.obsidian,
  },
  tabText: {
    ...Typography.labelMedium,
    color: Neutrals.gray600,
  },
  activeTabText: {
    color: Neutrals.surface,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  countText: {
    ...Typography.labelMedium,
    color: Neutrals.obsidian,
  },
  compareText: {
    ...Typography.labelMedium,
    color: GoldSystem.primaryGold,
  },
  cardWrapper: {
    position: 'relative',
    marginBottom: 24,
  },
  checkboxOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Neutrals.surface,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  commissionBadge: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    backgroundColor: 'rgba(212, 175, 55, 0.9)', // Gold background
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    zIndex: 10,
  },
  commissionBadgeText: {
    ...Typography.labelMedium,
    color: Neutrals.obsidian,
    fontWeight: '800',
  }
});
