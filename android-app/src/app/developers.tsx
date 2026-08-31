import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Neutrals, Typography } from '@/constants/design';
import { SearchBar } from '@/components/ui/SearchBar';
import { DeveloperCard } from '@/components/ui/DeveloperCard';

const MOCK_DEVELOPERS = [
  { id: 'd1', name: 'Prestige Group', logoInitial: 'P', rating: 4.8, projects: 124, ongoing: 12, hasRera: true },
  { id: 'd2', name: 'Lodha Group', logoInitial: 'L', rating: 4.7, projects: 98, ongoing: 15, hasRera: true },
  { id: 'd3', name: 'Aparna Constructions', logoInitial: 'A', rating: 4.9, projects: 45, ongoing: 8, hasRera: true },
  { id: 'd4', name: 'My Home Group', logoInitial: 'M', rating: 4.8, projects: 32, ongoing: 5, hasRera: true },
];

export default function DevelopersScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Top Developers</Text>
          <View style={{ width: 24 }} />
        </View>

        <SearchBar
          value={query}
          onChangeText={setQuery}
          onVoicePress={() => {}}
        />
      </View>

      <ScrollView style={styles.resultsContainer} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.resultCount}>{MOCK_DEVELOPERS.length} developers found</Text>

        {MOCK_DEVELOPERS.map((dev) => (
          <DeveloperCard
            key={dev.id}
            {...dev}
            onPress={() => router.push(`/developer/${dev.id}` as any)}
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
    paddingTop: 50,
    backgroundColor: Neutrals.surface,
    borderBottomWidth: 1,
    borderBottomColor: Neutrals.border,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
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
  resultsContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  resultCount: {
    ...Typography.bodyMedium,
    color: Neutrals.textSecondary,
    marginBottom: 16,
  },
});
