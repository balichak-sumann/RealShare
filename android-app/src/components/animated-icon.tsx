import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as SplashScreen from 'expo-splash-screen';
import { useState, useEffect, useCallback } from 'react';
import { useWindowDimensions, StyleSheet, View, Platform, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withSequence,
  Easing,
  runOnJS,
  interpolate,
  Extrapolation,
  SharedValue,
  Keyframe,
} from 'react-native-reanimated';

import { GoldSystem, Neutrals } from '@/constants/design';

// ═════════════════════════════════════════════════════════════════
//  Splash-complete signaling (module-level) — HARD CONTRACT.
//  The home header logo (src/app/(tabs)/index.tsx) stays hidden until
//  _signal() fires, so the flying logo appears to "land" in the header.
// ═════════════════════════════════════════════════════════════════
let _done = false;
const _cbs: (() => void)[] = [];

export const isSplashComplete = () => _done;
export function onSplashComplete(fn: () => void) {
  if (_done) fn();
  else _cbs.push(fn);
}
function _signal() {
  if (_done) return;
  _done = true;
  _cbs.splice(0).forEach((f) => f());
}

// ═════════════════════════════════════════════════════════════════
//  Tunables — adjust the feel here during live review
// ═════════════════════════════════════════════════════════════════
const HDR_PAD = Platform.OS === 'android' ? 40 : 50;
const HDR_CY = HDR_PAD + 24;
const LOGO_W = 220;
const LOGO_H = 200;
const END_SCL = 0.25;

const CHIP = 104;      // icon chip diameter (the "standing figure")
const ICON_SZ = 52;

// Per-icon motion
const RISE_FROM = 72;  // how far below center each icon starts (stays "in the box")
const RISE_DUR = 380;  // rise-to-standing duration
const HOLD = 190;      // pause standing before it topples
const TOPPLE_DUR = 470;// topple/fall duration
const FADE_OUT = 320;  // fade after fallen
const TOPPLE_DEG = 84; // how far it falls (~vertical → flat on its side)
const REST_SHIFT = 30; // how far to the side the fallen icon drifts

// Sequence
const START_BASE = 220;
const INTERVAL = 600;  // gap between each icon's entrance (one at a time)

// Timeline for logo / overlay (computed off the icon sequence)
const N_ICONS = 4;
const ICONS_DONE = START_BASE + (N_ICONS - 1) * INTERVAL + RISE_DUR + HOLD + TOPPLE_DUR;
const T = {
  logoIn: ICONS_DONE - 120,
  logoDur: 700,
  fly: ICONS_DONE + 500,
  flyDur: 950,
  signalAt: ICONS_DONE + 500 + 700,
  fadeOut: ICONS_DONE + 500 + 850,
  fadeOutDur: 380,
};

const BG = Neutrals.obsidian;
const BG_DEEP = Neutrals.deepCharcoal;
const GOLD = GoldSystem.metallicGold;

// The four elements, in the order they appear; side = which way each topples.
const ELEMENTS: { icon: keyof typeof Ionicons.glyphMap; side: -1 | 1 }[] = [
  { icon: 'business', side: -1 },   // apartment / property — falls left
  { icon: 'people', side: 1 },      // family — falls right
  { icon: 'wallet', side: -1 },     // wealth — falls left
  { icon: 'trending-up', side: 1 }, // investment — falls right
];

