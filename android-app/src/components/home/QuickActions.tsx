import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView } from 'react-native';
import { QUICK_ACTIONS } from '@/constants/uiConstants';
import { Neutrals, GoldSystem, Radius, Typography, Shadows } from '@/constants/design';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '@/hooks/useResponsive';
import { Image } from 'expo-image';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const CARD_IMAGES: Record<string, string> = {
  'q1': 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800&auto=format&fit=crop', // Buy - Luxury Modern Property
  'q2': 'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?q=80&w=800&auto=format&fit=crop', // Services
  'q3': 'https://images.unsplash.com/photo-1505843513577-22bb7d21e455?q=80&w=800&auto=format&fit=crop', // Investment
  'q4': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop', // Insights
};

const ACTION_COLORS: Record<string, string> = {
  'q1': '#FDE68A', // Gold tint
  'q2': '#D1FAE5', // Green tint
  'q3': '#EDE9FE', // Purple tint
  'q4': '#FFEDD5', // Orange tint
};

const ACTION_ICON_COLORS: Record<string, string> = {
  'q1': '#92400E', 
  'q2': '#065F46', 
  'q3': '#5B21B6', 
  'q4': '#9A3412', 
};

export function QuickActions({ children }: { children?: React.ReactNode }) {
  const router = useRouter();
  const { isDesktop } = useResponsive();

  return (
    <View style={[styles.wrapper, !isDesktop && { marginTop: 8 }]}>
      {/* Section Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.superTitle}>DISCOVER MORE</Text>
        <Text style={styles.mainTitle}>
          A Smarter Way to Experience <Text style={styles.goldText}>Real Estate</Text>
        </Text>
        <Text style={styles.subtitleText}>
          Explore opportunities, services and insights — all in one place.
        </Text>
      </View>

      {children && (
        <View style={{ marginBottom: 32 }}>
          {children}
        </View>
      )}

      {/* Cards Row */}
      <View 
        style={[styles.cardsContainer, styles.cardsContainerDesktop, !isDesktop && { gap: 8 }]}
      >
        {QUICK_ACTIONS.map((action, index) => (
          <TouchableOpacity
            key={action.id}
            style={[styles.card, styles.cardDesktop]}
            onPress={() => router.push(action.route as any)}
            activeOpacity={0.8}
          >
            <Image 
              source={{ uri: CARD_IMAGES[action.id] }} 
              style={StyleSheet.absoluteFill} 
              contentFit="cover" 
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.85)']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            
            {/* Top Icon */}
            <View style={[styles.topIconContainer, !isDesktop && { top: 8, left: 8 }]}>
              <View style={[styles.iconWrapper, { backgroundColor: ACTION_COLORS[action.id] }, !isDesktop && { width: 28, height: 28, borderRadius: 14 }]}>
                <Ionicons
                  name={action.icon as IoniconName}
                  size={isDesktop ? 20 : 14}
                  color={ACTION_ICON_COLORS[action.id]}
                />
              </View>
            </View>

            {/* Bottom Content overlaid on image */}
            <View style={[styles.overlayContent, !isDesktop && { padding: 8, justifyContent: 'flex-end' }]}>
              <Text style={[styles.overlayTitle, !isDesktop && { fontSize: 11, marginBottom: 0 }]} numberOfLines={1}>{action.title}</Text>
              {isDesktop && (
                <>
                  <Text style={styles.overlaySubtitle} numberOfLines={1}>{action.subtitle}</Text>
                  
                  <View style={styles.overlayFooter}>
                    <View style={styles.heroExploreButton}>
                      <Text style={styles.heroExploreText}>Explore</Text>
                      <Ionicons name="arrow-forward" size={14} color="#000" />
                    </View>
                  </View>
                </>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 48,
    marginBottom: 32,
  },
  headerContainer: {
    paddingHorizontal: 16,
    marginBottom: 32,
    alignItems: Platform.OS === 'web' ? 'center' : 'flex-start',
  },
  superTitle: {
    ...Typography.labelMedium,
    color: GoldSystem.primaryGold,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  mainTitle: {
    ...Typography.displayMedium,
    color: Neutrals.obsidian,
    marginBottom: 12,
    textAlign: Platform.OS === 'web' ? 'center' : 'left',
  },
  goldText: {
    color: GoldSystem.primaryGold,
  },
  subtitleText: {
    ...Typography.bodyLarge,
    color: Neutrals.gray500,
    textAlign: Platform.OS === 'web' ? 'center' : 'left',
  },
  cardsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  cardsContainerMobile: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 16,
    columnGap: '2%',
  },
  cardsContainerDesktop: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'space-between',
    gap: 16,
    width: '100%',
  },
  card: {
    backgroundColor: Neutrals.obsidian,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    position: 'relative',
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 12px 30px rgba(0,0,0,0.15)',
        } as any)
      : Shadows.medium),
  },
  cardDesktop: {
    flex: 1,
    aspectRatio: 1, // Makes it a perfect square
  },
  cardMobileHero: {
    width: '100%',
    aspectRatio: 1,
  },
  cardMobileHalf: {
    width: '48%',
    aspectRatio: 1.1,
  },
  imageContainer: {
    height: 110,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  heroContentContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    justifyContent: 'space-between',
  },
  heroSuperTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  heroSuperTitle: {
    ...Typography.caption,
    color: Neutrals.white,
    letterSpacing: 2,
    marginRight: 8,
  },
  heroGoldLine: {
    width: 24,
    height: 1,
    backgroundColor: GoldSystem.primaryGold,
  },
  heroTitle: {
    ...Typography.headlineLarge,
    color: Neutrals.white,
    fontWeight: '800',
    lineHeight: 32,
    marginBottom: 4,
  },
  heroSubtitle: {
    ...Typography.bodyMedium,
    color: Neutrals.gray200,
    marginBottom: 16,
  },
  heroExploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GoldSystem.primaryGold,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 9999,
  },
  heroExploreText: {
    ...Typography.labelMedium,
    color: '#000',
    fontWeight: '700',
    marginRight: 4,
  },
  heroGlassBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'flex-start',
  },
  heroGlassText: {
    color: Neutrals.white,
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 4,
  },
  heroGlassLine: {
    width: 20,
    height: 1,
    backgroundColor: GoldSystem.primaryGold,
  },
  contentContainer: {
    padding: 12,
    paddingTop: 0,
    position: 'relative',
  },
  topIconContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
    justifyContent: 'flex-end',
  },
  overlayTitle: {
    ...Typography.headlineSmall,
    color: Neutrals.white,
    fontWeight: '700',
    marginBottom: 4,
  },
  overlaySubtitle: {
    ...Typography.bodyMedium,
    color: Neutrals.gray300,
    marginBottom: 16,
  },
  overlayFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
