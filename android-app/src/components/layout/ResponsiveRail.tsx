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
 *
 * Note: the desktop branch described above was declared but never implemented —
 * the component imported useResponsive and defined a grid style, then returned
 * a ScrollView unconditionally, so every rail stayed a horizontal scroller at
 * every width. It is implemented here.
 *
 * The children are fixed-width cards (280/320px property and locality cards,
 * 110px developer cards), so they tile correctly in a wrapping flex row without
 * needing column maths.
 */
interface ResponsiveRailProps {
  children: React.ReactNode;
  /** Applied to the ScrollView's contentContainerStyle on mobile. */
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Extra style for the desktop grid container. */
  gridStyle?: StyleProp<ViewStyle>;
  /**
   * Set to keep a horizontal rail at every width — for rails whose whole point
   * is the sideways swipe rather than showing everything at once.
   */
  alwaysScroll?: boolean;
}

export function ResponsiveRail({
  children,
  contentContainerStyle,
  gridStyle,
  alwaysScroll = false,
}: ResponsiveRailProps) {
  const { isDesktop } = useResponsive();

  // isDesktop is web-only and false on every native device, so the native app
  // keeps the horizontal rail it has always had.
  if (isDesktop && !alwaysScroll) {
    return <View style={[styles.grid, gridStyle]}>{children}</View>;
  }

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
