import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SectionHeader } from '../ui/SectionHeader';
import { useRouter } from 'expo-router';
import { Neutrals, Typography, Radius, Shadows } from '@/constants/design';
import { ResponsiveRail } from '../layout/ResponsiveRail';
import { useResponsive } from '@/hooks/useResponsive';

const PLACEHOLDER_LOGO = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=120&h=120&fit=crop';

export function TopDevelopers() {
  const router = useRouter();
  const { isDesktop } = useResponsive();
  const [developers, setDevelopers] = useState<any[]>([]);

  useEffect(() => {
    const fetchDevelopers = async () => {
      try {
        const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com'}/api/developers`);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setDevelopers(data.slice(0, 10));
          return;
        }
      } catch (err) {}
      
      // Fallback to mock data if API fails or is empty
      setDevelopers([
        { id: '1', name: 'DLF Group', rating: 4.8, _count: { properties: 12 }, logo_url: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=120&h=120&fit=crop' },
        { id: '2', name: 'Prestige', rating: 4.6, _count: { properties: 8 }, logo_url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=120&h=120&fit=crop' },
        { id: '3', name: 'Lodha', rating: 4.9, _count: { properties: 15 }, logo_url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=120&h=120&fit=crop' },
        { id: '4', name: 'Godrej', rating: 4.7, _count: { properties: 10 }, logo_url: 'https://images.unsplash.com/photo-1600607687920-4e2a09be15ea?w=120&h=120&fit=crop' },
      ]);
    };
    fetchDevelopers();
  }, []);

  if (developers.length === 0) return null;

  return (
    <View style={styles.container}>
      <SectionHeader title="Top Developers" onViewAll={() => router.push('/(tabs)/search')} />
      {isDesktop ? (
        <View style={styles.desktopGrid}>
          {developers.map((dev) => (
            <TouchableOpacity key={dev.id} style={[styles.devCard, styles.devCardDesktop, { flex: 1, minWidth: 200 }]} activeOpacity={0.7}>
              <Image source={{ uri: dev.logo_url || PLACEHOLDER_LOGO }} style={[styles.devLogo, styles.devLogoDesktop]} />
              <Text style={[styles.devName, styles.devNameDesktop]} numberOfLines={1}>{dev.name}</Text>
              <Text style={[styles.devInfo, styles.devInfoDesktop]}>
                {dev._count?.properties ?? 0} Projects · ⭐ {Number(dev.rating).toFixed(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <ResponsiveRail contentContainerStyle={styles.scrollContent}>
          {developers.map((dev) => (
            <TouchableOpacity key={dev.id} style={styles.devCard} activeOpacity={0.7}>
              <Image source={{ uri: dev.logo_url || PLACEHOLDER_LOGO }} style={styles.devLogo} />
              <Text style={styles.devName} numberOfLines={1}>{dev.name}</Text>
              <Text style={styles.devInfo}>
                {dev._count?.properties ?? 0} Projects · ⭐ {Number(dev.rating).toFixed(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ResponsiveRail>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  desktopGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    paddingHorizontal: 24,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  devCard: {
    width: 110,
    backgroundColor: Neutrals.surface,
    padding: 12,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Neutrals.border,
    alignItems: 'center',
    ...Shadows.soft,
  },
  devCardDesktop: {
    width: 220,
    padding: 24,
    borderRadius: Radius.xl,
  },
  devLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Neutrals.gray200,
  },
  devLogoDesktop: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  devName: {
    ...Typography.caption,
    fontWeight: '700',
    color: Neutrals.obsidian,
    textAlign: 'center',
    marginBottom: 2,
  },
  devNameDesktop: {
    ...Typography.bodyLarge,
    fontWeight: '800',
    marginBottom: 6,
  },
  devInfo: {
    fontSize: 10,
    color: Neutrals.gray500,
    textAlign: 'center',
  },
  devInfoDesktop: {
    fontSize: 13,
  },
});
