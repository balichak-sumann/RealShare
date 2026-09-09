import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Platform,
  Animated,
  TextInput,
} from 'react-native';
import { Image } from 'expo-image';
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
import { PostPropertyBanner } from '@/components/home/PostPropertyBanner';

import { SectionHeader } from '@/components/ui/SectionHeader';
import { PropertyCard } from '@/components/ui/PropertyCard';
import { propertyToCardProps } from '@/lib/formatters';
import { ResponsiveRail } from '@/components/layout/ResponsiveRail';
import { useResponsive } from '@/hooks/useResponsive';
import { TabAnimationWrapper } from '@/components/ui/TabAnimationWrapper';
import { LocationPickerModal } from '@/components/ui/LocationPickerModal';
import { WebFooter } from '@/components/layout/WebFooter';
import { QuoteSection } from '@/components/home/QuoteSection';

import { getApiUrl, resilientFetch } from '@/lib/api';

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useUser();
  const { isDesktop } = useResponsive();
  const { city } = useLocation();
  const { toggleDrawer } = useDrawer();
  const [userName, setUserName] = useState('Investor');
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [allCityProperties, setAllCityProperties] = useState<any[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const checkUnread = async () => {
      try {
        const token = await currentUser.getIdToken();
        const res = await fetch(
          `${getApiUrl()}/api/notifications/feed`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setHasUnread(true);
          }
        }
      } catch (e) {}
    };
    checkUnread();
  }, [auth.currentUser]);

  // Single fetch when city changes — all category filtering happens in memory
  useEffect(() => {
    const query = city === 'All India' ? '' : `?district=${encodeURIComponent(city)}`;
    resilientFetch(`${getApiUrl()}/api/properties${query}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAllCityProperties(data);
        }
      })
      .catch(() => {});
  }, [city]);

  // Derive filtered lists instantly in memory — no network call on category change
  const filtered = useMemo(() => {
    const byCategory = activeCategory === 'All'
      ? allCityProperties
      : allCityProperties.filter(p => p.property_type?.toLowerCase() === activeCategory.toLowerCase());

    const sortSoldOutLast = (a: any, b: any, primarySort: (a: any, b: any) => number) => {
      const aSoldOut = a.available_fractions === 0 ? 1 : 0;
      const bSoldOut = b.available_fractions === 0 ? 1 : 0;
      if (aSoldOut !== bSoldOut) {
        return aSoldOut - bSoldOut; // 0 (Available) comes before 1 (Sold Out)
      }
      return primarySort(a, b);
    };

    const primaryProps = byCategory.filter(p => p.listing_type !== 'rental' && p.listing_type !== 'resale');
    const sortedHot = [...primaryProps].sort((a, b) => 
      sortSoldOutLast(a, b, (x, y) => (y.sold_fractions ?? 0) - (x.sold_fractions ?? 0))
    );
    const sortedNew = [...byCategory].sort((a, b) =>
      sortSoldOutLast(a, b, (x, y) => new Date(y.created_at || 0).getTime() - new Date(x.created_at || 0).getTime())
    );

    return {
      hot: sortedHot.slice(0, 10),
      rental: byCategory.filter(p => p.listing_type === 'rental').sort((a, b) => sortSoldOutLast(a, b, () => 0)).slice(0, 10),
      resale: byCategory.filter(p => p.listing_type === 'resale').sort((a, b) => sortSoldOutLast(a, b, () => 0)).slice(0, 10),
      newProjects: sortedNew.slice(0, 8),
    };
  }, [allCityProperties, activeCategory]);

  const hotProperties = filtered.hot;
  const rentalProperties = filtered.rental;
  const resaleProperties = filtered.resale;

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

  const submitSearch = () => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}` as any);
    } else {
      router.push('/search' as any);
    }
  };

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
            <Image 
              source={require('../../../assets/logo.png')} 
              style={styles.logoImage} 
              contentFit="contain" 
            />
          </View>

          <TouchableOpacity onPress={() => router.push('/notifications')} style={styles.headerIconBtnRight}>
            {hasUnread && <View style={styles.notificationBadge} />}
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

      {/* Desktop web search moved to HeroCarousel */}

      <Animated.ScrollView 
        style={styles.scrollContent} 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={[
          { paddingBottom: isDesktop ? 64 : 120 },
          isDesktop && { width: '100%', paddingHorizontal: 24, paddingTop: 16 },
        ] as any}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={32}
      >

        <HeroCarousel />
        <CategoryGrid activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
        
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome back, {userName}</Text>
        </View>

        {/* Search Bar with Location Picker */}
        <View style={styles.homeSearchContainer}>
          <View style={styles.homeSearchBox}>
            <TouchableOpacity style={styles.homeLocationDropdown} activeOpacity={0.7} onPress={() => setShowLocationPicker(true)}>
              <Ionicons name="location-outline" size={18} color={Neutrals.gray600} />
              <Text style={styles.homeLocationText}>{city}</Text>
              <Ionicons name="chevron-down" size={14} color={Neutrals.gray400} />
            </TouchableOpacity>

            {Platform.OS === 'web' ? (
              <View style={styles.homeSearchInputWrapper}>
                <Ionicons name="search-outline" size={18} color={Neutrals.gray500} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  onSubmitEditing={submitSearch}
                  placeholder="Search properties, localities…"
                  placeholderTextColor={Neutrals.gray500}
                  style={styles.homeSearchInput as any}
                  returnKeyType="search"
                />
              </View>
            ) : (
              <TouchableOpacity style={styles.homeSearchInputWrapper} onPress={() => router.push('/search')} activeOpacity={0.7}>
                <Ionicons name="search-outline" size={18} color={Neutrals.gray500} />
                <Text style={styles.homeSearchPlaceholder}>Search properties, localities…</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.homeSearchBtn} onPress={submitSearch}>
              <Text style={styles.homeSearchBtnText}>Search</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 1. Recent Activity */}
        <RecentActivity />

        <QuickActions />
        {/* 2. Hot Selling Projects */}
        <View style={styles.featuredSection}>
          <SectionHeader title="Hot Selling Projects" onViewAll={() => router.push('/(tabs)/search')} />
          <ResponsiveRail contentContainerStyle={styles.featuredScroll}>
            {hotProperties.map((prop) => (
              <PropertyCard key={prop.id} {...propertyToCardProps(prop)} compact />
            ))}
          </ResponsiveRail>
        </View>

        {/* 3. Projects in Hyderabad */}
        <HotProjects properties={filtered.newProjects} />

        {/* 4. Sell or Rent Properties For Free */}
        <PostPropertyBanner />

        {/* 5. Resale Properties */}
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
        
        {/* 6. Rental */}
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

        {/* 7. Top Developer */}
        <TopDevelopers />

        {/* Secondary Desktop / Utility Sections placed at bottom */}
        <TopLocalities properties={filtered.newProjects} />


        <ServicesStrip />

        {isDesktop && <QuoteSection />}

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
    zIndex: 0,
  },
  logoImage: {
    width: 220,
    height: 60,
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
  homeSearchContainer: {
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 4,
  },
  homeSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Neutrals.white,
    borderRadius: Radius.lg,
    padding: 8,
    paddingLeft: 16,
    width: '100%',
    maxWidth: 560,
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        } as any)
      : {
          elevation: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
        }),
    borderWidth: 1,
    borderColor: Neutrals.border,
  },
  homeLocationDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 16,
    borderRightWidth: 1,
    borderRightColor: Neutrals.gray200,
  },
  homeLocationText: {
    ...Typography.labelLarge,
    fontSize: 15,
    color: Neutrals.obsidian,
  },
  homeSearchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    height: 42,
  },
  homeSearchInput: {
    flex: 1,
    fontSize: 15,
    color: Neutrals.text,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  homeSearchPlaceholder: {
    ...Typography.bodyMedium,
    color: Neutrals.gray400,
  },
  homeSearchBtn: {
    backgroundColor: GoldSystem.primaryGold,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: Radius.md,
  },
  homeSearchBtnText: {
    ...Typography.labelLarge,
    color: Neutrals.obsidian,
  },
});
