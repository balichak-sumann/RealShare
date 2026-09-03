import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SectionHeader } from '../ui/SectionHeader';
import { useRouter } from 'expo-router';
import { Neutrals, Typography, Radius, Shadows } from '@/constants/design';

const PLACEHOLDER_LOGO = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=120&h=120&fit=crop';

export function TopDevelopers() {
  const router = useRouter();
  const [developers, setDevelopers] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com'}/api/developers`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setDevelopers(data.slice(0, 10));
      })
      .catch(() => {});
  }, []);

  if (developers.length === 0) return null;

  return (
    <View style={styles.container}>
      <SectionHeader title="Top Developers" onViewAll={() => router.push('/(tabs)/search')} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {developers.map((dev) => (
          <TouchableOpacity key={dev.id} style={styles.devCard} activeOpacity={0.7}>
            <Image source={{ uri: dev.logo_url || PLACEHOLDER_LOGO }} style={styles.devLogo} />
            <Text style={styles.devName} numberOfLines={1}>{dev.name}</Text>
            <Text style={styles.devInfo}>
              {dev._count?.properties ?? 0} Projects · ⭐ {Number(dev.rating).toFixed(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
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
  devLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Neutrals.gray200,
  },
  devName: {
    ...Typography.caption,
    fontWeight: '700',
    color: Neutrals.obsidian,
    textAlign: 'center',
    marginBottom: 2,
  },
  devInfo: {
    fontSize: 10,
    color: Neutrals.gray500,
    textAlign: 'center',
  },
});
