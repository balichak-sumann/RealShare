import React, { useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { GoldSystem, Shadows } from '@/constants/design';
import { LinearGradient } from 'expo-linear-gradient';

export function AIOrb() {
  const scale = new Animated.Value(1);
  const opacity = new Animated.Value(0.7);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1.15,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.7,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.glow, { transform: [{ scale }], opacity }]} />
      <LinearGradient colors={GoldSystem.goldGradient} style={styles.orb} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: GoldSystem.primaryGold,
    opacity: 0.5,
    ...Shadows.gold,
  },
  orb: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
    ...Shadows.strong,
  },
});
