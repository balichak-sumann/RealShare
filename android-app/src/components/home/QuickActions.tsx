import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { QUICK_ACTIONS } from '@/constants/uiConstants';
import { Neutrals, GoldSystem, Radius, Typography, Shadows } from '@/constants/design';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const ACTION_COLORS: Record<string, string> = {
  'q1': '#0EA5E9', // Sell - blue
  'q2': '#10B981', // Services - green
  'q3': '#8B5CF6', // Investment - purple
  'q4': '#F59E0B', // Market Insights - amber
};

export function QuickActions() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {QUICK_ACTIONS.map((action) => (
        <TouchableOpacity
          key={action.id}
          style={styles.actionCard}
          onPress={() => router.push(action.route as any)}
          activeOpacity={0.75}
        >
          <View style={[styles.iconContainer, { backgroundColor: `${ACTION_COLORS[action.id]}18` }]}>
            <Ionicons
              name={action.icon as IoniconName}
              size={22}
              color={ACTION_COLORS[action.id] || GoldSystem.primaryGold}
            />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>{action.title}</Text>
            <Text style={styles.subtitle}>{action.subtitle}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Neutrals.gray300} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginTop: 24,
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Neutrals.surface,
    padding: 12,
    borderRadius: Radius.lg,
    marginBottom: 16,
    ...Shadows.soft,
    borderWidth: 1,
    borderColor: Neutrals.border,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...Typography.labelMedium,
    color: Neutrals.obsidian,
  },
  subtitle: {
    ...Typography.caption,
    color: Neutrals.textSecondary,
    marginTop: 2,
  },
});
