import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect, useCallback } from 'react';
import { useWindowDimensions, StyleSheet, View } from 'react-native';
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
import classes from './animated-icon.module.css';

// ─── Splash-complete signaling ───────────────────────────────────
let _done = false;
const _cbs: (() => void)[] = [];
export const isSplashComplete = () => _done;
export function onSplashComplete(fn: () => void) {
  if (_done) fn(); else _cbs.push(fn);
}
function _signal() {
  if (_done) return;
  _done = true;
  _cbs.splice(0).forEach((f) => f());
}

// ─── Tunables ────────────────────────────────────────────────────
const HDR_PAD = 16;
const HDR_CY = HDR_PAD + 24;
const LOGO_W = 220;
const LOGO_H = 200;
const END_SCL = 0.25;
const CHIP = 104;
const ICON_SZ = 52;

const RISE_FROM = 72;
const RISE_DUR = 380;
const HOLD = 190;
const TOPPLE_DUR = 470;
const FADE_OUT = 320;
const TOPPLE_DEG = 84;
const REST_SHIFT = 30;

const START_BASE = 220;
const INTERVAL = 600;

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
const GOLD = GoldSystem.metallicGold;

const ELEMENTS: { icon: keyof typeof Ionicons.glyphMap; side: -1 | 1 }[] = [
  { icon: 'business', side: -1 },
  { icon: 'people', side: 1 },
  { icon: 'wallet', side: -1 },
  { icon: 'trending-up', side: 1 },
];

function ElementChip({
  icon, side, startDelay,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  side: -1 | 1;
  startDelay: number;
}) {
  const rise = useSharedValue(RISE_FROM);
  const rot = useSharedValue(0);
  const tx = useSharedValue(0);
  const op = useSharedValue(0);

  useEffect(() => {
    rise.value = withDelay(startDelay, withSpring(0, { damping: 13, stiffness: 130, mass: 0.8 }));
    op.value = withDelay(
      startDelay,
      withSequence(
        withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) }),
        withDelay(RISE_DUR + HOLD + TOPPLE_DUR - 200, withTiming(0, { duration: FADE_OUT })),
      ),
    );
    const toppleAt = startDelay + RISE_DUR + HOLD;
    rot.value = withDelay(toppleAt, withTiming(side * TOPPLE_DEG, { duration: TOPPLE_DUR, easing: Easing.in(Easing.quad) }));
    tx.value = withDelay(toppleAt, withTiming(side * REST_SHIFT, { duration: TOPPLE_DUR, easing: Easing.in(Easing.quad) }));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: [
      { translateX: tx.value },
      { translateY: rise.value },
      { translateY: CHIP / 2 },
      { rotateZ: `${rot.value}deg` },
      { translateY: -CHIP / 2 },
    ],
  }));

  return (
    <Animated.View style={[wsp.chip, style]}>
      <Ionicons name={icon} size={ICON_SZ} color={GOLD} />
    </Animated.View>
  );
}

const TAGLINE_WORDS: { text: string; em?: boolean }[] = [
  { text: 'Your' },
  { text: 'dream', em: true },
  { text: 'property' },
];
const TAGLINE_BASE = START_BASE + 260;
const TAGLINE_WORD_GAP = 150;

function TaglineWord({ text, em, delay, exit }: { text: string; em?: boolean; delay: number; exit: SharedValue<number> }) {
  const rise = useSharedValue(14);
  const op = useSharedValue(0);
  useEffect(() => {
    rise.value = withDelay(delay, withSpring(0, { damping: 14, stiffness: 140, mass: 0.8 }));
    op.value = withDelay(delay, withTiming(1, { duration: 340, easing: Easing.out(Easing.cubic) }));
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: op.value * exit.value, transform: [{ translateY: rise.value }] }));
  return <Animated.Text style={[em ? wsp.taglineWordEm : wsp.taglineWord, style]}>{text}</Animated.Text>;
}

function Tagline({ topPos, exit }: { topPos: number; exit: SharedValue<number> }) {
  const accent = useSharedValue(0);
  useEffect(() => {
    accent.value = withDelay(
      TAGLINE_BASE + TAGLINE_WORDS.length * TAGLINE_WORD_GAP,
      withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }),
    );
  }, []);
  const accentStyle = useAnimatedStyle(() => ({ opacity: accent.value * exit.value, transform: [{ scaleX: accent.value }] }));
  return (
    <View pointerEvents="none" style={[wsp.taglineWrap, { top: topPos }]}>
      <View style={wsp.taglineRow}>
        {TAGLINE_WORDS.map((w, i) => (
          <TaglineWord key={w.text} text={w.text} em={w.em} delay={TAGLINE_BASE + i * TAGLINE_WORD_GAP} exit={exit} />
        ))}
      </View>
      <Animated.View style={[wsp.taglineAccent, accentStyle]} />
    </View>
  );
}

