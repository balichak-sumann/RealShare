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

      // Animate in with a slower, more deliberate card-flip style spring
      Animated.spring(animValue, {
        toValue: 1,
        useNativeDriver: true,
        speed: 10,
        bounciness: 6,
      }).start();
    }, [])
  );

  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [60, 0],
  });

  const opacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const scale = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1],
  });

  const rotateX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['15deg', '0deg'],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { perspective: 1000 },
            { translateY },
            { scale },
            { rotateX }
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
