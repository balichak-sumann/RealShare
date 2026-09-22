import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useResponsive } from '@/hooks/useResponsive';

/**
 * Turns a vertical stack of cards into a multi-column grid on wider web viewports.
 *
 * On native and narrow web it renders its children as-is (a plain fragment), so
 * the existing single-column phone list is byte-for-byte what it always was.
 */
interface ResponsiveGridProps {
  children: React.ReactNode;
  /** Columns on desktop (1100-1439px). Defaults to 3. */
  desktopColumns?: number;
  /** Columns on tablet (768-1099px). Defaults to 2. */
  tabletColumns?: number;
  /** Columns on extra-wide screens (>=1440px). Defaults to desktopColumns + 1. */
  wideColumns?: number;
  /** Columns on an unfolded foldable / small tablet in portrait (600-767px). Defaults to 2. */
  foldableColumns?: number;
  style?: StyleProp<ViewStyle>;
}

export function ResponsiveGrid({
  children,
  desktopColumns = 3,
  tabletColumns = 2,
  wideColumns,
  foldableColumns = 2,
  style,
}: ResponsiveGridProps) {
  const { isDesktop, isTablet, isWide, isFoldable, isWeb } = useResponsive();

  // An unfolded foldable / small tablet in portrait is still "mobile" by layout
  // tier but has room for two cards. Web-only, so no native screen changes.
  const useFoldableGrid = isWeb && isFoldable;

  if (!isDesktop && !isTablet && !useFoldableGrid) {
    return <>{children}</>;
  }

  const columns = isDesktop
    ? isWide
      ? wideColumns ?? desktopColumns + 1
      : desktopColumns
    : isTablet
      ? tabletColumns
      : foldableColumns;
  const items = React.Children.toArray(children).filter(Boolean);

  return (
    <View style={[styles.grid, style]}>
      {items.map((child, i) => (
        <View
          key={(child as any)?.key ?? i}
          style={[styles.cell, { width: `${100 / columns}%` }]}
        >
          {child}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -9,
    // fill the parent even when the parent centres its children
    alignSelf: 'stretch',
    width: '100%',
  },
  cell: {
    paddingHorizontal: 9,
  },
});

export default ResponsiveGrid;
