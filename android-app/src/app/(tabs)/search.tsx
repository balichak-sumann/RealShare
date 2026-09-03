import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { Neutrals, GoldSystem, Typography } from '@/constants/design';
import { SearchBar } from '@/components/ui/SearchBar';
import { CategoryPill } from '@/components/ui/CategoryPill';
import { PropertyCard } from '@/components/ui/PropertyCard';
import { PROPERTY_CATEGORIES } from '@/constants/uiConstants';
import { propertyToCardProps } from '@/lib/formatters';
import { TabAnimationWrapper } from '@/components/ui/TabAnimationWrapper';

// Category chips map loosely onto property_type where a real equivalent exists.
// Categories with no direct backend equivalent (Rent, PG/Hostels, Plot & Land, Luxury)
// intentionally fall through to "show everything" rather than a misleading empty state.
const CATEGORY_TYPE_MAP: Record<string, string> = {
  'Commercial': 'commercial',
  'Fractional': 'fractional',
  'Residential': 'residential',
};

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(PROPERTY_CATEGORIES[0].id);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com'}/api/properties`)
      .then((res) => res.json())
      .then((data) => {
        setProperties(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const mappedType = CATEGORY_TYPE_MAP[activeCategory];
  const filtered = properties.filter((p) => {
    const matchesCategory = !mappedType || p.property_type === mappedType;
    if (!matchesCategory) return false;
    if (!query.trim()) return true;
    const haystack = `${p.title} ${p.description || ''} ${p.locality} ${p.district} ${p.state} ${p.full_address || ''} ${p.property_type} ${p.listing_type} ${p.developer?.name || ''}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });

  return (
    <TabAnimationWrapper>
    <View style={styles.container}>
      <View style={styles.header}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          onVoicePress={() => {}}
        />
        
        <View style={styles.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {PROPERTY_CATEGORIES.map((cat) => (
              <CategoryPill
                key={cat.id}
                label={cat.label}
                isActive={activeCategory === cat.id}
                onPress={() => setActiveCategory(cat.id)}
              />
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.filterBtn}>
            <Text style={styles.filterIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.resultsContainer} contentContainerStyle={styles.scrollContent}>
        <View style={styles.resultsHeader}>
          <Text style={styles.resultCount}>
            {loading ? 'Searching…' : `${filtered.length} propert${filtered.length === 1 ? 'y' : 'ies'} found`}
          </Text>
          <TouchableOpacity style={styles.sortBtn}>
            <Text style={styles.sortText}>Sort by: Relevance ▼</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={GoldSystem.primaryGold} style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <Text style={{ color: Neutrals.textSecondary, textAlign: 'center', marginTop: 40 }}>
            No properties match your search.
          </Text>
        ) : (
          filtered.map((prop) => (
            <PropertyCard
              key={prop.id}
              {...propertyToCardProps(prop)}
            />
          ))
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
    padding: 16,
    paddingTop: 60,
    backgroundColor: Neutrals.surface,
    borderBottomWidth: 1,
    borderBottomColor: Neutrals.border,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Neutrals.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  filterIcon: {
    fontSize: 18,
  },
  resultsContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultCount: {
    ...Typography.bodyMedium,
    color: Neutrals.textSecondary,
  },
  sortBtn: {
    padding: 8,
  },
  sortText: {
    ...Typography.labelMedium,
    color: GoldSystem.primaryGold,
  },
});
