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
  obsidian: '#0A0A1A',
  charcoal: '#12122A',
  deepCharcoal: '#1A1A2E',
  warmIvory: '#FAF8F5',
  cream: '#F5F0E8',
  softBeige: '#EDE8DF',
  white: '#FFFFFF',
  black: '#000000',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: 'rgba(255,255,255,0.5)',
  gray500: 'rgba(255,255,255,0.35)',
  gray600: 'rgba(255,255,255,0.25)',
  gray700: 'rgba(255,255,255,0.15)',
  gray800: 'rgba(255,255,255,0.08)',
  gray900: 'rgba(255,255,255,0.05)',
  
  // Semantic aliases — glass dark theme
  surface: 'rgba(255,255,255,0.07)',
  background: '#0A0A1A',
  border: 'rgba(255,255,255,0.12)',
  text: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.6)',
  ruby: '#EF4444',
};

export const Glass = {
  card: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
  } as any,
  cardStrong: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backdropFilter: 'blur(30px)',
    WebkitBackdropFilter: 'blur(30px)',
  } as any,
  heroCard: {
    backgroundColor: 'rgba(212,175,55,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.25)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
  } as any,
  overlay: 'rgba(10,10,26,0.5)',
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
  headlineLarge: { fontSize: 22, fontWeight: '700' as const },
  headlineMedium: { fontSize: 18, fontWeight: '600' as const },
  bodyLarge: { fontSize: 16, fontWeight: '400' as const },
  bodyMedium: { fontSize: 14, fontWeight: '400' as const },
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

export const Shadows = {
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  strong: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 32,
    elevation: 12,
  },
  gold: {
    shadowColor: GoldSystem.metallicGold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 6,
  },
};
