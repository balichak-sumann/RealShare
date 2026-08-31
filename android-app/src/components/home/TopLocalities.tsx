import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SectionHeader } from '../ui/SectionHeader';
import { LocalityCard } from '../ui/LocalityCard';
import { MOCK_LOCALITIES } from '@/constants/mockData';

export function TopLocalities() {
  return (
    <View style={styles.container}>
      <SectionHeader title="Top Localities" onViewAll={() => {}} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {MOCK_LOCALITIES.map((locality) => (
          <LocalityCard key={locality.id} {...locality} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20, // For shadow
  },
});
