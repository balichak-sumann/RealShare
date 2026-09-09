import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Neutrals, GoldSystem, Radius, Typography, Shadows } from '@/constants/design';
import { SectionHeader } from '../ui/SectionHeader';
import { Ionicons } from '@expo/vector-icons';
import { useActivityHistory } from '@/hooks/useActivityHistory';

export function RecentActivity() {
  const router = useRouter();
  const { recentSearches, recentViews } = useActivityHistory();

  return (
    <View style={styles.container}>
      
      {/* Main Header */}
      <SectionHeader title="Recent Activity" />

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        
        {/* 1. Recently Viewed Button */}
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => router.push('/recently-viewed')}
          activeOpacity={0.7}
        >
          <View style={[styles.iconBg, { backgroundColor: '#F5F3FF' }]}>
            <Ionicons name="eye-outline" size={24} color="#8B5CF6" />
          </View>
          <View style={styles.buttonTextContent}>
            <Text style={styles.buttonTitle}>Recently Viewed</Text>
            <Text style={styles.buttonSubtitle}>
              {recentViews.length > 0 ? `View your ${recentViews.length} past properties` : 'No recent properties'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Neutrals.gray400} />
        </TouchableOpacity>

        {/* 2. Continue Search Button */}
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => {
            if (recentSearches.length > 0) {
              router.push(`/(tabs)/search?q=${recentSearches[0].query}` as any);
            } else {
              router.push('/(tabs)/search');
            }
          }}
          activeOpacity={0.7}
        >
          <View style={[styles.iconBg, { backgroundColor: '#EFF6FF' }]}>
            <Ionicons name="search-outline" size={24} color="#3B82F6" />
          </View>
          <View style={styles.buttonTextContent}>
            <Text style={styles.buttonTitle}>Continue with last search</Text>
            <Text style={styles.buttonSubtitle}>
              {recentSearches.length > 0 ? `Search for "${recentSearches[0].query}"` : 'Start a new search'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Neutrals.gray400} />
        </TouchableOpacity>

      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginBottom: 8,
  },
  buttonContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Neutrals.white,
    padding: 16,
    borderRadius: Radius.lg,
    ...Shadows.md,
    borderWidth: 1,
    borderColor: Neutrals.gray100,
  },
  iconBg: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  buttonTextContent: {
    flex: 1,
  },
  buttonTitle: {
    ...Typography.titleMedium,
    color: Neutrals.obsidian,
    marginBottom: 2,
  },
  buttonSubtitle: {
    ...Typography.caption,
    color: Neutrals.gray500,
  },
});
