import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, TouchableOpacity, Animated, View } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Neutrals, GoldSystem, Radius, Shadows, Typography } from '@/constants/design';
import { HelpModal } from './HelpModal';

export function FloatingHelpButton() {
  const [modalVisible, setModalVisible] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    // Slide in after a delay
    setTimeout(() => {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    }, 1000);

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <>
      <Animated.View style={[
          styles.container, 
          { transform: [{ translateY: slideAnim }, { scale: pulseAnim }] }
      ]}>
        <TouchableOpacity 
            onPress={() => setModalVisible(true)}
            activeOpacity={0.8}
        >
          <View style={styles.button}>
            <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <Defs>
                <LinearGradient id="gradPink" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor="#F43F5E" />
                  <Stop offset="1" stopColor="#F97316" />
                </LinearGradient>
                <LinearGradient id="gradBlue" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor="#3B82F6" />
                  <Stop offset="1" stopColor="#8B5CF6" />
                </LinearGradient>
              </Defs>
              <Path d="M16 2c3.314 0 6 2.686 6 6v4c0 3.314-2.686 6-6 6h-1.5l-3.5 3v-3c-2.485 0-4.618-1.51-5.516-3.666A5.972 5.972 0 0 0 8 18h1.5l3.5 3v-3c3.314 0 6-2.686 6-6V8c0-2.316-1.31-4.325-3.21-5.326C15.86 2.095 15.93 2 16 2z" fill="url(#gradPink)" />
              <Path d="M8 6C4.686 6 2 8.686 2 12v4c0 3.314 2.686 6 6 6h1.5l3.5 3v-3c3.314 0 6-2.686 6-6v-4c0-3.314-2.686-6-6-6H8z" fill="url(#gradBlue)" />
              <Path d="M7 13a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm4 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm4 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z" fill="#FFFFFF" />
            </Svg>
          </View>
        </TouchableOpacity>
      </Animated.View>

      <HelpModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    zIndex: 9999,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Neutrals.obsidian,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: GoldSystem.primaryGold,
    ...Shadows.strong,
    shadowColor: GoldSystem.primaryGold,
    shadowOpacity: 0.4,
    shadowRadius: 12,
  }
});
