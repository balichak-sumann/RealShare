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
  /** Columns on desktop (>=1100px). Defaults to 3. */
  desktopColumns?: number;
  /** Columns on tablet (768-1099px). Defaults to 2. */
  tabletColumns?: number;
  style?: StyleProp<ViewStyle>;
}

export function ResponsiveGrid({
  children,
  desktopColumns = 3,
  tabletColumns = 2,
  style,
}: ResponsiveGridProps) {
  const { isDesktop, isTablet } = useResponsive();

  if (!isDesktop && !isTablet) {
    return <>{children}</>;
  }

  const columns = isDesktop ? desktopColumns : tabletColumns;
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
