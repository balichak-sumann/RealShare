import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GoldSystem, Neutrals, Shadows, Radius, Typography } from '@/constants/design';

interface GoldButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'dark';
  style?: ViewStyle;
  textStyle?: TextStyle;
  isLoading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export function GoldButton({
  title,
  onPress,
  variant = 'primary',
  style,
  textStyle,
  isLoading = false,
  disabled = false,
  icon,
}: GoldButtonProps) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const isPrimary = variant === 'primary';
  const isDark = variant === 'dark';
  const isOutline = variant === 'outline';

  const getContainerStyle = (): ViewStyle => {
    if (isDark) {
      return {
        backgroundColor: Neutrals.charcoal,
        ...Shadows.medium,
      };
    }
    if (isOutline) {
      return {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: GoldSystem.metallicGold,
      };
    }
    return {
      ...Shadows.gold,
    };
  };

  const getTextColor = () => {
    if (isDark) return GoldSystem.metallicGold;
    if (isOutline) return GoldSystem.primaryGold;
    return Neutrals.obsidian; // Contrast text on gold bg
  };

  const ButtonContent = () => (
    <>
      {isLoading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <>
          {icon && icon}
          <Text
            style={[
              styles.text,
              { color: getTextColor() },
              icon ? { marginLeft: 8 } : {},
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </>
  );

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        disabled={disabled || isLoading}
        style={[
          styles.container,
          getContainerStyle(),
          disabled && { opacity: 0.6 },
        ]}
      >
        {isPrimary && !disabled ? (
          <LinearGradient
            colors={GoldSystem.goldGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.gradient, styles.container]}
          >
            <ButtonContent />
          </LinearGradient>
        ) : (
          <ButtonContent />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 48,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  gradient: {
    width: '100%',
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  text: {
    ...Typography.labelLarge,
  },
});
