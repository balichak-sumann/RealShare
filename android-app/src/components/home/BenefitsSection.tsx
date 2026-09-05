import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Neutrals, GoldSystem, Typography } from '@/constants/design';

export function BenefitsSection() {
  const benefits = [
    {
      id: 'b1',
      title: 'Premium Assets',
      description: 'Access Grade-A commercial properties and luxury holiday homes previously reserved for institutional investors.',
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&fit=crop'
    },
    {
      id: 'b2',
      title: 'Passive Income',
      description: 'Earn steady, hassle-free rental yields distributed directly to your account every single month.',
      image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&fit=crop'
    },
    {
      id: 'b3',
      title: 'Fully Managed',
      description: 'Our expert team handles all tenant sourcing, property maintenance, and legal compliance.',
      image: 'https://images.unsplash.com/photo-1560520031-3a4df400523e?w=600&fit=crop'
    }
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Why Fractional Real Estate?</Text>
      
      <View style={styles.grid}>
        {benefits.map((item) => (
          <View key={item.id} style={styles.card}>
            <Image source={{ uri: item.image }} style={styles.image} />
            <View style={styles.content}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 80,
    paddingHorizontal: 24,
    backgroundColor: Neutrals.surface,
  },
  sectionTitle: {
    ...Typography.displayMedium,
    color: Neutrals.obsidian,
    textAlign: 'center',
    marginBottom: 60,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    flexWrap: 'wrap',
  },
  card: {
    flex: 1,
    minWidth: 300,
    maxWidth: 400,
    backgroundColor: Neutrals.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 24,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 220,
    backgroundColor: Neutrals.gray200,
  },
  content: {
    padding: 24,
  },
  title: {
    ...Typography.headlineMedium,
    color: Neutrals.charcoal,
    marginBottom: 12,
  },
  description: {
    ...Typography.bodyMedium,
    color: Neutrals.gray600,
    lineHeight: 22,
  },
});
