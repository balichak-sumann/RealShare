import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';

// Rent collection, tenants and maintenance require new domain models (Tenant,
// RentPayment, MaintenanceRequest) that don't exist yet -- tracked as future
// work. Showing an honest empty state instead of fabricated tenants/rent figures.
export default function PropertyManagementScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>\u2190</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Property Management</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>\ud83c\udfe2</Text>
          <Text style={styles.emptyTitle}>Coming soon</Text>
          <Text style={styles.emptyDesc}>
            Rent collection, tenant records and maintenance requests aren't available yet.
            We'll let you know when this is ready.
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
    paddingTop: Platform.OS === 'web' ? 18 : 50,
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
