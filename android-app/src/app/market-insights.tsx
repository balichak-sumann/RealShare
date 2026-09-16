import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Neutrals, Typography, Radius } from '@/constants/design';
import NewsFeed from '@/components/market-insights/NewsFeed';
import MarketAnalytics from '@/components/market-insights/MarketAnalytics';

export default function MarketInsightsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'news' | 'analytics'>('analytics');

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Market Insights</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'analytics' && styles.activeTab]}
            onPress={() => setActiveTab('analytics')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === 'analytics' && styles.activeTabText]}>
              Analytics
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'news' && styles.activeTab]}
            onPress={() => setActiveTab('news')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === 'news' && styles.activeTabText]}>
              Live Updates
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.contentContainer}>
          {activeTab === 'analytics' ? <MarketAnalytics /> : <NewsFeed />}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Neutrals.background,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: Platform.OS === 'web' ? 18 : 8,
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
  tabsContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: Neutrals.surface,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: Radius.full,
    backgroundColor: Neutrals.gray100,
  },
  activeTab: {
    backgroundColor: Neutrals.obsidian,
  },
  tabText: {
    ...Typography.labelLarge,
    color: Neutrals.gray600,
  },
  activeTabText: {
    color: Neutrals.surface,
  },
  contentContainer: {
    flex: 1,
  },
});
