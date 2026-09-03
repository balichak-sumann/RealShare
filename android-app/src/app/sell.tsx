import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Neutrals, Typography } from '@/constants/design';

export default function SellScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sell Property</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.centerContainer}>
        <Text style={styles.comingSoonIcon}>🏷️</Text>
        <Text style={styles.comingSoonTitle}>Sell Property — Coming Soon</Text>
        <Text style={styles.comingSoonDesc}>
          We're building a seamless way for you to list your properties for fractional 
          or outright sale directly to our investor network.
        </Text>
        <Text style={styles.comingSoonNote}>
          Check back soon to unlock zero-brokerage property sales!
        </Text>
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
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  comingSoonIcon: {
    fontSize: 64,
    marginBottom: 24,
  },
  comingSoonTitle: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
    textAlign: 'center',
    marginBottom: 16,
  },
  comingSoonDesc: {
    ...Typography.bodyLarge,
    color: Neutrals.gray600,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  comingSoonNote: {
    ...Typography.bodyMedium,
    color: Neutrals.gray500,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
