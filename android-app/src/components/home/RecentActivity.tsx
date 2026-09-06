import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Neutrals, GoldSystem, Radius, Typography, Shadows } from '@/constants/design';
import { SectionHeader } from '../ui/SectionHeader';
import { Ionicons } from '@expo/vector-icons';
import { useActivityHistory } from '@/hooks/useActivityHistory';

export function RecentActivity() {
  const router = useRouter();
  const { recentSearches, recentViews } = useActivityHistory();

  const latestSearch = recentSearches.length > 0 ? recentSearches[0] : null;
  const hasNoActivity = recentSearches.length === 0 && recentViews.length === 0;
  
  return (
    <View style={styles.container}>
      <SectionHeader title="Recent Activity" onViewAll={() => {}} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {hasNoActivity && (
          <View style={[styles.activityCard, { width: 320, backgroundColor: Neutrals.gray50, justifyContent: 'center', borderColor: 'transparent' }]}>
            <Text style={{ color: Neutrals.gray500, textAlign: 'center', ...Typography.bodyMedium }}>
              You have no recent activity. Start exploring properties!
            </Text>
          </View>
        )}

        {/* Continue Search Card */}
        {latestSearch && (
          <TouchableOpacity style={styles.activityCard} onPress={() => router.push(`/(tabs)/search?q=${latestSearch.query}`)}>
            <View style={[styles.iconContainer, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="search-outline" size={20} color="#3B82F6" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.title}>Continue Search</Text>
              <Text style={styles.subtitle} numberOfLines={1}>{latestSearch.query}</Text>
            </View>
            <Ionicons name="arrow-forward-outline" size={16} color={Neutrals.gray400} />
          </TouchableOpacity>
        )}

        {/* Recently Viewed */}
        {recentViews.length > 0 && (
          <TouchableOpacity style={styles.activityCard} onPress={() => router.push(`/property/${recentViews[0].id}`)}>
            <View style={[styles.iconContainer, { backgroundColor: '#F5F3FF' }]}>
              <Ionicons name="eye-outline" size={20} color="#8B5CF6" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.title}>Recently Viewed</Text>
              <Text style={styles.subtitle} numberOfLines={1}>{recentViews[0].title}</Text>
            </View>
            <Ionicons name="arrow-forward-outline" size={16} color={Neutrals.gray400} />
          </TouchableOpacity>
        )}

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
    paddingRight: 8,
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
