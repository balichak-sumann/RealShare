import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Neutrals, GoldSystem, Radius, Typography } from '@/constants/design';
import { useResponsive } from '@/hooks/useResponsive';
import { PremiumCard } from './PremiumCard';
import { useRouter } from 'expo-router';
import { TrustBadge } from './TrustBadge';
import { useShortlist } from '@/contexts/ShortlistContext';
import { Ionicons } from '@expo/vector-icons';

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
  areaSuffix?: string;
  description?: string;
  isSoldOut?: boolean;
}

// A neutral gray placeholder shown while the real image loads.
const PLACEHOLDER_BLURHASH = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

function PropertyCardInner({
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
  areaSuffix = 'sq.ft',
  description,
  isSoldOut = false,
}: PropertyCardProps) {
  const router = useRouter();
  const { isDesktop } = useResponsive();
  const { isShortlisted, toggleShortlist } = useShortlist();
  
  const isSaved = isShortlisted(id);

  const handleShortlist = () => {
    toggleShortlist(id);
    if (onShortlist) onShortlist();
  };

  // Only load the FIRST image in the card to avoid mass-downloading all
  // property gallery images at once. Users see the full gallery on tap.
  const heroImage = images?.[0] || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&h=400&fit=crop';

  return (
    <PremiumCard style={[styles.card, compact && styles.compactCard, compact && isDesktop && styles.compactCardDesktop] as any} onPress={() => router.push(`/property/${id}` as any)}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: heroImage }}
          style={[styles.image, compact && styles.compactImage, compact && isDesktop && styles.compactImageDesktop]}
          contentFit="cover"
          placeholder={{ blurhash: PLACEHOLDER_BLURHASH }}
          placeholderContentFit="cover"
          transition={200}
        />
        {images.length > 1 && (
          <View style={styles.imageCountBadge}>
            <Ionicons name="images-outline" size={12} color="#fff" />
            <Text style={styles.imageCountText}>{images.length}</Text>
          </View>
        )}
        <View style={styles.badgesTop}>
          {isVerified && <TrustBadge type="verified" />}
        </View>
        {isSoldOut && (
          <View style={styles.soldOutOverlay}>
            <View style={styles.soldOutBadge}>
              <Text style={styles.soldOutText}>SOLD OUT</Text>
            </View>
          </View>
        )}
        <TouchableOpacity style={styles.shortlistBtn} onPress={handleShortlist}>
          <Text style={[styles.shortlistIcon, isSaved && styles.shortlistIconSaved]}>
            {isSaved ? '♥' : '♡'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          {price ? (
            <View style={styles.priceContainer}>
              <Text style={styles.price}>{price}</Text>
            </View>
          ) : (
            <View style={{ flex: 1 }} />
          )}
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreText}>{score}</Text>
          </View>
        </View>

        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color={Neutrals.textSecondary} style={{ marginRight: 4 }} />
          <Text style={styles.location}>{location}</Text>
        </View>

        <View style={styles.featuresRow}>
          <Text style={styles.feature}>{bhk}</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.feature}>{area}{areaSuffix ? ` ${areaSuffix}` : ''}</Text>
        </View>

        {description && (
          <Text style={styles.descriptionText} numberOfLines={2}>
            {description}
          </Text>
        )}

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

// Memoize to prevent re-rendering all cards when parent state changes
// (e.g. scroll position, category filter, new data arriving).
export const PropertyCard = React.memo(PropertyCardInner);

const styles = StyleSheet.create({
  card: {
    width: '100%',
    marginBottom: 16,
  },
  compactCard: {
    width: 280,
    minHeight: 340,
    marginRight: 16,
    marginBottom: 8,
  },
  compactCardDesktop: {
    width: 320,
    marginRight: 24,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
  },
  compactImage: {
    height: 160,
  },
  compactImageDesktop: {
    height: 180,
  },
  imageCountBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  imageCountText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  badgesTop: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
  },
  soldOutOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  soldOutBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.md,
    transform: [{ rotate: '-10deg' }],
  },
  soldOutText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 2,
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
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  location: {
    ...Typography.bodyMedium,
    color: Neutrals.textSecondary,
    flex: 1,
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
  descriptionText: {
    ...Typography.bodySmall,
    color: Neutrals.textSecondary,
    marginTop: 8,
  },
});
