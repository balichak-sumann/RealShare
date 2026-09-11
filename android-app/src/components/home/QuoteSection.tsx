import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Neutrals, GoldSystem, Typography } from '@/constants/design';

export function QuoteSection() {
  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.quoteMark}>"</Text>
        <Text style={styles.quoteText}>
          Ninety percent of all millionaires become so through owning real estate.
        </Text>
        <Text style={styles.author}>— Andrew Carnegie</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Neutrals.warmIvory,
    paddingVertical: 16,
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    maxWidth: 800,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  quoteMark: {
    fontSize: 40,
    lineHeight: 40,
    fontFamily: 'Georgia',
    color: GoldSystem.warmGold,
    marginBottom: -10,
    opacity: 0.3,
  },
  quoteText: {
    ...Typography.headlineSmall,
    color: Neutrals.obsidian,
    textAlign: 'center',
    fontStyle: 'italic',
    fontWeight: '600',
    lineHeight: 32,
    marginBottom: 12,
  },
  author: {
    ...Typography.labelMedium,
    color: Neutrals.gray500,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: '600',
  }
});
