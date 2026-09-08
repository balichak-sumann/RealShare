import React, { useCallback, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';

interface TabAnimationWrapperProps {
  children: React.ReactNode;
}

export function TabAnimationWrapper({ children }: TabAnimationWrapperProps) {
  const animValue = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      // Reset to starting position
      animValue.setValue(0);

      // Animate in with a fast, lightweight fade
      Animated.timing(animValue, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }, [])
  );

  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0], // Reduced distance
  });

  const opacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const scale = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.98, 1], // Reduced scaling
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateY },
            { scale }
          ],
          opacity,
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