export function AnimatedSplashOverlay() {
  const { height: SH } = useWindowDimensions();
  const TGT_TY = -(SH / 2 - HDR_CY);

  const [visible, setVisible] = useState(true);

  const lScl = useSharedValue(0.3);
  const lOp = useSharedValue(0);
  const trn = useSharedValue(0);
  const oOp = useSharedValue(1);
  const taglineExit = useSharedValue(1);

  const dismiss = useCallback(() => setVisible(false), []);

  useEffect(() => {
    taglineExit.value = withDelay(T.logoIn - 120, withTiming(0, { duration: 300, easing: Easing.in(Easing.cubic) }));
    lScl.value = withDelay(T.logoIn, withSpring(1, { damping: 11, stiffness: 90, mass: 0.9 }));
    lOp.value = withDelay(T.logoIn, withTiming(1, { duration: T.logoDur, easing: Easing.out(Easing.cubic) }));
    trn.value = withDelay(T.fly, withTiming(1, { duration: T.flyDur, easing: Easing.inOut(Easing.cubic) }));
    setTimeout(_signal, T.signalAt);
    oOp.value = withDelay(
      T.fadeOut,
      withTiming(0, { duration: T.fadeOutDur, easing: Easing.out(Easing.quad) }, (finished) => {
        'worklet';
        if (finished) { runOnJS(_signal)(); runOnJS(dismiss)(); }
      }),
    );
  }, []);

  const bgStyle = useAnimatedStyle(() => ({ backgroundColor: BG, opacity: oOp.value }));
  const logoAnim = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(trn.value, [0, 1], [0, TGT_TY], Extrapolation.CLAMP) },
      { scale: lScl.value * interpolate(trn.value, [0, 1], [1, END_SCL], Extrapolation.CLAMP) },
    ],
    opacity: lOp.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[wsp.overlay, bgStyle]}>
      <LinearGradient
        colors={[BG, Neutrals.deepCharcoal, BG]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={wsp.center}>
        {ELEMENTS.map((el, i) => (
          <ElementChip key={el.icon} icon={el.icon} side={el.side} startDelay={START_BASE + i * INTERVAL} />
        ))}
      </View>
      <Tagline topPos={SH / 2 + 92} exit={taglineExit} />
      <Animated.View style={[wsp.logoWrap, logoAnim]}>
        <Image source={require('../../assets/logo.png')} style={wsp.logo} contentFit="contain" />
      </Animated.View>
    </Animated.View>
  );
}

const wsp = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFill, zIndex: 1000, alignItems: 'center', justifyContent: 'center' },
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  chip: {
    position: 'absolute',
    width: CHIP, height: CHIP, borderRadius: CHIP / 2,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.55)',
    backgroundColor: 'rgba(26,26,46,0.6)',
  },
  taglineWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  taglineRow: { flexDirection: 'row', alignItems: 'flex-end' },
  taglineWord: { color: GoldSystem.softGold, fontSize: 19, fontWeight: '500', letterSpacing: 2, marginHorizontal: 4 },
  taglineWordEm: { color: GoldSystem.metallicGold, fontSize: 21, fontWeight: '800', fontStyle: 'italic', letterSpacing: 1, marginHorizontal: 4 },
  taglineAccent: { height: 2, width: 118, marginTop: 9, borderRadius: 2, backgroundColor: GoldSystem.metallicGold },
  logoWrap: { width: LOGO_W, height: LOGO_H, alignItems: 'center', justifyContent: 'center' },
  logo: { width: '100%' as any, height: '100%' as any },
});

// ═════════════════════════════════════════════════════════════════
//  ANIMATED ICON (existing — kept for backward compat)
// ═════════════════════════════════════════════════════════════════
const DURATION = 300;

const keyframe = new Keyframe({
  0: { transform: [{ scale: 0 }] },
  60: { transform: [{ scale: 1.2 }], easing: Easing.elastic(1.2) },
  100: { transform: [{ scale: 1 }], easing: Easing.elastic(1.2) },
});

const logoKeyframe = new Keyframe({
  0: { opacity: 0 },
  60: { transform: [{ scale: 1.2 }], opacity: 0, easing: Easing.elastic(1.2) },
  100: { transform: [{ scale: 1 }], opacity: 1, easing: Easing.elastic(1.2) },
});

const glowKeyframe = new Keyframe({
  0: { transform: [{ rotateZ: '-180deg' }, { scale: 0.8 }], opacity: 0 },
  [DURATION / 1000]: {
    transform: [{ rotateZ: '0deg' }, { scale: 1 }],
    opacity: 1,
    easing: Easing.elastic(0.7),
  },
  100: { transform: [{ rotateZ: '7200deg' }] },
});

export function AnimatedIcon() {
  return (
    <View style={styles.iconContainer}>
      <Animated.View entering={glowKeyframe.duration(60 * 1000 * 4)} style={styles.glow}>
        <Image style={styles.glow} source={require('@/assets/images/logo-glow.png')} />
      </Animated.View>
      <Animated.View style={styles.background} entering={keyframe.duration(DURATION)}>
        <div className={classes.expoLogoBackground} />
      </Animated.View>
      <Animated.View style={styles.imageContainer} entering={logoKeyframe.duration(DURATION)}>
        <Image style={styles.image} source={require('@/assets/images/expo-logo.png')} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', width: '100%', zIndex: 1000, position: 'absolute', top: 128 / 2 + 138 },
  imageContainer: { justifyContent: 'center', alignItems: 'center' },
  glow: { width: 201, height: 201, position: 'absolute' },
  iconContainer: { justifyContent: 'center', alignItems: 'center', width: 128, height: 128 },
  image: { position: 'absolute', width: 76, height: 71 },
  background: { width: 128, height: 128, position: 'absolute' },
});
