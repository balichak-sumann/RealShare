import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { auth } from '@/lib/firebase';
import { useUser } from '@/contexts/UserContext';
import { useLocation } from '@/contexts/LocationContext';
import { Neutrals, GoldSystem, Typography } from '@/constants/design';

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
import { MOCK_PROPERTIES, MOCK_RESALE_PROPERTIES, MOCK_RENTAL_PROPERTIES } from '@/constants/mockData';

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useUser();
  const { city } = useLocation();
  const [userName, setUserName] = useState('Investor');

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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.push('/profile')}>
            <Text style={styles.headerIcon}>☰</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.locationSelector}>
            <Text style={styles.locationIcon}>📍</Text>
            <Text style={styles.locationText}>{city}</Text>
            <Text style={styles.locationDropdown}>▼</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.logoText}>REAL<Text style={styles.logoBold}>SHARE</Text></Text>

        <TouchableOpacity>
          <View style={styles.notificationBadge} />
          <Text style={styles.headerIcon}>🔔</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <HeroCarousel />
        <CategoryGrid />
        
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome back, {userName}</Text>
        </View>

        <QuickActions />
        
        <RecentActivity />
        
        <View style={styles.featuredSection}>
          <SectionHeader title="Featured Properties" onViewAll={() => {}} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredScroll}>
            {MOCK_PROPERTIES.map((prop) => (
              <PropertyCard key={prop.id} {...prop} compact />
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

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Neutrals.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: Neutrals.surface,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 24,
    color: Neutrals.obsidian,
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
    backgroundColor: Neutrals.gray100,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  locationIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  locationText: {
    ...Typography.labelMedium,
    color: Neutrals.obsidian,
  },
  locationDropdown: {
    fontSize: 10,
    marginLeft: 4,
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
