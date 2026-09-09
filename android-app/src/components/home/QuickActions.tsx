import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView } from 'react-native';
import { QUICK_ACTIONS } from '@/constants/uiConstants';
import { Neutrals, GoldSystem, Radius, Typography, Shadows } from '@/constants/design';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '@/hooks/useResponsive';
import { Image } from 'expo-image';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const CARD_IMAGES: Record<string, string> = {
  'q1': 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=800&auto=format&fit=crop', // Buy
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
      <ScrollView 
        horizontal={!isDesktop} 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.cardsContainer, isDesktop && styles.cardsContainerDesktop]}
      >
        {QUICK_ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={[styles.card, isDesktop && styles.cardDesktop]}
            onPress={() => router.push(action.route as any)}
            activeOpacity={0.8}
          >
            <View style={styles.imageContainer}>
              <Image 
                source={{ uri: CARD_IMAGES[action.id] }} 
                style={styles.cardImage} 
                contentFit="cover" 
              />
            </View>
            
            <View style={styles.contentContainer}>
              <View style={[styles.iconWrapper, { backgroundColor: ACTION_COLORS[action.id] }]}>
                <Ionicons
                  name={action.icon as IoniconName}
                  size={24}
                  color={ACTION_ICON_COLORS[action.id]}
                />
              </View>

              <Text style={styles.cardTitle}>{action.title}</Text>
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
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
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
    gap: 16,
    paddingBottom: 24,
  },
  cardsContainerDesktop: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    width: '100%',
  },
  card: {
    backgroundColor: Neutrals.white,
    borderRadius: Radius.2xl,
    width: 280,
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 12px 30px rgba(0,0,0,0.08)',
        } as any)
      : Shadows.medium),
  },
  cardDesktop: {
    flex: 1,
    maxWidth: 320,
  },
  imageContainer: {
    height: 160,
    borderTopLeftRadius: Radius.2xl,
    borderTopRightRadius: Radius.2xl,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    padding: 24,
    paddingTop: 0, // Icon overlaps
    position: 'relative',
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
    marginBottom: 16,
    borderWidth: 4,
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
    lineHeight: 22,
    minHeight: 44,
    marginBottom: 24,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
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
