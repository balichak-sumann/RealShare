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

export function QuickActions() {
  const router = useRouter();
  const { isDesktop } = useResponsive();

  return (
    <View style={styles.wrapper}>
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

      {/* Cards Row */}
      <View 
        style={[styles.cardsContainer, isDesktop ? styles.cardsContainerDesktop : styles.cardsContainerMobile]}
      >
        {(isDesktop ? QUICK_ACTIONS : QUICK_ACTIONS.filter(a => a.id !== 'q4')).map((action, index) => (
          <TouchableOpacity
            key={action.id}
            style={[
              styles.card, 
              isDesktop 
                ? styles.cardDesktop 
                : index === 0 
                  ? styles.cardMobileHero 
                  : styles.cardMobileHalf
            ]}
            onPress={() => router.push(action.route as any)}
            activeOpacity={0.8}
          >
            <View style={[
              styles.imageContainer,
              !isDesktop && index === 0 && { height: 230 },
              !isDesktop && index !== 0 && { height: 60 }
            ]}>
              <Image 
                source={{ uri: CARD_IMAGES[action.id] }} 
                style={styles.cardImage} 
                contentFit="cover" 
              />
              {index === 0 && (
                <LinearGradient
                  colors={['rgba(0,0,0,0.85)', 'rgba(0,0,0,0.4)', 'transparent']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={StyleSheet.absoluteFillObject}
                />
              )}
            </View>
            
            {index === 0 && !isDesktop ? (
              <View style={styles.heroContentContainer}>
                <View style={styles.heroSuperTitleRow}>
                  <Text style={styles.heroSuperTitle}>FEATURED</Text>
                  <View style={styles.heroGoldLine} />
                </View>
                <Text style={styles.heroTitle}>
                  Buy Premium{'\n'}
                  <Text style={{ color: GoldSystem.primaryGold }}>Properties</Text>
                </Text>
                <Text style={styles.heroSubtitle}>{action.subtitle}</Text>
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <View style={styles.heroExploreButton}>
                    <Text style={styles.heroExploreText}>Buy Properties</Text>
                    <Ionicons name="arrow-forward" size={16} color="#000" />
                  </View>
                  
                  {/* Floating Glass Box */}
                  <View style={styles.heroGlassBox}>
                    <Text style={styles.heroGlassText}>Zero{'\n'}Brokerage</Text>
                    <View style={styles.heroGlassLine} />
                  </View>
                </View>
              </View>
            ) : (
              <View style={[styles.contentContainer, !isDesktop && index !== 0 && { padding: 8, alignItems: 'center' }]}>
                <View style={[styles.iconWrapper, { backgroundColor: ACTION_COLORS[action.id] }, !isDesktop && index !== 0 && { width: 32, height: 32, borderRadius: 16, marginTop: -24 }]}>
                  <Ionicons
                    name={action.icon as IoniconName}
                    size={!isDesktop && index !== 0 ? 16 : 24}
                    color={ACTION_ICON_COLORS[action.id]}
                  />
                </View>

                <Text style={[styles.cardTitle, !isDesktop && index !== 0 && { fontSize: 12, textAlign: 'center', marginBottom: 0 }]} numberOfLines={!isDesktop && index !== 0 ? 2 : 1}>{action.title}</Text>
                
                {(!(!isDesktop && index !== 0)) && (
                  <>
                    <Text style={styles.cardSubtitle}>{action.subtitle}</Text>

                    <View style={styles.cardFooter}>
                      <View style={styles.exploreLink}>
                        <Text style={styles.exploreText}>Explore Now</Text>
                        <Ionicons name="arrow-forward" size={16} color={GoldSystem.primaryGold} style={{marginLeft: 4}} />
                      </View>
                      
                      <View style={[styles.arrowButton, { backgroundColor: ACTION_COLORS[action.id] }]}>
                        <Ionicons name="arrow-forward" size={18} color={ACTION_ICON_COLORS[action.id]} />
                      </View>
                    </View>
                  </>
                )}
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    marginTop: 48,
    marginBottom: 32,
  },
  headerContainer: {
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
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 24,
    width: '100%',
  },
  card: {
    backgroundColor: Neutrals.white,
    borderRadius: Radius.xl,
    width: 280,
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 12px 30px rgba(0,0,0,0.08)',
        } as any)
      : Shadows.medium),
  },
  cardDesktop: {
    width: 300,
  },
  cardMobileHero: {
    width: '100%',
    backgroundColor: Neutrals.obsidian, // Dark background for the hero card
    overflow: 'hidden',
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
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: Neutrals.white,
  },
  cardTitle: {
    ...Typography.headlineSmall,
    color: Neutrals.obsidian,
    marginBottom: 8,
  },
  cardSubtitle: {
    ...Typography.bodyMedium,
    color: Neutrals.gray500,
    lineHeight: 18,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Neutrals.gray100,
  },
  exploreLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exploreText: {
    ...Typography.labelLarge,
    color: GoldSystem.primaryGold,
  },
  arrowButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
