import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Neutrals, GoldSystem, Typography } from '@/constants/design';
import { useRouter } from 'expo-router';

interface SectionHeaderProps {
  title: string;
  onViewAll?: () => void;
  viewAllText?: string;
}

export function SectionHeader({ title, onViewAll, viewAllText = 'View All' }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {onViewAll && (
        <TouchableOpacity onPress={onViewAll} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.viewAll}>{viewAllText} ➔</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
    marginTop: 32,
  },
  title: {
    ...Typography.displayMedium,
    color: Neutrals.obsidian,
  },
  viewAll: {
    ...Typography.labelMedium,
    color: GoldSystem.primaryGold,
  },
});
