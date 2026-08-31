/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

import { Neutrals, GoldSystem } from './design';

export const Colors = {
  light: {
    text: Neutrals.obsidian,
    background: Neutrals.warmIvory,
    backgroundElement: Neutrals.white,
    backgroundSelected: GoldSystem.paleGold,
    textSecondary: Neutrals.gray500,
    primary: GoldSystem.primaryGold,
    border: Neutrals.softBeige,
    card: Neutrals.cream,
  },
  dark: {
    text: Neutrals.warmIvory,
    background: Neutrals.obsidian,
    backgroundElement: Neutrals.charcoal,
    backgroundSelected: Neutrals.deepCharcoal,
    textSecondary: Neutrals.gray400,
    primary: GoldSystem.metallicGold,
    border: Neutrals.charcoal,
    card: Neutrals.charcoal,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
