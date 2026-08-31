import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GoldSystem, Neutrals, Radius, Typography } from '@/constants/design';

type BadgeType = 'verified' | 'rera' | 'no-brokerage' | 'ai';

interface TrustBadgeProps {
  type: BadgeType;
}

export function TrustBadge({ type }: TrustBadgeProps) {
  let text = '';
  let icon = '';
  
  switch (type) {
    case 'verified':
      text = 'Verified';
      icon = '✓';
      break;
    case 'rera':
      text = 'RERA';
      icon = '🏛️';
      break;
    case 'no-brokerage':
      text = 'Zero Brokerage';
      icon = '💎';
      break;
    case 'ai':
      text = 'AI Verified';
      icon = '✦';
      break;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GoldSystem.paleGold,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    marginRight: 6,
  },
  icon: {
    fontSize: 10,
    marginRight: 4,
    color: GoldSystem.darkGold,
  },
  text: {
    ...Typography.caption,
    color: GoldSystem.darkGold,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
});
