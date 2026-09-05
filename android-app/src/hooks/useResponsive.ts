import { Platform, useWindowDimensions } from 'react-native';

/**
 * Responsive system for RealShare.
 *
 * IMPORTANT: On native (iOS/Android) this ALWAYS reports mobile.
 * Every consumer therefore renders exactly the phone layout it always has.
 * Only the web build ever sees tablet/desktop values.
 */

export const Breakpoints = {
  /** below this = phone layout */
  mobile: 768,
  /** at/above this = full desktop layout */
  desktop: 1100,
};

export const FrameWidth = {
  /** centered phone-frame width used by most routes on desktop web */
  phone: 440,
  /** max content width for routes that go wide on desktop web */
  wide: 1240,
};

export interface Responsive {
  isWeb: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  /** true when we should render a centered frame rather than full-bleed */
  isFramed: boolean;
  width: number;
  height: number;
}

export function useResponsive(): Responsive {
  const { width, height } = useWindowDimensions();

  // Native: hard-locked to the mobile layout. Nothing below this line runs on device.
  if (Platform.OS !== 'web') {
    return {
      isWeb: false,
      isMobile: true,
      isTablet: false,
      isDesktop: false,
      isFramed: false,
      width,
      height,
    };
  }

  const isMobile = width < Breakpoints.mobile;
  const isDesktop = width >= Breakpoints.desktop;
  const isTablet = !isMobile && !isDesktop;

  return {
    isWeb: true,
    isMobile,
    isTablet,
    isDesktop,
    isFramed: !isMobile,
    width,
    height,
  };
}

/**
 * Column count for card grids. Returns 1 on native and on narrow web,
 * so existing horizontal-scroll / single-column layouts are preserved.
 */
export function useGridColumns(max: number = 3): number {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  if (isMobile) return 1;
  if (isTablet) return Math.min(2, max);
  if (isDesktop) return max;
  return 1;
}
