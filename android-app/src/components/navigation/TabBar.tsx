import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Neutrals, GoldSystem, Radius, Typography, Shadows } from '@/constants/design';
import { LinearGradient } from 'expo-linear-gradient';

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.tabBar}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        
        // Hide tabs that have href: null
        if ((options as any).href === null) {
          return null;
        }

        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };


        const icon = (() => {
          if (route.name === 'index') return '🏠';
          if (route.name === 'search') return '🔍';
          if (route.name === 'shortlist') return '♡';
          if (route.name === 'portfolio') return '💼'; // Add portfolio tab
          if (route.name === 'profile') return '👤';
          return '•';
        })();

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={(options as any).tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabContainer}
          >
            <Text style={[styles.icon, isFocused && styles.activeIcon]}>
              {icon}
            </Text>
            <Text style={[styles.label, isFocused && styles.activeLabel]}>
              {label as string}
            </Text>
            {isFocused && <View style={styles.indicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Neutrals.obsidian,
    height: 80,
    paddingBottom: 20, // safe area padding approx
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Neutrals.charcoal,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: '100%',
  },

  icon: {
    fontSize: 20,
    color: Neutrals.gray400,
    marginBottom: 4,
  },
  activeIcon: {
    color: GoldSystem.primaryGold,
  },
  label: {
    ...Typography.caption,
    color: Neutrals.gray400,
  },
  activeLabel: {
    color: GoldSystem.primaryGold,
  },
  indicator: {
    position: 'absolute',
    bottom: -6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: GoldSystem.primaryGold,
  },
});
