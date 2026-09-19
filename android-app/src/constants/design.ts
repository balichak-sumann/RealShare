export const GoldSystem = {
  primaryGold: '#C5A55A',
  metallicGold: '#D4AF37',
  warmGold: '#CDA349',
  darkGold: '#A88B2E',
  softGold: '#E8D5A3',
  paleGold: '#F5ECD7',
  goldGradient: ['#D4AF37', '#C5A55A', '#E8D5A3'] as readonly [string, string, ...string[]],
};

export const Neutrals = {
  obsidian: '#1A1A2E',
  charcoal: '#2D2D3F',
  deepCharcoal: '#16213E',
  warmIvory: '#FAF8F5',
  cream: '#F5F0E8',
  softBeige: '#EDE8DF',
  white: '#FFFFFF',
  black: '#000000',
  gray100: '#F3F4F6',
  gray50: '#F9FAFB',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  
  // Semantic aliases
  surface: '#FFFFFF',
  background: '#FAF8F5', // warmIvory
  border: '#E5E7EB',
  text: '#111827',
  textSecondary: '#6B7280',
  ruby: '#EF4444',
};

export const Semantic = {
  emerald: '#10B981',
  ruby: '#EF4444',
  sapphire: '#3B82F6',
  amber: '#F59E0B',
};

export const Typography = {
  displayLarge: { fontSize: 32, fontWeight: '800' as const },
  displayMedium: { fontSize: 26, fontWeight: '700' as const },
  displaySmall: { fontSize: 20, fontWeight: '700' as const },
  headlineLarge: { fontSize: 22, fontWeight: '700' as const },
  headlineMedium: { fontSize: 18, fontWeight: '600' as const },
  headlineSmall: { fontSize: 16, fontWeight: '600' as const },
  titleLarge: { fontSize: 18, fontWeight: '700' as const },
  titleMedium: { fontSize: 16, fontWeight: '600' as const },
  bodyLarge: { fontSize: 16, fontWeight: '400' as const },
  bodyMedium: { fontSize: 14, fontWeight: '400' as const },
  bodySmall: { fontSize: 12, fontWeight: '400' as const },
  labelLarge: { fontSize: 14, fontWeight: '600' as const },
  labelMedium: { fontSize: 12, fontWeight: '600' as const },
  labelSmall: { fontSize: 11, fontWeight: '500' as const },
  caption: { fontSize: 10, fontWeight: '500' as const },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  massive: 48,
  giant: 64,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 999,
};

import { Platform } from 'react-native';

export const Shadows = {
  soft: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
    android: { shadowColor: '#000', elevation: 2 },
    default: { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  }),
  medium: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16 },
    android: { shadowColor: '#000', elevation: 4 },
    default: { boxShadow: '0 4px 16px rgba(0,0,0,0.08)' },
  }),
  md: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16 },
    android: { shadowColor: '#000', elevation: 4 },
    default: { boxShadow: '0 4px 16px rgba(0,0,0,0.08)' },
  }),
  strong: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 32 },
    android: { shadowColor: '#000', elevation: 8 },
    default: { boxShadow: '0 8px 32px rgba(0,0,0,0.12)' },
  }),
  gold: Platform.select({
    ios: { shadowColor: GoldSystem.metallicGold, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12 },
    android: { shadowColor: GoldSystem.metallicGold, elevation: 8 },
    default: { boxShadow: '0 4px 16px rgba(212, 175, 55, 0.3)' },
  }),
};
