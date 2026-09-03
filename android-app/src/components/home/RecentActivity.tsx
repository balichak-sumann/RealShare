import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Neutrals, GoldSystem, Radius, Typography, Shadows } from '@/constants/design';
import { SectionHeader } from '../ui/SectionHeader';
import { Ionicons } from '@expo/vector-icons';

export function RecentActivity() {
  return (
    <View style={styles.container}>
      <SectionHeader title="Recent Activity" onViewAll={() => {}} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Continue Search Card */}
        <TouchableOpacity style={styles.activityCard}>
          <View style={[styles.iconContainer, { backgroundColor: '#EFF6FF' }]}>
            <Ionicons name="search-outline" size={20} color="#3B82F6" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.title}>Continue Search</Text>
            <Text style={styles.subtitle}>3 BHK in Gachibowli</Text>
          </View>
          <Ionicons name="arrow-forward-outline" size={16} color={Neutrals.gray400} />
        </TouchableOpacity>

        {/* Recently Viewed */}
        <TouchableOpacity style={styles.activityCard}>
          <View style={[styles.iconContainer, { backgroundColor: '#F5F3FF' }]}>
            <Ionicons name="eye-outline" size={20} color="#8B5CF6" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.title}>Recently Viewed</Text>
            <Text style={styles.subtitle}>12 Properties</Text>
          </View>
          <Ionicons name="arrow-forward-outline" size={16} color={Neutrals.gray400} />
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
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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
});
