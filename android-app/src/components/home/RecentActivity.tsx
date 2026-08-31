import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Neutrals, GoldSystem, Radius, Typography, Shadows } from '@/constants/design';
import { SectionHeader } from '../ui/SectionHeader';

export function RecentActivity() {
  return (
    <View style={styles.container}>
      <SectionHeader title="Recent Activity" onViewAll={() => {}} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Continue Search Card */}
        <TouchableOpacity style={styles.activityCard}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🔍</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.title}>Continue Search</Text>
            <Text style={styles.subtitle}>3 BHK in Gachibowli</Text>
          </View>
          <Text style={styles.arrow}>➔</Text>
        </TouchableOpacity>

        {/* Recently Viewed */}
        <TouchableOpacity style={styles.activityCard}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>👀</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.title}>Recently Viewed</Text>
            <Text style={styles.subtitle}>12 Properties</Text>
          </View>
          <Text style={styles.arrow}>➔</Text>
        </TouchableOpacity>

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
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Neutrals.surface,
    padding: 16,
    borderRadius: Radius.lg,
    width: 240,
    marginRight: 16,
    ...Shadows.soft,
    borderWidth: 1,
    borderColor: Neutrals.border,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Neutrals.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 18,
  },
  cardContent: {
    flex: 1,
  },
  title: {
    ...Typography.labelMedium,
    color: Neutrals.obsidian,
  },
  subtitle: {
    ...Typography.caption,
    color: GoldSystem.primaryGold,
    marginTop: 2,
  },
  arrow: {
    color: Neutrals.gray400,
    fontSize: 16,
  },
});
