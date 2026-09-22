import { Platform, useWindowDimensions } from 'react-native';

/**
 * Responsive system for RealShare.
 *
 * There are two separate questions this hook answers, and keeping them apart is
 * what makes it safe to use everywhere:
 *
 *  1. WHICH LAYOUT?  `isMobile` / `isTablet` / `isDesktop` / `isFramed` decide
 *     between the phone layout and the wide web layout (desktop nav, footer,
 *     multi-column frames). These are WEB-ONLY: on native they are hard-locked
 *     to the phone layout exactly as before, so no device can accidentally be
 *     served the web chrome.
 *
 *  2. HOW BIG IS THE SCREEN?  `deviceSize`, the `is*` size flags and `select()`
 *     report the real viewport on EVERY platform, native included. A 360px
 *     Android phone, a 430px Pro Max, an unfolded foldable and a 1280px Android
 *     tablet all render "the phone layout", but they should not render it with
 *     identical padding, type sizes and column counts. That is what these are
 *     for, and why they are not gated on Platform.
 */

export const Breakpoints = {
  /** below this = compact phone (iPhone SE, small/older Android) */
  smallPhone: 360,
  /** below this = standard phone (iPhone 13/14/15, most Android) */
  phone: 414,
  /** below this = large phone (Plus / Pro Max, folded foldable) */
  largePhone: 600,
  /** below this = unfolded foldable or small tablet held in portrait */
  foldable: 768,
  /** below this = phone layout on web (unchanged) */
  mobile: 768,
  /** below this = tablet (iPad portrait through iPad Pro portrait) */
  tablet: 1024,
  /** at/above this = full desktop layout on web (unchanged) */
  desktop: 1100,
  /** below this = laptop; at/above = extra-wide desktop */
  wide: 1440,
};

export const FrameWidth = {
  /** centered phone-frame width used by most routes on desktop web */
  phone: 440,
  /** max content width for routes that go wide on desktop web */
  wide: 1240,
};

/**
 * Ordered smallest to largest. `select()` resolves mobile-first: a value set at
 * one tier applies to that tier and every larger one until another tier
 * overrides it.
 */
export const DEVICE_SIZES = [
  'small-phone',
  'phone',
  'large-phone',
  'foldable',
  'tablet',
  'laptop',
  'desktop',
  'wide',
] as const;

export type DeviceSize = (typeof DEVICE_SIZES)[number];

export type ResponsiveValues<T> = Partial<Record<DeviceSize, T>> & { default: T };

function resolveDeviceSize(width: number): DeviceSize {
  if (width < Breakpoints.smallPhone) return 'small-phone';
  if (width < Breakpoints.phone) return 'phone';
  if (width < Breakpoints.largePhone) return 'large-phone';
  if (width < Breakpoints.foldable) return 'foldable';
  if (width < Breakpoints.tablet) return 'tablet';
  if (width < 1280) return 'laptop';
  if (width < Breakpoints.wide) return 'desktop';
  return 'wide';
}

/** Mobile-first lookup: walk down from the current tier to the smallest. */
function selectFor<T>(size: DeviceSize, values: ResponsiveValues<T>): T {
  for (let i = DEVICE_SIZES.indexOf(size); i >= 0; i--) {
    const candidate = values[DEVICE_SIZES[i]];
    if (candidate !== undefined) return candidate;
  }
  return values.default;
}

export interface Responsive {
  isWeb: boolean;

  // --- layout tier (web-only; always phone-layout on native) ---
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  /** true when we should render a centered frame rather than full-bleed */
  isFramed: boolean;

  // --- real screen size (accurate on native too) ---
  /** the device bucket this viewport falls into */
  deviceSize: DeviceSize;
  /** < 360px: iPhone SE and small Android — the tightest case to design for */
  isSmallPhone: boolean;
  /** any handset-width viewport, native or web */
  isPhoneWidth: boolean;
  /** 414-599px: Plus / Pro Max handsets */
  isLargePhone: boolean;
  /** 600-767px: unfolded foldables, small tablets in portrait */
  isFoldable: boolean;
  /** 768-1023px: tablet portrait */
  isTabletWidth: boolean;
  /** >= 1440px: extra-wide desktop */
  isWide: boolean;
  isLandscape: boolean;

  /**
   * Pick a value for the current screen, mobile-first:
   *   select({ default: 16, 'large-phone': 20, tablet: 28 })
   */
  select: <T>(values: ResponsiveValues<T>) => T;

  width: number;
  height: number;
}

export function useResponsive(): Responsive {
  const { width, height } = useWindowDimensions();

  const deviceSize = resolveDeviceSize(width);
  const select = <T,>(values: ResponsiveValues<T>): T => selectFor(deviceSize, values);

  // Size facts are platform-independent: an Android tablet really is tablet-sized.
  const sizeFacts = {
    deviceSize,
    isSmallPhone: width < Breakpoints.smallPhone,
    isPhoneWidth: width < Breakpoints.largePhone,
    isLargePhone: width >= Breakpoints.phone && width < Breakpoints.largePhone,
    isFoldable: width >= Breakpoints.largePhone && width < Breakpoints.foldable,
    isTabletWidth: width >= Breakpoints.foldable && width < Breakpoints.tablet,
    isWide: width >= Breakpoints.wide,
    isLandscape: width > height,
    select,
    width,
    height,
  };

  // Native: hard-locked to the mobile LAYOUT, exactly as before. Nothing below
  // this line changes which chrome a device gets — only how big things are.
  if (Platform.OS !== 'web') {
    return {
      isWeb: false,
      isMobile: true,
      isTablet: false,
      isDesktop: false,
      isFramed: false,
      ...sizeFacts,
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
    ...sizeFacts,
  };
}

/**
 * Column count for card grids. Returns 1 on native and on narrow web, so
 * existing horizontal-scroll / single-column layouts are preserved.
 */
export function useGridColumns(max: number = 3): number {
  const { isWeb, isTablet, isDesktop, isWide, isFoldable } = useResponsive();
  if (isDesktop) return isWide ? max : Math.min(max, 3);
  if (isTablet) return Math.min(2, max);
  // An unfolded foldable / small tablet in portrait has room for two cards.
  // Gated on web on purpose: the native app still renders one column on every
  // device, so this cannot alter an already-shipped native screen.
  if (isWeb && isFoldable) return Math.min(2, max);
  return 1;
}
