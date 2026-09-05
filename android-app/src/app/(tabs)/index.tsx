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
import { Ionicons } from '@expo/vector-icons';

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
import { propertyToCardProps } from '@/lib/formatters';
import { ResponsiveRail } from '@/components/layout/ResponsiveRail';
import { useResponsive } from '@/hooks/useResponsive';
import { TabAnimationWrapper } from '@/components/ui/TabAnimationWrapper';
import { LocationPickerModal } from '@/components/ui/LocationPickerModal';
import { WebFooter } from '@/components/layout/WebFooter';
import { WealthMarketingSection } from '@/components/home/WealthMarketingSection';
import { QuoteSection } from '@/components/home/QuoteSection';
import { BenefitsSection } from '@/components/home/BenefitsSection';

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useUser();
  const { isDesktop } = useResponsive();
  const { city } = useLocation();
  const { toggleDrawer } = useDrawer();
  const [userName, setUserName] = useState('Investor');
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [hotProperties, setHotProperties] = useState<any[]>([]);
  const [rentalProperties, setRentalProperties] = useState<any[]>([]);
  const [resaleProperties, setResaleProperties] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com'}/api/properties`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          // Filter out rental/resale from hot properties
          const primaryProps = data.filter(p => p.listing_type !== 'rental' && p.listing_type !== 'resale');
          const sorted = [...primaryProps].sort((a, b) => (b.sold_fractions ?? 0) - (a.sold_fractions ?? 0));
          setHotProperties(sorted.slice(0, 10));
        }
      })
      .catch(() => {});

    fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com'}/api/properties?listing_type=rental`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setRentalProperties(data.slice(0, 10));
      }).catch(() => {});

    fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com'}/api/properties?listing_type=resale`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setResaleProperties(data.slice(0, 10));
      }).catch(() => {});
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
      {/* Header — phone only; desktop is navigated from DesktopNav */}
      {!isDesktop && (
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={toggleDrawer} style={styles.headerIconBtn}>
            <Ionicons name="menu-outline" size={24} color={Neutrals.obsidian} />
          </TouchableOpacity>

          <View style={[styles.logoContainer, { opacity: splashDone ? 1 : 0 }]} pointerEvents="none">
            <Image source={require('../../../assets/logo.png')} style={styles.logoImage} />
          </View>

          <TouchableOpacity onPress={() => router.push('/notifications')} style={styles.headerIconBtnRight}>
            <View style={styles.notificationBadge} />
            <Ionicons name="notifications-outline" size={22} color={Neutrals.obsidian} />
          </TouchableOpacity>
        </View>

        <Animated.View style={{ height: headerBottomHeight, opacity: headerBottomOpacity, marginTop: headerBottomMargin, overflow: 'hidden' }}>
          <View style={styles.headerBottom}>
            <TouchableOpacity style={styles.locationSelector} onPress={() => setShowLocationPicker(true)}>
              <Ionicons name="location-outline" size={16} color={GoldSystem.primaryGold} style={{ marginRight: 4 }} />
              <Text style={styles.locationText}>{city}</Text>
              <Ionicons name="chevron-down" size={14} color={Neutrals.gray500} style={{ marginLeft: 4 }} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.searchButton} onPress={() => router.push('/search')}>
              <Ionicons name="search-outline" size={16} color={Neutrals.gray400} style={{ marginRight: 6 }} />
              <Text style={styles.searchText}>Search...</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
      )}

      <LocationPickerModal visible={showLocationPicker} onClose={() => setShowLocationPicker(false)} />

      <Animated.ScrollView 
        style={styles.scrollContent} 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={[
          { paddingBottom: isDesktop ? 64 : 120 },
          isDesktop && { width: '100%', paddingHorizontal: 24 },
        ] as any}
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
          <SectionHeader title="Hot Selling Projects" onViewAll={() => router.push('/(tabs)/search')} />
          <ResponsiveRail contentContainerStyle={styles.featuredScroll}>
            {hotProperties.map((prop) => (
              <PropertyCard key={prop.id} {...propertyToCardProps(prop)} compact />
            ))}
          </ResponsiveRail>
        </View>

        <TopDevelopers />

        {isDesktop && <QuoteSection />}

        <HotProjects />

        {isDesktop && <WealthMarketingSection />}


        <View style={styles.featuredSection}>
          <SectionHeader title="Resale Properties" onViewAll={() => router.push('/(tabs)/search')} />
          {resaleProperties.length > 0 ? (
            <ResponsiveRail contentContainerStyle={styles.featuredScroll}>
              {resaleProperties.map((prop) => (
                <PropertyCard key={prop.id} {...propertyToCardProps(prop)} compact />
              ))}
            </ResponsiveRail>
          ) : (
            <View style={styles.comingSoonCard}>
              <Text style={styles.comingSoonIcon}>🏠</Text>
              <Text style={styles.comingSoonTitle}>No Resale Properties</Text>
              <Text style={styles.comingSoonDesc}>Check back later for new resale listings.</Text>
            </View>
          )}
        </View>
        
        <View style={styles.featuredSection}>
          <SectionHeader title="Properties for Rent" onViewAll={() => router.push('/(tabs)/search')} />
          {rentalProperties.length > 0 ? (
            <ResponsiveRail contentContainerStyle={styles.featuredScroll}>
              {rentalProperties.map((prop) => (
                <PropertyCard key={prop.id} {...propertyToCardProps(prop)} compact />
              ))}
            </ResponsiveRail>
          ) : (
            <View style={styles.comingSoonCard}>
              <Text style={styles.comingSoonIcon}>🔑</Text>
              <Text style={styles.comingSoonTitle}>No Rental Listings</Text>
              <Text style={styles.comingSoonDesc}>Check back later for new rental listings.</Text>
            </View>
          )}
        </View>
        <TopLocalities />

        {isDesktop && <BenefitsSection />}

        <ServicesStrip />

        {/* Trust Banner */}
        <View style={styles.trustBanner}>
          <Text style={styles.trustItem}>✓ Verified Homes</Text>
          <Text style={styles.trustItem}>✓ Zero Brokerage</Text>
          <Text style={styles.trustItem}>✓ Fractional Investing</Text>
        </View>

        {isDesktop && <WebFooter />}

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
  comingSoonCard: {
    marginHorizontal: 16,
    padding: 24,
    backgroundColor: Neutrals.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Neutrals.border,
    alignItems: 'center',
  },
  comingSoonIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  comingSoonTitle: {
    ...Typography.labelLarge,
    color: Neutrals.obsidian,
    marginBottom: 4,
    textAlign: 'center',
  },
  comingSoonDesc: {
    ...Typography.bodyMedium,
    color: Neutrals.gray500,
    textAlign: 'center',
  },
});
