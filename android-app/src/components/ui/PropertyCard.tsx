import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Neutrals, GoldSystem, Radius, Typography } from '@/constants/design';
import { PremiumCard } from './PremiumCard';
import { useRouter } from 'expo-router';
import { TrustBadge } from './TrustBadge';
import { useShortlist } from '@/contexts/ShortlistContext';

interface PropertyCardProps {
  id: string;
  title: string;
  location: string;
  price: string;
  images: string[];
  bhk: string;
  area: string;
  score: number;
  isVerified?: boolean;
  onShortlist?: () => void;
  compact?: boolean;
  agentCommission?: string;
  onShare?: () => void;
}

export function PropertyCard({
  id,
  title,
  location,
  price,
  images,
  bhk,
  area,
  score,
  isVerified = true,
  onShortlist,
  compact = false,
  agentCommission,
  onShare,
}: PropertyCardProps) {
  const router = useRouter();
  const { isShortlisted, toggleShortlist } = useShortlist();
  
  const isSaved = isShortlisted(id);

  const handleShortlist = () => {
    toggleShortlist(id);
    if (onShortlist) onShortlist();
  };

  return (
    <PremiumCard style={[styles.card, compact && styles.compactCard] as any} onPress={() => router.push(`/property/${id}` as any)}>
      <View style={styles.imageContainer}>
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
          {images.map((img, idx) => (
            <Image key={idx} source={{ uri: img }} style={[styles.image, compact && styles.compactImage]} />
          ))}
        </ScrollView>
        <View style={styles.badgesTop}>
          {isVerified && <TrustBadge type="verified" />}
        </View>
        <TouchableOpacity style={styles.shortlistBtn} onPress={handleShortlist}>
          <Text style={[styles.shortlistIcon, isSaved && styles.shortlistIconSaved]}>
            {isSaved ? '♥' : '♡'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>{price}</Text>
          </View>
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreText}>{score}</Text>
          </View>
        </View>

        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <Text style={styles.location}>📍 {location}</Text>

        <View style={styles.featuresRow}>
          <Text style={styles.feature}>{bhk}</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.feature}>{area} sq.ft</Text>
        </View>

        {agentCommission && (
          <View style={{ marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 13, color: '#4B5563', fontWeight: '500' }}>Commission</Text>
            <View style={{ backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
              <Text style={{ color: '#059669', fontSize: 12, fontWeight: '800' }}>{agentCommission}</Text>
            </View>
          </View>
        )}

        {onShare && (
          <TouchableOpacity 
            onPress={onShare}
            style={{ 
              marginTop: 16, 
              backgroundColor: '#111827', 
              paddingVertical: 10, 
              borderRadius: 8, 
              alignItems: 'center' 
            }}
          >
            <Text style={{ color: '#D4AF37', fontWeight: '800', fontSize: 13 }}>Share Listing</Text>
          </TouchableOpacity>
        )}
      </View>
    </PremiumCard>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    marginBottom: 16,
  },
  compactCard: {
    width: 280,
    marginRight: 16,
    marginBottom: 8,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  image: {
    width: 400, // Width of screen roughly, handled by ScrollView paging
    height: 200,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
  },
  compactImage: {
    width: 280,
    height: 160,
  },
  badgesTop: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
  },
  shortlistBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.8)',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortlistIcon: {
    fontSize: 18,
    color: Neutrals.obsidian,
  },
  shortlistIconSaved: {
    color: GoldSystem.primaryGold,
  },
  content: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceContainer: {
    flex: 1,
  },
  price: {
    ...Typography.displayMedium,
    color: Neutrals.obsidian,
  },
  scoreBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: GoldSystem.paleGold,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: GoldSystem.primaryGold,
  },
  scoreText: {
    ...Typography.labelMedium,
    color: GoldSystem.darkGold,
  },
  title: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
    marginBottom: 4,
  },
  location: {
    ...Typography.bodyMedium,
    color: Neutrals.textSecondary,
    marginBottom: 12,
  },
  featuresRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feature: {
    ...Typography.labelMedium,
    color: Neutrals.obsidian,
    backgroundColor: Neutrals.gray100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  dot: {
    marginHorizontal: 8,
    color: Neutrals.gray400,
  },
});
