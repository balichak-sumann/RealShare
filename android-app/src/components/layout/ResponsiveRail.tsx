import React from 'react';
import { View, ScrollView, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useResponsive } from '@/hooks/useResponsive';

/**
 * A horizontal card rail that becomes a wrapping grid on desktop web.
 *
 * On native and narrow web this renders the exact same horizontal ScrollView
 * the app has always used. On desktop web, where a horizontal scroller inside a
 * 1240px frame wastes the space and feels mobile-ported, the same children are
 * laid out as a wrapping grid instead.
 */
interface ResponsiveRailProps {
  children: React.ReactNode;
  /** Applied to the ScrollView's contentContainerStyle on mobile. */
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Extra style for the desktop grid container. */
  gridStyle?: StyleProp<ViewStyle>;
}

export function ResponsiveRail({
  children,
  contentContainerStyle,
}: ResponsiveRailProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={contentContainerStyle}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 18,
    paddingHorizontal: 24,
    paddingTop: 4,
  },
});

export default ResponsiveRail;
