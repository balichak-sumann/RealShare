import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Neutrals, Typography, GoldSystem } from '@/constants/design';
import { SearchBar } from '@/components/ui/SearchBar';
import { DeveloperCard } from '@/components/ui/DeveloperCard';

const mapDeveloper = (d: any) => ({
  id: d.id,
  name: d.name,
  logoInitial: d.name?.charAt(0)?.toUpperCase() || '?',
  rating: Number(d.rating),
  projects: d._count?.properties ?? 0,
  ongoing: Array.isArray(d.properties) ? d.properties.filter((p: any) => p.approval_status === 'approved').length : 0,
  hasRera: !!d.rera_registered,
});

export default function DevelopersScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [developers, setDevelopers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com'}/api/developers`)
      .then((res) => res.json())
      .then((data) => {
        setDevelopers(Array.isArray(data) ? data.map(mapDeveloper) : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = developers.filter((d) => d.name.toLowerCase().includes(query.trim().toLowerCase()));

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
        {loading ? (
          <ActivityIndicator color={GoldSystem.primaryGold} style={{ marginTop: 40 }} />
        ) : (
          <>
            <Text style={styles.resultCount}>{filtered.length} developers found</Text>
            {filtered.map((dev) => (
              <DeveloperCard
                key={dev.id}
                {...dev}
                onPress={() => router.push(`/developer/${dev.id}` as any)}
              />
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
