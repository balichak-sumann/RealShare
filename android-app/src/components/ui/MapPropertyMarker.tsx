import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';

interface MapPropertyMarkerProps {
  price: string;
  isSelected?: boolean;
  onPress?: () => void;
}

export function MapPropertyMarker({ price, isSelected = false, onPress }: MapPropertyMarkerProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[
        styles.container,
        isSelected && styles.selectedContainer
      ]}
    >
      <View style={[styles.bubble, isSelected && styles.selectedBubble]}>
        <Text style={[styles.priceText, isSelected && styles.selectedPriceText]}>
          {price}
        </Text>
      </View>
      <View style={[styles.triangle, isSelected && styles.selectedTriangle]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedContainer: {
    transform: [{ scale: 1.1 }],
    zIndex: 10,
  },
  bubble: {
    backgroundColor: Neutrals.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: GoldSystem.warmGold,
    ...Shadows.soft,
  },
  selectedBubble: {
    backgroundColor: GoldSystem.primaryGold,
    borderColor: GoldSystem.primaryGold,
    ...Shadows.medium,
  },
  priceText: {
    ...Typography.labelMedium,
    color: Neutrals.obsidian,
    fontWeight: '700',
  },
  selectedPriceText: {
    color: Neutrals.surface,
  },
  triangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: GoldSystem.warmGold,
    transform: [{ rotate: '180deg' }],
  },
  selectedTriangle: {
    borderBottomColor: GoldSystem.primaryGold,
  },
});
