import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Image,
  Platform,
  Animated,
} from 'react-native';
import { useRef } from 'react';
import { useRouter } from 'expo-router';
import { auth } from '@/lib/firebase';
import { useUser } from '@/contexts/UserContext';
import { useLocation } from '@/contexts/LocationContext';
import { useDrawer } from '@/contexts/DrawerContext';
import { Neutrals, GoldSystem, Typography, Radius } from '@/constants/design';
import { isSplashComplete, onSplashComplete } from '@/components/animated-icon';

import AgentPortalScreen from '../agent-portal';
import BuilderPortalScreen from '../builder-portal';
import EmployeePortalScreen from '../employee-portal';

import { HeroCarousel } from '@/components/home/HeroCarousel';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { QuickActions } from '@/components/home/QuickActions';
import { RecentActivity } from '@/components/home/RecentActivity';
import { HotProjects } from '@/components/home/HotProjects';
import { TopLocalities } from '@/components/home/TopLocalities';
import { ServicesStrip } from '@/components/home/ServicesStrip';
import { TopDevelopers } from '@/components/home/TopDevelopers';

import { SectionHeader } from '@/components/ui/SectionHeader';
import { PropertyCard } from '@/components/ui/PropertyCard';
import { MOCK_RESALE_PROPERTIES, MOCK_RENTAL_PROPERTIES } from '@/constants/mockData';
import { propertyToCardProps } from '@/lib/formatters';
import { TabAnimationWrapper } from '@/components/ui/TabAnimationWrapper';

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useUser();
  const { city } = useLocation();
  const { toggleDrawer } = useDrawer();
  const [userName, setUserName] = useState('Investor');
  const [hotProperties, setHotProperties] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com'}/api/properties`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          // "Hot Selling" = most-subscribed properties first
          const sorted = [...data].sort((a, b) => (b.sold_fractions ?? 0) - (a.sold_fractions ?? 0));
          setHotProperties(sorted.slice(0, 8));
        }
      })
      .catch(() => {});
  }, []);

  const scrollY = useRef(new Animated.Value(0)).current;

  // Coordinate header logo with splash animation
  const [splashDone, setSplashDone] = useState(isSplashComplete());
  useEffect(() => {
    if (!splashDone) {
      onSplashComplete(() => setSplashDone(true));
    }
  }, [splashDone]);

  const headerBottomHeight = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [48, 0],
    extrapolate: 'clamp'
  });

  const headerBottomOpacity = scrollY.interpolate({
    inputRange: [0, 30],
    outputRange: [1, 0],
    extrapolate: 'clamp'
  });

  const headerBottomMargin = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [16, 0],
    extrapolate: 'clamp'
  });

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser && currentUser.displayName) {
      setUserName(currentUser.displayName.split(' ')[0]);
    } else if (currentUser && currentUser.email) {
      const nameFromEmail = currentUser.email.split('@')[0];
      setUserName(nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1));
    }
  }, []);

  if (profile?.role === 'agent') {
    return <AgentPortalScreen isEmbedded={true} />;
  }
  if (profile?.role === 'builder') {
    return <BuilderPortalScreen isEmbedded={true} />;
  }
  if (profile?.role === 'employee' || profile?.role === 'admin') {
    return <EmployeePortalScreen isEmbedded={true} />;
  }

  return (
    <TabAnimationWrapper>
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={toggleDrawer} style={styles.headerIconBtn}>
            <Text style={styles.headerIcon}>☰</Text>
          </TouchableOpacity>

          <View style={[styles.logoContainer, { opacity: splashDone ? 1 : 0 }]} pointerEvents="none">
            <Image source={require('../../../assets/logo.png')} style={styles.logoImage} />
          </View>

          <TouchableOpacity onPress={() => router.push('/notifications')} style={styles.headerIconBtnRight}>
            <View style={styles.notificationBadge} />
            <Text style={styles.headerIcon}>🔔</Text>
          </TouchableOpacity>
        </View>

        <Animated.View style={{ height: headerBottomHeight, opacity: headerBottomOpacity, marginTop: headerBottomMargin, overflow: 'hidden' }}>
          <View style={styles.headerBottom}>
            <TouchableOpacity style={styles.locationSelector}>
              <Text style={styles.locationIcon}>📍</Text>
              <Text style={styles.locationText}>{city}</Text>
              <Text style={styles.locationDropdown}>▼</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.searchButton} onPress={() => router.push('/search')}>
              <Text style={styles.searchIcon}>🔍</Text>
              <Text style={styles.searchText}>Search...</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>

      <Animated.ScrollView 
        style={styles.scrollContent} 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 120 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        <HeroCarousel />
        <CategoryGrid />
        
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome back, {userName}</Text>
        </View>

        <QuickActions />
        
        <RecentActivity />
        
        <View style={styles.featuredSection}>
          <SectionHeader title="Hot Selling Projects" onViewAll={() => {}} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredScroll}>
            {hotProperties.map((prop) => (
              <PropertyCard key={prop.id} {...propertyToCardProps(prop)} compact />
            ))}
          </ScrollView>
        </View>

        <TopDevelopers />

        <HotProjects />

        <View style={styles.featuredSection}>
          <SectionHeader title="Resale Properties" onViewAll={() => {}} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredScroll}>
            {MOCK_RESALE_PROPERTIES.map((prop) => (
              <PropertyCard key={prop.id} {...prop} compact />
            ))}
          </ScrollView>
        </View>
        
        <View style={styles.featuredSection}>
          <SectionHeader title="Properties for Rent" onViewAll={() => {}} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredScroll}>
            {MOCK_RENTAL_PROPERTIES.map((prop) => (
              <PropertyCard key={prop.id} {...prop} compact />
            ))}
          </ScrollView>
        </View>
        <TopLocalities />
        <ServicesStrip />

        {/* Trust Banner */}
        <View style={styles.trustBanner}>
          <Text style={styles.trustItem}>✓ Verified Homes</Text>
          <Text style={styles.trustItem}>✓ Zero Brokerage</Text>
          <Text style={styles.trustItem}>✓ Fractional Investing</Text>
        </View>

      </Animated.ScrollView>
    </View>
    </TabAnimationWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Neutrals.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'web' ? 16 : Platform.OS === 'android' ? 40 : 50,
    paddingBottom: 16,
    backgroundColor: Neutrals.surface,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    height: 48,
  },
  headerIconBtn: {
    padding: 8,
    marginLeft: -8,
  },
  headerIconBtnRight: {
    padding: 8,
    marginRight: -8,
  },
  headerIcon: {
    fontSize: 24,
    color: Neutrals.obsidian,
  },
  logoContainer: {
    ...StyleSheet.absoluteFill as any,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: -1,
  },
  logoImage: {
    width: 170,
    height: 48,
    resizeMode: 'contain',
  },
  headerBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Neutrals.gray100,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: Radius.full,
    minWidth: 120,
  },
  locationIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  locationText: {
    ...Typography.bodyMedium,
    color: Neutrals.obsidian,
    marginRight: 4,
  },
  locationDropdown: {
    fontSize: 10,
    color: Neutrals.gray500,
    marginTop: 2,
  },
  searchButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Neutrals.gray100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.full,
  },
  searchIcon: {
    fontSize: 16,
    color: Neutrals.gray500,
    marginRight: 8,
  },
  searchText: {
    ...Typography.bodyMedium,
    color: Neutrals.gray500,
  },
  logoText: {
    ...Typography.headlineMedium,
    color: GoldSystem.primaryGold,
    letterSpacing: 1,
  },
  logoBold: {
    fontWeight: '800',
    color: Neutrals.obsidian,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Neutrals.ruby,
    zIndex: 1,
  },
  scrollContent: {
    flex: 1,
  },
  welcomeSection: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  welcomeTitle: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
  },
  featuredSection: {
    marginTop: 16,
  },
  featuredScroll: {
    paddingHorizontal: 16,
  },
  trustBanner: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    backgroundColor: Neutrals.surface,
    marginTop: 24,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Neutrals.border,
  },
  trustItem: {
    ...Typography.caption,
    color: Neutrals.textSecondary,
    fontWeight: '600',
  },
});
