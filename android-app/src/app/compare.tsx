import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Neutrals, Typography, GoldSystem } from '@/constants/design';
import { propertyToCardProps } from '@/lib/formatters';
import { ComparisonTable } from '@/components/ui/ComparisonTable';

export default function CompareScreen() {
  const router = useRouter();
  const { ids } = useLocalSearchParams<{ ids?: string }>();
  const [propertiesToCompare, setPropertiesToCompare] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com';
    const requestedIds = ids ? ids.split(',').filter(Boolean) : [];

    const load = async () => {
      try {
        if (requestedIds.length > 0) {
          const results = await Promise.all(
            requestedIds.map((id) => fetch(`${apiUrl}/api/properties/${id}`).then((res) => (res.ok ? res.json() : null)))
          );
          setPropertiesToCompare(results.filter(Boolean).map(propertyToCardProps));
        } else {
          // No explicit selection passed in — compare the 3 most recent live listings.
          const res = await fetch(`${apiUrl}/api/properties`);
          const data = await res.json();
          setPropertiesToCompare(Array.isArray(data) ? data.slice(0, 3).map(propertyToCardProps) : []);
        }
      } catch (e) {
        console.log('Failed to load properties to compare', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [ids]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Compare Properties</Text>
          <View style={{ width: 24 }} />
        </View>
      </View>

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={GoldSystem.primaryGold} style={{ marginTop: 40 }} />
        ) : propertiesToCompare.length === 0 ? (
          <Text style={{ color: Neutrals.textSecondary, textAlign: 'center', marginTop: 40 }}>
            No properties available to compare right now.
          </Text>
        ) : (
          <>
            <Text style={styles.subtitle}>Comparing {propertiesToCompare.length} properties</Text>
            <ComparisonTable properties={propertiesToCompare} />
          </>
        )}
      </View>
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
  content: {
    padding: 16,
    flex: 1,
  },
  subtitle: {
    ...Typography.bodyMedium,
    color: Neutrals.textSecondary,
    marginBottom: 16,
  },
});
