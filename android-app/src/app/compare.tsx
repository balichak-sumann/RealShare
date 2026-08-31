import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Neutrals, Typography } from '@/constants/design';
import { MOCK_PROPERTIES } from '@/constants/mockData';
import { ComparisonTable } from '@/components/ui/ComparisonTable';

export default function CompareScreen() {
  const router = useRouter();
  
  // For demo, we just compare the first 3 properties
  const propertiesToCompare = MOCK_PROPERTIES.slice(0, 3);

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
        <Text style={styles.subtitle}>Comparing {propertiesToCompare.length} properties</Text>
        <ComparisonTable properties={propertiesToCompare} />
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
