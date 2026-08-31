import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Neutrals, GoldSystem, Typography, Radius } from '@/constants/design';

interface AIChatBubbleProps {
  message: string;
  isUser?: boolean;
}

export function AIChatBubble({ message, isUser = false }: AIChatBubbleProps) {
  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.aiContainer]}>
      {!isUser && <Text style={styles.aiIcon}>✦</Text>}
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
        <Text style={[styles.text, isUser ? styles.userText : styles.aiText]}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '85%',
    alignItems: 'flex-end',
  },
  userContainer: {
    alignSelf: 'flex-end',
  },
  aiContainer: {
    alignSelf: 'flex-start',
  },
  aiIcon: {
    fontSize: 20,
    color: GoldSystem.primaryGold,
    marginRight: 8,
    marginBottom: 4,
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: Radius.lg,
  },
  userBubble: {
    backgroundColor: GoldSystem.primaryGold,
    borderBottomRightRadius: Radius.sm,
  },
  aiBubble: {
    backgroundColor: Neutrals.obsidian,
    borderBottomLeftRadius: Radius.sm,
  },
  text: {
    ...Typography.bodyMedium,
    lineHeight: 22,
  },
  userText: {
    color: Neutrals.obsidian,
  },
  aiText: {
    color: Neutrals.surface,
  },
});
