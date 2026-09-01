import { Image } from 'expo-image';
import { useState, useEffect, useCallback } from 'react';
import { Dimensions, StyleSheet, View, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
  runOnJS,
  interpolate,
  interpolateColor,
  Extrapolation,
  Keyframe,
} from 'react-native-reanimated';

import classes from './animated-icon.module.css';

const { width: SW, height: SH } = Dimensions.get('window');

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

// ─── Layout constants ────────────────────────────────────────────
const HDR_PAD = 16; // web header paddingTop
const HDR_CY = HDR_PAD + 24;
const TGT_TY = -(SH / 2 - HDR_CY);
const LOGO_W = 220;
const LOGO_H = 200;
const END_SCL = 0.25;

const BG_COLOR = '#FFFFFF';

// ═════════════════════════════════════════════════════════════════
//  CINEMATIC SPLASH OVERLAY (Web)
// ═════════════════════════════════════════════════════════════════
export function AnimatedSplashOverlay() {
  const [visible, setVisible] = useState(true);

  const lScl = useSharedValue(0.3);
  const lOp = useSharedValue(0);
  const trn = useSharedValue(0);
  const oOp = useSharedValue(1);

  const dismiss = useCallback(() => setVisible(false), []);

  useEffect(() => {
    // Logo appears with spring bounce
    lScl.value = withDelay(
      200,
      withSpring(1, { damping: 12, stiffness: 80, mass: 0.9 }),
    );
    lOp.value = withDelay(
      200,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }),
    );

    // Transition: logo shrinks + moves to header
    trn.value = withDelay(
      1400,
      withTiming(1, { duration: 800, easing: Easing.inOut(Easing.cubic) }),
    );

    setTimeout(_signal, 2100);

    // Overlay fades out
    oOp.value = withDelay(
      2150,
      withTiming(
        0,
        { duration: 350, easing: Easing.out(Easing.quad) },
        (finished) => {
          'worklet';
          if (finished) {
            runOnJS(_signal)();
            runOnJS(dismiss)();
          }
        },
      ),
    );
  }, []);

  const bgStyle = useAnimatedStyle(() => ({
    backgroundColor: BG_COLOR,
    opacity: oOp.value,
  }));

  const logoAnim = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(trn.value, [0, 1], [0, TGT_TY], Extrapolation.CLAMP) },
      { scale: lScl.value * interpolate(trn.value, [0, 1], [1, END_SCL], Extrapolation.CLAMP) },
    ],
    opacity: lOp.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[sp.overlay, bgStyle]}>
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
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 1000 },
  logoWrap: {
    position: 'absolute',
    top: SH / 2 - LOGO_H / 2,
    left: SW / 2 - LOGO_W / 2,
    width: LOGO_W,
    height: LOGO_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
