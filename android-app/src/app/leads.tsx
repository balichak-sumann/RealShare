import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';

// No lead-capture pipeline exists yet for property owners (that requires a new
// domain model + a public "enquire about this listing" flow -- tracked as
// future work alongside the rest of the Owner Dashboard/Property Management
// suite). This screen is honest about that instead of showing fabricated leads.
export default function LeadsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>\u2190</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lead Management</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>\ud83d\udc65</Text>
          <Text style={styles.emptyTitle}>No leads yet</Text>
          <Text style={styles.emptyDesc}>
            When buyers enquire about one of your listings, their details will show up here.
            Lead capture for listings is coming soon.
          </Text>
        </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 50,
    backgroundColor: Neutrals.surface,
    borderBottomWidth: 1,
    borderBottomColor: Neutrals.border,
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
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 16,
  },
  emptyTitle: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
    marginBottom: 8,
  },
  emptyDesc: {
    ...Typography.bodyMedium,
    color: Neutrals.gray500,
    textAlign: 'center',
    lineHeight: 20,
  },
});
