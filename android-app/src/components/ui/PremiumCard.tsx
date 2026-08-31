import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  Animated,
  TouchableWithoutFeedback,
} from 'react-native';
import { Neutrals, GoldSystem, Shadows, Radius } from '@/constants/design';
import { BlurView } from 'expo-blur';
import { Platform } from 'react-native';

interface PremiumCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'outline' | 'glass' | 'dark';
  onPress?: () => void;
}

export function PremiumCard({
  children,
  style,
  variant = 'default',
  onPress,
}: PremiumCardProps) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (!onPress) return;
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (!onPress) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const isOutline = variant === 'outline';
  const isGlass = variant === 'glass';
  const isDark = variant === 'dark';

  const getContainerStyle = (): ViewStyle => {
    let base: ViewStyle = {
      backgroundColor: Neutrals.surface,
      borderRadius: Radius.lg,
      ...Shadows.medium,
    };

    if (isOutline) {
      base = {
        ...base,
        borderWidth: 1,
        borderColor: GoldSystem.warmGold,
      };
    } else if (isDark) {
      base = {
        ...base,
        backgroundColor: Neutrals.charcoal,
      };
    } else if (isGlass) {
      base = {
        ...base,
        backgroundColor: Platform.OS === 'web' ? 'rgba(255, 255, 255, 0.7)' : 'transparent',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
      };
    }

    return base;
  };

  const content = (
    <Animated.View
      style={[
        styles.container,
        getContainerStyle(),
        { transform: [{ scale: scaleAnim }] },
        style,
      ]}
    >
      {isGlass && Platform.OS !== 'web' ? (
        <BlurView
          intensity={50}
          style={StyleSheet.absoluteFill}
          tint="light"
        />
      ) : null}
      {children}
    </Animated.View>
  );

  if (onPress) {
    return (
      <TouchableWithoutFeedback
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {content}
      </TouchableWithoutFeedback>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
