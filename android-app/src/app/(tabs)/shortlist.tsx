import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';
import { useShortlist } from '@/contexts/ShortlistContext';
import { propertyToCardProps } from '@/lib/formatters';
import { PropertyCard } from '@/components/ui/PropertyCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { useRouter } from 'expo-router';
import { GuestView } from '@/components/ui/GuestView';
import { auth } from '@/lib/firebase';
import { TabAnimationWrapper } from '@/components/ui/TabAnimationWrapper';
import { useUser } from '@/contexts/UserContext';
import { AgentCRMScreen } from '@/components/agent/AgentCRMScreen';

const COLLECTIONS = ['All Saved', 'Dream Home', 'Investment', 'Compare Later'];

export default function ShortlistScreen() {
  const { profile } = useUser();
  if (profile?.role === 'agent') {
    return <AgentCRMScreen />;
  }

  const router = useRouter();
  const { savedProperties } = useShortlist();
  const [activeTab, setActiveTab] = useState(COLLECTIONS[0]);
  const [properties, setProperties] = useState<any[]>([]);

  useEffect(() => {
    if (savedProperties.length === 0) {
      setProperties([]);
      return;
    }
    const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com';
    (async () => {
      try {
        const results = await Promise.all(
          savedProperties.map((id) =>
            fetch(`${API_URL}/api/properties/${id}`).then((r) => (r.ok ? r.json() : null))
          )
        );
        setProperties(results.filter(Boolean).map(propertyToCardProps));
      } catch (e) {
        console.log('Failed to load shortlisted properties', e);
      }
    })();
  }, [savedProperties]);

  if (!auth.currentUser) {
    return (
      <TabAnimationWrapper>
      <GuestView 
        title="Saved Properties" 
        description="Sign in to save your favorite properties and compare them later." 
        icon="♡"
      />
      </TabAnimationWrapper>
    );
  }

  return (
    <TabAnimationWrapper>
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
              <Text style={styles.countText}>{properties.length} Properties</Text>
              <TouchableOpacity onPress={() => router.push('/compare' as any)}>
                <Text style={styles.compareText}>Compare Selected</Text>
              </TouchableOpacity>
            </View>

            {properties.map(prop => (
              <View key={prop.id} style={styles.cardWrapper}>
                <PropertyCard {...prop} />
                {/* Overlay Checkbox for Compare */}
                <TouchableOpacity style={styles.checkboxOverlay}>
                  <View style={styles.checkbox} />
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
    </TabAnimationWrapper>
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
    paddingBottom: 40,
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
});