// ═════════════════════════════════════════════════════════════════
//  One element — rises to standing at center, then topples to its
//  side pivoting on its base (like a standing figure falling over),
//  then fades. Everything stays within a small central zone.
// ═════════════════════════════════════════════════════════════════
function ElementChip({
  icon,
  side,
  startDelay,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  side: -1 | 1;
  startDelay: number;
}) {
  const rise = useSharedValue(RISE_FROM); // +below → 0 (standing)
  const rot = useSharedValue(0);          // 0 → topple
  const tx = useSharedValue(0);           // small drift to the side as it falls
  const op = useSharedValue(0);

  useEffect(() => {
    // Pop up to standing
    rise.value = withDelay(startDelay, withSpring(0, { damping: 13, stiffness: 130, mass: 0.8 }));
    // Fade in, stay, then fade out after it has fallen
    op.value = withDelay(
      startDelay,
      withSequence(
        withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) }),
        withDelay(RISE_DUR + HOLD + TOPPLE_DUR - 200, withTiming(0, { duration: FADE_OUT })),
      ),
    );
    // Topple over after standing briefly
    const toppleAt = startDelay + RISE_DUR + HOLD;
    rot.value = withDelay(
      toppleAt,
      withTiming(side * TOPPLE_DEG, { duration: TOPPLE_DUR, easing: Easing.in(Easing.quad) }),
    );
    tx.value = withDelay(
      toppleAt,
      withTiming(side * REST_SHIFT, { duration: TOPPLE_DUR, easing: Easing.in(Easing.quad) }),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: [
      { translateX: tx.value },
      { translateY: rise.value },
      // Bottom-pivot rotation: sandwich the rotate between +/- half-height
      // so the chip topples on its base instead of spinning about its center.
      { translateY: CHIP / 2 },
      { rotateZ: `${rot.value}deg` },
      { translateY: -CHIP / 2 },
    ],
  }));

  return (
    <Animated.View style={[sp.chip, style]}>
      <LinearGradient
        colors={['rgba(212,175,55,0.20)', 'rgba(212,175,55,0.05)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Ionicons name={icon} size={ICON_SZ} color={GOLD} />
    </Animated.View>
  );
}

// ═════════════════════════════════════════════════════════════════
//  Tagline — words rise in one by one ("dream" emphasized), with a
//  gold accent line drawing underneath. The whole thing fades out via
//  the shared `exit` value as the logo takes over.
// ═════════════════════════════════════════════════════════════════
const TAGLINE_WORDS: { text: string; em?: boolean }[] = [
  { text: 'Your' },
  { text: 'dream', em: true },
  { text: 'property' },
];
const TAGLINE_BASE = START_BASE + 260; // starts just after the first icon appears
const TAGLINE_WORD_GAP = 150;

function TaglineWord({
  text,
  em,
  delay,
  exit,
}: {
  text: string;
  em?: boolean;
  delay: number;
  exit: SharedValue<number>;
}) {
  const rise = useSharedValue(14);
  const op = useSharedValue(0);
  useEffect(() => {
    rise.value = withDelay(delay, withSpring(0, { damping: 14, stiffness: 140, mass: 0.8 }));
    op.value = withDelay(delay, withTiming(1, { duration: 340, easing: Easing.out(Easing.cubic) }));
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: op.value * exit.value,
    transform: [{ translateY: rise.value }],
  }));
  return (
    <Animated.Text style={[em ? sp.taglineWordEm : sp.taglineWord, style]}>
      {text}
    </Animated.Text>
  );
}

function Tagline({ topPos, exit }: { topPos: number; exit: SharedValue<number> }) {
  const accent = useSharedValue(0);
  useEffect(() => {
    accent.value = withDelay(
      TAGLINE_BASE + TAGLINE_WORDS.length * TAGLINE_WORD_GAP,
      withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }),
    );
  }, []);
  const accentStyle = useAnimatedStyle(() => ({
    opacity: accent.value * exit.value,
    transform: [{ scaleX: accent.value }],
  }));
  return (
    <View pointerEvents="none" style={[sp.taglineWrap, { top: topPos }]}>
      <View style={sp.taglineRow}>
        {TAGLINE_WORDS.map((w, i) => (
          <TaglineWord
            key={w.text}
            text={w.text}
            em={w.em}
            delay={TAGLINE_BASE + i * TAGLINE_WORD_GAP}
            exit={exit}
          />
        ))}
      </View>
      <Animated.View style={[sp.taglineAccent, accentStyle]} />
    </View>
  );
}

