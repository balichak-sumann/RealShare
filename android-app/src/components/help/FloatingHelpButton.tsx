import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, TouchableOpacity, Animated, View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Neutrals, Radius, Shadows, Typography } from '@/constants/design';
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
          <LinearGradient
            colors={['#8B5CF6', '#EC4899', '#F43F5E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.graphicIcon}>💬</Text>
          </LinearGradient>
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
  buttonGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    ...Shadows.strong,
    shadowColor: '#EC4899',
    shadowOpacity: 0.6,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  graphicIcon: {
    fontSize: 28,
    textAlign: 'center',
  }
});
