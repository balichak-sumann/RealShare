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
        {QUICK_ACTIONS.map((action, index) => {
          // Window pane border logic
          const isTopRow = index < 2;
          const isLeftCol = index % 2 === 0;
          
          return (
            <TouchableOpacity
              key={action.id}
              style={[
                styles.actionItem,
                isDesktop && styles.actionItemDesktop,
                isTopRow && styles.borderBottom,
                isLeftCol && styles.borderRight
              ]}
              onPress={() => router.push(action.route as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: `${ACTION_COLORS[action.id]}18` }]}>
                <Ionicons
                  name={action.icon as IoniconName}
                  size={28}
                  color={ACTION_COLORS[action.id] || GoldSystem.primaryGold}
                />
              </View>
              <Text style={[styles.title, isDesktop && styles.titleDesktop]}>{action.title}</Text>
              <Text style={[styles.subtitle, isDesktop && styles.subtitleDesktop]}>{action.subtitle}</Text>
            </TouchableOpacity>
          );
        })}
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 1,
    borderColor: Neutrals.border,
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 12px 40px rgba(0,0,0,0.08)',
        } as any)
      : Shadows.medium),
  },
  mainCardDesktop: {
    maxWidth: 900,
    alignSelf: 'center',
    marginTop: 16,
  },
  actionItem: {
    width: '50%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: Neutrals.white,
  },
  actionItemDesktop: {
    paddingVertical: 40,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: Neutrals.gray100,
  },
  borderRight: {
    borderRightWidth: 1,
    borderRightColor: Neutrals.gray100,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    ...Typography.labelLarge,
    color: Neutrals.obsidian,
    marginBottom: 6,
    textAlign: 'center',
  },
  titleDesktop: {
    fontSize: 18,
  },
  subtitle: {
    ...Typography.caption,
    color: Neutrals.gray500,
    textAlign: 'center',
    lineHeight: 18,
  },
  subtitleDesktop: {
    fontSize: 14,
  },
});
