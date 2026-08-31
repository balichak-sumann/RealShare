import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SectionHeader } from '../ui/SectionHeader';
import { MOCK_DEVELOPERS } from '@/constants/mockData';
import { Neutrals, Typography, Radius, Shadows } from '@/constants/design';

export function TopDevelopers() {
  return (
    <View style={styles.container}>
      <SectionHeader title="Top Developers" onViewAll={() => {}} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {MOCK_DEVELOPERS.map((dev) => (
          <TouchableOpacity key={dev.id} style={styles.devCard} activeOpacity={0.7}>
            <Image source={{ uri: dev.logo }} style={styles.devLogo} />
            <Text style={styles.devName} numberOfLines={1}>{dev.name}</Text>
            <Text style={styles.devInfo}>{dev.info}</Text>
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
