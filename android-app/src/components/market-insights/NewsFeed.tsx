import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Image, Linking, TouchableOpacity, Platform } from 'react-native';
import { Neutrals, Typography, Radius, Shadows, GoldSystem } from '@/constants/design';

type Article = {
  title: string;
  description: string;
  content: string;
  url: string;
  image: string;
  publishedAt: string;
  source: {
    name: string;
    url: string;
  };
};

export default function NewsFeed() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const apiKey = process.env.EXPO_PUBLIC_GNEWS_API_KEY;
        if (!apiKey) {
          setError('API Key is missing. Please add EXPO_PUBLIC_GNEWS_API_KEY to your .env file.');
          setLoading(false);
          return;
        }

        // Search for India real estate, property, housing
        const query = encodeURIComponent('India real estate OR property market OR housing');
        const url = `https://gnews.io/api/v4/search?q=${query}&lang=en&country=in&max=10&apikey=${apiKey}`;

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch news data');
        }

        const data = await response.json();
        if (data.articles) {
          setArticles(data.articles);
        } else {
          setError('No articles found.');
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching news.');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={GoldSystem.primaryGold} />
        <Text style={styles.loadingText}>Fetching real-time market updates...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const renderArticle = ({ item }: { item: Article }) => (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.8}
      onPress={() => Linking.openURL(item.url)}
    >
      {item.image && (
        <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
      )}
      <View style={styles.cardContent}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.description} numberOfLines={3}>{item.description}</Text>
        <View style={styles.footer}>
          <Text style={styles.source}>{item.source.name}</Text>
          <Text style={styles.date}>
            {new Date(item.publishedAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={articles}
      keyExtractor={(item, index) => `${item.url}-${index}`}
      renderItem={renderArticle}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <Text style={styles.sectionHeader}>Latest Market News</Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    ...Typography.bodyMedium,
    color: Neutrals.gray600,
    marginTop: 16,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    ...Typography.bodyMedium,
    color: Neutrals.gray600,
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionHeader: {
    ...Typography.headlineSmall,
    color: Neutrals.obsidian,
    marginBottom: 16,
  },
  card: {
    backgroundColor: Neutrals.surface,
    borderRadius: Radius.lg,
    marginBottom: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: Shadows.soft,
      android: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 3 },
      web: Shadows.soft,
    }),
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: Neutrals.gray200,
  },
  cardContent: {
    padding: 16,
  },
  title: {
    ...Typography.titleLarge,
    color: Neutrals.obsidian,
    marginBottom: 8,
  },
  description: {
    ...Typography.bodyMedium,
    color: Neutrals.gray600,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  source: {
    ...Typography.labelMedium,
    color: GoldSystem.primaryGold,
    fontWeight: '600',
  },
  date: {
    ...Typography.labelMedium,
    color: Neutrals.gray500,
  },
});
