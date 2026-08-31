import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  Animated,
} from 'react-native';
import { GoldSystem, Neutrals, Radius, Typography } from '@/constants/design';

interface CategoryPillProps {
  label: string;
  icon?: string;
  count?: number;
  isActive?: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

export function CategoryPill({
  label,
  icon,
  count,
  isActive = false,
  onPress,
  style,
}: CategoryPillProps) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
        style={[styles.container, isActive ? styles.activeContainer : styles.inactiveContainer]}
      >
        {icon && (
          <Text style={styles.icon}>{icon}</Text>
        )}
        <Text style={[styles.label, isActive ? styles.activeLabel : styles.inactiveLabel]}>
          {label}
        </Text>
        {count !== undefined && (
          <Text style={[styles.count, isActive ? styles.activeCount : styles.inactiveCount]}>
            {count}
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.full,
    borderWidth: 1,
    marginRight: 8,
  },
  activeContainer: {
    backgroundColor: GoldSystem.paleGold,
    borderColor: GoldSystem.primaryGold,
  },
  inactiveContainer: {
    backgroundColor: Neutrals.surface,
    borderColor: Neutrals.border,
  },
  icon: {
    fontSize: 14,
    marginRight: 6,
  },
  label: {
    ...Typography.labelMedium,
  },
  activeLabel: {
    color: GoldSystem.darkGold,
  },
  inactiveLabel: {
    color: Neutrals.textSecondary,
  },
  count: {
    ...Typography.caption,
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  activeCount: {
    backgroundColor: GoldSystem.warmGold,
    color: Neutrals.white,
  },
  inactiveCount: {
    backgroundColor: Neutrals.gray200,
    color: Neutrals.textSecondary,
  },
});
