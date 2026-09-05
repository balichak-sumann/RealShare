import React from 'react';
import { View, Text, StyleSheet, Image, Platform } from 'react-native';
import { Neutrals, GoldSystem, Typography } from '@/constants/design';
import { useResponsive } from '@/hooks/useResponsive';
import { GoldButton } from '../ui/GoldButton';
import { useRouter } from 'expo-router';

export function WealthMarketingSection() {
  const { isDesktop } = useResponsive();
  const router = useRouter();

  return (
    <View style={[styles.container, isDesktop && styles.containerDesktop]}>
      <View style={[styles.inner, isDesktop && styles.innerDesktop]}>
        
        {/* Image Side */}
        <View style={[styles.imageContainer, isDesktop && styles.imageContainerDesktop]}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=1200&fit=crop' }} 
            style={styles.image}
            resizeMode="cover"
          />
        </View>

        {/* Content Side */}
        <View style={[styles.contentContainer, isDesktop && styles.contentContainerDesktop]}>
          <Text style={styles.kicker}>Build Generational Wealth</Text>
          <Text style={[styles.title, isDesktop && styles.titleDesktop]}>
            Fractional Ownership, Exponential Growth
          </Text>
          <Text style={[styles.description, isDesktop && styles.descriptionDesktop]}>
            Smart investing means diversifying your portfolio. Access institutional-grade 
            assets that were previously out of reach, earn steady passive income, and 
            build a legacy with RealShare.
          </Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>12-15%</Text>
              <Text style={styles.statLabel}>Target IRR</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>Monthly</Text>
              <Text style={styles.statLabel}>Rent Payouts</Text>
            </View>
          </View>

          <GoldButton 
            title="Start Investing" 
            onPress={() => router.push('/(tabs)/search')}
            style={styles.button}
          />
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Neutrals.obsidian,
    marginVertical: 40,
    overflow: 'hidden',
  },
  containerDesktop: {
    borderRadius: 24,
    marginHorizontal: 24,
  },
  inner: {
    flexDirection: 'column',
    width: '100%',
  },
  innerDesktop: {
    flexDirection: 'row',
  },
  imageContainer: {
    width: '100%',
    height: 300,
  },
  imageContainerDesktop: {
    flex: 1,
    height: '100%',
    minHeight: 500,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    padding: 32,
    justifyContent: 'center',
  },
  contentContainerDesktop: {
    flex: 1,
    padding: 64,
  },
  kicker: {
    ...Typography.labelLarge,
    color: GoldSystem.primaryGold,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 16,
  },
  title: {
    ...Typography.displayMedium,
    color: Neutrals.white,
    marginBottom: 16,
  },
  titleDesktop: {
    fontSize: 42,
    lineHeight: 50,
    marginBottom: 24,
  },
  description: {
    ...Typography.bodyLarge,
    color: Neutrals.gray300,
    lineHeight: 24,
    marginBottom: 32,
  },
  descriptionDesktop: {
    fontSize: 18,
    lineHeight: 28,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 32,
    marginBottom: 40,
  },
  statBox: {
    flex: 1,
    borderLeftWidth: 2,
    borderLeftColor: GoldSystem.darkGold,
    paddingLeft: 16,
  },
  statValue: {
    ...Typography.headlineLarge,
    color: Neutrals.white,
    marginBottom: 4,
  },
  statLabel: {
    ...Typography.labelMedium,
    color: Neutrals.gray400,
  },
  button: {
    width: 200,
  }
});
