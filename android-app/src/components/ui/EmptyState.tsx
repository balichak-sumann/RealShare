import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Neutrals, Typography } from '@/constants/design';

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle: string;
  actionTitle?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, subtitle, actionTitle, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {actionTitle && onAction && (
        <View style={styles.actionBtn}>
          <Text style={styles.actionText} onPress={onAction}>{actionTitle}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.bodyMedium,
    color: Neutrals.gray500,
    textAlign: 'center',
    marginBottom: 24,
  },
  actionBtn: {
    backgroundColor: Neutrals.obsidian,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionText: {
    ...Typography.labelMedium,
    color: Neutrals.surface,
  },
});