// ═════════════════════════════════════════════════════════════════
//  SPLASH OVERLAY — icons pop up & topple one by one → logo pops →
//  logo flies to header → fade out. Reuses the exact landing math.
// ═════════════════════════════════════════════════════════════════
export function AnimatedSplashOverlay() {
  const { width: SW, height: SH } = useWindowDimensions();
  const TGT_TY = -(SH / 2 - HDR_CY);

  const [visible, setVisible] = useState(true);

  const lScl = useSharedValue(0.3);
  const lOp = useSharedValue(0);
  const trn = useSharedValue(0);
  const oOp = useSharedValue(1);
  const glowOp = useSharedValue(0);
  const taglineExit = useSharedValue(1); // "Your dream property" — fades out as the logo appears

  const dismiss = useCallback(() => setVisible(false), []);

  useEffect(() => {
    SplashScreen.hideAsync().then(() => {
      glowOp.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });

      // Tagline clears just before the logo pops in (per-word entrance lives in <Tagline/>)
      taglineExit.value = withDelay(T.logoIn - 120, withTiming(0, { duration: 300, easing: Easing.in(Easing.cubic) }));

      lScl.value = withDelay(T.logoIn, withSpring(1, { damping: 11, stiffness: 90, mass: 0.9 }));
      lOp.value = withDelay(T.logoIn, withTiming(1, { duration: T.logoDur, easing: Easing.out(Easing.cubic) }));

      trn.value = withDelay(T.fly, withTiming(1, { duration: T.flyDur, easing: Easing.inOut(Easing.cubic) }));

      setTimeout(_signal, T.signalAt);

      oOp.value = withDelay(
        T.fadeOut,
        withTiming(0, { duration: T.fadeOutDur, easing: Easing.out(Easing.quad) }, (finished) => {
          'worklet';
          if (finished) {
            runOnJS(_signal)();
            runOnJS(dismiss)();
          }
        }),
      );
    });
  }, []);

  const bgStyle = useAnimatedStyle(() => ({ opacity: oOp.value }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glowOp.value * 0.9 }));

  const logoAnim = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(trn.value, [0, 1], [0, TGT_TY], Extrapolation.CLAMP) },
      { scale: lScl.value * interpolate(trn.value, [0, 1], [1, END_SCL], Extrapolation.CLAMP) },
    ],
    opacity: lOp.value,
  }));

  const logoGlowStyle = useAnimatedStyle(() => ({
    opacity: lOp.value * interpolate(trn.value, [0, 1], [1, 0], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(trn.value, [0, 1], [0, TGT_TY], Extrapolation.CLAMP) },
      { scale: lScl.value * interpolate(trn.value, [0, 1], [1, END_SCL], Extrapolation.CLAMP) },
    ],
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[sp.overlay, { backgroundColor: BG }, bgStyle]}>
      <LinearGradient
        colors={[BG, BG_DEEP, BG]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Soft gold glow behind the composition */}
      <Animated.View
        pointerEvents="none"
        style={[
          sp.bgGlow,
          {
            width: SW * 1.2,
            height: SW * 1.2,
            borderRadius: SW * 0.6,
            top: SH / 2 - SW * 0.6,
            left: -SW * 0.1,
          },
          glowStyle,
        ]}
      >
        <LinearGradient
          colors={['rgba(212,175,55,0.22)', 'rgba(212,175,55,0.05)', 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 0.5, y: 1 }}
        />
      </Animated.View>

      {/* Element "box" — all icons animate within this small central zone */}
      <View pointerEvents="none" style={sp.center}>
        {ELEMENTS.map((el, i) => (
          <ElementChip
            key={el.icon}
            icon={el.icon}
            side={el.side}
            startDelay={START_BASE + i * INTERVAL}
          />
        ))}
      </View>

      {/* Tagline — visible while the icons animate, gone when the logo lands */}
      <Tagline topPos={SH / 2 + 92} exit={taglineExit} />

      {/* Logo glow halo */}
      <Animated.View pointerEvents="none" style={[sp.logoGlow, logoGlowStyle]}>
        <LinearGradient
          colors={['rgba(212,175,55,0.35)', 'rgba(212,175,55,0.08)', 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Logo */}
      <Animated.View style={[sp.logoWrap, logoAnim]}>
        <Image
          source={require('../../assets/logo.png')}
          style={sp.logo}
          contentFit="contain"
        />
      </Animated.View>
    </Animated.View>
  );
}

