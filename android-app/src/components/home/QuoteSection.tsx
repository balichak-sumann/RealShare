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
    paddingVertical: 80,
    marginTop: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    maxWidth: 800,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  quoteMark: {
    fontSize: 80,
    lineHeight: 80,
    fontFamily: 'Georgia',
    color: GoldSystem.warmGold,
    marginBottom: -20,
    opacity: 0.5,
  },
  quoteText: {
    ...Typography.displayMedium,
    color: Neutrals.charcoal,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 44,
    marginBottom: 24,
  },
  author: {
    ...Typography.bodyLarge,
    color: Neutrals.gray500,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: '600',
  }
});
