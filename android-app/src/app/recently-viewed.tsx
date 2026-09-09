import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Neutrals, Typography, Shadows, Radius, GoldSystem } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';
import { useActivityHistory } from '@/hooks/useActivityHistory';

export default function RecentlyViewedScreen() {
  const router = useRouter();
  const { recentViews, recentSearches } = useActivityHistory();

  // Combine both arrays and sort by timestamp (newest first)
  const combinedHistory = [
    ...recentViews.map(v => ({ ...v, type: 'view' as const, timestamp: v.viewedAt })),
    ...recentSearches.map(s => ({ ...s, type: 'search' as const, timestamp: s.searchedAt }))
  ].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Neutrals.obsidian} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recent History</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {combinedHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={48} color={Neutrals.gray300} />
            <Text style={styles.emptyText}>You haven't viewed or searched anything yet.</Text>
          </View>
        ) : (
          combinedHistory.map((item, idx) => {
            if (item.type === 'view') {
              // Property View Card
              return (
                <TouchableOpacity 
                  key={`view-${item.id}-${idx}`} 
                  style={styles.propertyCard} 
                  onPress={() => router.push(`/property/${item.id}` as any)}
                  activeOpacity={0.9}
                >
                  <Image 
                    source={{ uri: item.image_url || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' }} 
                    style={styles.propertyImage} 
                  />
                  <View style={styles.propertyInfo}>
                    <Text style={styles.propertyTitle} numberOfLines={2}>{item.title}</Text>
                    {item.locality && (
                      <Text style={styles.propertyLocality} numberOfLines={1}>
                        <Ionicons name="location-outline" size={14} /> {item.locality}
                      </Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Neutrals.gray400} />
                </TouchableOpacity>
              );
            } else {
              // Search Banner
              return (
                <TouchableOpacity 
                  key={`search-${item.query}-${idx}`} 
                  style={styles.searchBanner} 
                  onPress={() => router.push(`/(tabs)/search?q=${item.query}` as any)}
                >
                  <View style={styles.searchIconBg}>
                    <Ionicons name="search-outline" size={20} color={Neutrals.gray600} />
                  </View>
                  <View style={styles.propertyInfo}>
                    <Text style={styles.propertyTitle}>Searched for "{item.query}"</Text>
                    <Text style={styles.propertyLocality}>Tap to resume</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Neutrals.gray400} />
                </TouchableOpacity>
              );
            }
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Neutrals.gray50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Neutrals.white,
    borderBottomWidth: 1,
    borderBottomColor: Neutrals.gray200,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    ...Typography.titleMedium,
    color: Neutrals.obsidian,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 64,
  },
  emptyText: {
    ...Typography.bodyMedium,
    color: Neutrals.gray500,
    marginTop: 16,
  },
  propertyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Neutrals.white,
    borderRadius: Radius.lg,
    padding: 12,
    ...Shadows.soft,
    borderWidth: 1,
    borderColor: Neutrals.border,
  },
  propertyImage: {
    width: 60,
    height: 60,
    borderRadius: Radius.md,
    backgroundColor: Neutrals.gray200,
    marginRight: 16,
  },
  propertyInfo: {
    flex: 1,
    marginRight: 12,
  },
  propertyTitle: {
    ...Typography.labelMedium,
    color: Neutrals.obsidian,
    marginBottom: 4,
  },
  propertyLocality: {
    ...Typography.caption,
    color: Neutrals.gray500,
  },
  searchBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Neutrals.white,
    padding: 16,
    borderRadius: Radius.lg,
    ...Shadows.soft,
    borderWidth: 1,
    borderColor: Neutrals.border,
  },
  searchIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Neutrals.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
});
