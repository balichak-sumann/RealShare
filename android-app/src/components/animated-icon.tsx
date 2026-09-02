import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useState, useEffect, useCallback } from 'react';
import { useWindowDimensions, StyleSheet, View, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
  runOnJS,
  interpolate,
  Extrapolation,
  Keyframe,
} from 'react-native-reanimated';

// ═════════════════════════════════════════════════════════════════
//  Splash-complete signaling (module-level)
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

const HDR_PAD = Platform.OS === 'android' ? 40 : 50;
const HDR_CY = HDR_PAD + 24;
const LOGO_W = 220;
const LOGO_H = 200;
const END_SCL = 0.25;

const BG_COLOR = '#FFFFFF';

// ═════════════════════════════════════════════════════════════════
//  CINEMATIC SPLASH OVERLAY
//  Simple: logo appears → scales down → moves to header → done
// ═════════════════════════════════════════════════════════════════
export function AnimatedSplashOverlay() {
  const { height: SH } = useWindowDimensions();
  const TGT_TY = -(SH / 2 - HDR_CY);

  const [visible, setVisible] = useState(true);

  const lScl = useSharedValue(0.3);   // logo scale (spring reveal)
  const lOp = useSharedValue(0);      // logo opacity
  const trn = useSharedValue(0);      // transition to header 0→1
  const oOp = useSharedValue(1);      // overlay opacity

  const dismiss = useCallback(() => setVisible(false), []);

  useEffect(() => {
    SplashScreen.hideAsync().then(() => {
      // Logo appears with spring bounce (0 → 1.2s)
      lScl.value = withDelay(
        200,
        withSpring(1, { damping: 12, stiffness: 80, mass: 0.9 }),
      );
      lOp.value = withDelay(
        200,
        withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }),
      );

      // Transition: logo shrinks + moves to header (1.4 → 2.2s)
      trn.value = withDelay(
        1400,
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.cubic) }),
      );
      // Pre-signal header logo
      setTimeout(_signal, 2100);

      // Overlay fades out (2.15 → 2.5s)
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
    });
  }, []);

  const bgStyle = useAnimatedStyle(() => ({
    backgroundColor: BG_COLOR,
    opacity: oOp.value,
  }));

  const logoAnim = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          trn.value, [0, 1], [0, TGT_TY], Extrapolation.CLAMP,
        ),
      },
      {
        scale:
          lScl.value *
          interpolate(trn.value, [0, 1], [1, END_SCL], Extrapolation.CLAMP),
      },
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
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
//  ANIMATED ICON (existing — kept for backward compat)
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