const sp = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgGlow: {
    position: 'absolute',
    overflow: 'hidden',
  },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    position: 'absolute',
    width: CHIP,
    height: CHIP,
    borderRadius: CHIP / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.55)',
    backgroundColor: 'rgba(26,26,46,0.6)',
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 8,
  },
  taglineWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  taglineWord: {
    color: GoldSystem.softGold,
    fontSize: 19,
    fontWeight: '500',
    letterSpacing: 2,
    marginHorizontal: 4,
  },
  taglineWordEm: {
    color: GoldSystem.metallicGold,
    fontSize: 21,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 1,
    marginHorizontal: 4,
  },
  taglineAccent: {
    height: 2,
    width: 118,
    marginTop: 9,
    borderRadius: 2,
    backgroundColor: GoldSystem.metallicGold,
    shadowColor: GoldSystem.metallicGold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  logoGlow: {
    position: 'absolute',
    width: LOGO_W * 1.5,
    height: LOGO_H * 1.5,
    borderRadius: LOGO_W,
    overflow: 'hidden',
  },
  logoWrap: {
    width: LOGO_W,
    height: LOGO_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: '100%' as any,
    height: '100%' as any,
  },
});

// ═════════════════════════════════════════════════════════════════
//  ANIMATED ICON (existing — kept for backward compat, unused)
// ═════════════════════════════════════════════════════════════════
const INITIAL_SCALE_FACTOR = Dimensions.get('screen').height / 90;
const DURATION = 600;

const keyframe = new Keyframe({
  0: { transform: [{ scale: INITIAL_SCALE_FACTOR }] },
  100: { transform: [{ scale: 1 }], easing: Easing.elastic(0.7) },
});

const logoKeyframe = new Keyframe({
  0: { transform: [{ scale: 1.3 }], opacity: 0 },
  40: { transform: [{ scale: 1.3 }], opacity: 0, easing: Easing.elastic(0.7) },
  100: { opacity: 1, transform: [{ scale: 1 }], easing: Easing.elastic(0.7) },
});

const glowKeyframe = new Keyframe({
  0: { transform: [{ rotateZ: '0deg' }] },
  100: { transform: [{ rotateZ: '7200deg' }] },
});

export function AnimatedIcon() {
  return (
    <View style={iconStyles.iconContainer}>
      <Animated.View entering={glowKeyframe.duration(60 * 1000 * 4)} style={iconStyles.glow}>
        <Image style={iconStyles.glow} source={require('@/assets/images/logo-glow.png')} />
      </Animated.View>
      <Animated.View entering={keyframe.duration(DURATION)} style={iconStyles.background} />
      <Animated.View style={iconStyles.imageContainer} entering={logoKeyframe.duration(DURATION)}>
        <Image style={iconStyles.image} source={require('@/assets/images/expo-logo.png')} />
      </Animated.View>
    </View>
  );
}

const iconStyles = StyleSheet.create({
  imageContainer: { justifyContent: 'center', alignItems: 'center' },
  glow: { width: 201, height: 201, position: 'absolute' },
  iconContainer: { justifyContent: 'center', alignItems: 'center', width: 128, height: 128, zIndex: 100 },
  image: { width: 76, height: 71 },
  background: {
    borderRadius: 40,
    experimental_backgroundImage: `linear-gradient(180deg, #3C9FFE, #0274DF)`,
    width: 128, height: 128, position: 'absolute',
  },
});
