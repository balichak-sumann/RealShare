import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';
interface ComparisonTableProps {
  properties: any[];
}

export function ComparisonTable({ properties }: ComparisonTableProps) {
  if (properties.length === 0) return null;

  // Attributes to compare
  const attributes = [
    { label: 'Price', key: 'price' },
    { label: 'BHK', key: 'bhk' },
    { label: 'Area', key: 'area', suffix: ' sq.ft' },
    { label: 'Location', key: 'location' },
    { label: 'Possession', key: 'possession' },
    { label: 'Score', key: 'score' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView horizontal bounces={false} showsHorizontalScrollIndicator={false}>
        <View style={styles.table}>
          {/* Header Row (Images) */}
          <View style={styles.row}>
            <View style={[styles.cell, styles.headerCell]} />
            {properties.map((p, idx) => (
              <View key={`header-${idx}`} style={[styles.cell, styles.propertyCell]}>
                <Image source={{ uri: p.images[0] }} style={styles.propertyImage} />
                <Text style={styles.propertyTitle} numberOfLines={2}>{p.title}</Text>
              </View>
            ))}
          </View>

          {/* Data Rows */}
          {attributes.map((attr, attrIdx) => (
            <View key={`attr-${attrIdx}`} style={styles.row}>
              <View style={[styles.cell, styles.headerCell]}>
                <Text style={styles.attrLabel}>{attr.label}</Text>
              </View>
              {properties.map((p, pIdx) => {
                const isWinner = attr.key === 'score' && (p as any)[attr.key] === Math.max(...properties.map(x => (x as any).score));
                return (
                  <View key={`val-${pIdx}`} style={[styles.cell, styles.propertyCell, isWinner && styles.winnerCell]}>
                    <Text style={[styles.attrValue, isWinner && styles.winnerValue]}>
                      {(p as any)[attr.key]}{attr.suffix || ''}
                    </Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Neutrals.surface,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Neutrals.border,
    ...Shadows.soft,
  },
  table: {
    flexDirection: 'column',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Neutrals.border,
  },
  cell: {
    padding: 16,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: Neutrals.border,
  },
  headerCell: {
    width: 100,
    backgroundColor: Neutrals.gray100,
  },
  propertyCell: {
    width: 160,
    alignItems: 'center',
  },
  propertyImage: {
    width: 120,
    height: 80,
    borderRadius: Radius.md,
    marginBottom: 8,
  },
  propertyTitle: {
    ...Typography.labelMedium,
    color: Neutrals.obsidian,
    textAlign: 'center',
  },
  attrLabel: {
    ...Typography.caption,
    color: Neutrals.gray600,
    fontWeight: '700',
  },
  attrValue: {
    ...Typography.bodyMedium,
    color: Neutrals.obsidian,
    textAlign: 'center',
  },
  winnerCell: {
    backgroundColor: GoldSystem.paleGold,
  },
  winnerValue: {
    color: GoldSystem.darkGold,
    fontWeight: '700',
  },
});
