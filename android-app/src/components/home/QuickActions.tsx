import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { QUICK_ACTIONS } from '@/constants/uiConstants';
import { Neutrals, GoldSystem, Radius, Typography, Shadows } from '@/constants/design';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '@/hooks/useResponsive';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const ACTION_COLORS: Record<string, string> = {
  'q1': '#0EA5E9', // Sell - blue
  'q2': '#10B981', // Services - green
  'q3': '#8B5CF6', // Investment - purple
  'q4': '#F59E0B', // Market Insights - amber
};

export function QuickActions() {
  const router = useRouter();
  const { isDesktop } = useResponsive();

  return (
    <View style={styles.wrapper}>
      <View style={[styles.mainCard, isDesktop && styles.mainCardDesktop]}>
        {QUICK_ACTIONS.map((action, index) => (
          <React.Fragment key={action.id}>
            <TouchableOpacity
              style={[styles.actionItem, isDesktop && styles.actionItemDesktop]}
              onPress={() => router.push(action.route as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: `${ACTION_COLORS[action.id]}18` }]}>
                <Ionicons
                  name={action.icon as IoniconName}
                  size={24}
                  color={ACTION_COLORS[action.id] || GoldSystem.primaryGold}
                />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.title}>{action.title}</Text>
                <Text style={styles.subtitle}>{action.subtitle}</Text>
              </View>
              {!isDesktop && <Ionicons name="chevron-forward" size={18} color={Neutrals.gray300} />}
            </TouchableOpacity>

            {/* Dividers */}
            {isDesktop && index < QUICK_ACTIONS.length - 1 && (
              <View style={styles.verticalDivider} />
            )}
            {!isDesktop && index < QUICK_ACTIONS.length - 1 && (
              <View style={styles.horizontalDivider} />
            )}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  mainCard: {
    backgroundColor: Neutrals.white,
    borderRadius: Radius.xl,
    padding: 12,
    borderWidth: 1,
    borderColor: Neutrals.border,
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
        } as any)
      : Shadows.medium),
  },
  mainCardDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  actionItemDesktop: {
    flex: 1,
    paddingVertical: 0,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...Typography.labelLarge,
    color: Neutrals.obsidian,
    marginBottom: 4,
  },
  subtitle: {
    ...Typography.caption,
    color: Neutrals.gray500,
  },
  verticalDivider: {
    width: 1,
    height: '100%',
    backgroundColor: Neutrals.gray200,
    marginHorizontal: 8,
  },
  horizontalDivider: {
    height: 1,
    backgroundColor: Neutrals.gray100,
    marginVertical: 4,
    marginHorizontal: 8,
  },
});
