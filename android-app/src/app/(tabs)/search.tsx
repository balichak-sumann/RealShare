import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text } from 'react-native';
import { Neutrals, GoldSystem, Typography } from '@/constants/design';
import { SearchBar } from '@/components/ui/SearchBar';
import { CategoryPill } from '@/components/ui/CategoryPill';
import { PropertyCard } from '@/components/ui/PropertyCard';
import { MOCK_CATEGORIES, MOCK_PROPERTIES } from '@/constants/mockData';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(MOCK_CATEGORIES[0].id);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          onVoicePress={() => {}}
        />
        
        <View style={styles.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {MOCK_CATEGORIES.map((cat) => (
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
          <Text style={styles.resultCount}>124 properties found</Text>
          <TouchableOpacity style={styles.sortBtn}>
            <Text style={styles.sortText}>Sort by: Relevance ▼</Text>
          </TouchableOpacity>
        </View>

        {MOCK_PROPERTIES.map((prop) => (
          <PropertyCard
            key={prop.id}
            {...prop}
          />
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
