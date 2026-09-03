import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Neutrals, GoldSystem, Radius, Typography, Shadows } from '@/constants/design';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '@/contexts/UserContext';

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { profile } = useUser();

  if (profile?.role === 'builder') {
    return null;
  }

  const isAgent = profile?.role === 'agent';

  return (
    <View style={styles.tabBar}>
      {(() => {
        // Explicitly hide these tabs from the bottom bar
        const hiddenRoutes = ['search', 'profile', 'clients'];
        
        // Custom agent tabs vs investor tabs
        if (isAgent) {
          // Agents don't see search, but they do see clients
          const index = hiddenRoutes.indexOf('clients');
          if (index > -1) hiddenRoutes.splice(index, 1);
        } else {
          // Investors see search, don't see clients
          const index = hiddenRoutes.indexOf('search');
          if (index > -1) hiddenRoutes.splice(index, 1);
        }

        const visibleRoutes = state.routes.filter(route => {
          return !hiddenRoutes.includes(route.name);
        });

        // Desired order for Agents: Portfolio | Shortlist | Home | Clients | Explore
        const order = isAgent 
          ? ['portfolio', 'shortlist', 'index', 'clients', 'explore']
          : ['portfolio', 'shortlist', 'index', 'search', 'explore']; // Investor order

        const sortedRoutes = [...visibleRoutes].sort((a, b) => {
          let indexA = order.indexOf(a.name);
          let indexB = order.indexOf(b.name);
          if (indexA === -1) indexA = 99;
          if (indexB === -1) indexB = 99;
          return indexA - indexB;
        });

        return sortedRoutes.map((route) => {
          // find original index for state tracking
          const originalIndex = state.routes.findIndex(r => r.key === route.key);
          const { options } = descriptors[route.key];

          let label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const isFocused = state.index === originalIndex;

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

          const isHome = route.name === 'index';

          let icon = '•';
          
          if (route.name === 'index') { label = 'Home'; icon = '🏠'; }
          else if (route.name === 'portfolio') { label = 'Portfolio'; icon = '💼'; }
          else if (route.name === 'shortlist') { label = 'Properties'; icon = '🏢'; }
          else if (route.name === 'explore') { label = 'Explore'; icon = '🔍'; }
          else if (route.name === 'clients') { label = 'Clients'; icon = '👥'; }
          else if (route.name === 'profile') icon = '👤';
          else if (route.name === 'search') icon = '🔍';

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={(options as any).tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={[styles.tabContainer, isHome && styles.homeTabContainer]}
            >
              {isHome ? (
                <LinearGradient
                  colors={['#D4AF37', '#B8860B']}
                  style={styles.homeBtnBubble}
                >
                  <Text style={[styles.icon, styles.homeIcon]}>{icon}</Text>
                </LinearGradient>
              ) : (
                <>
                  <Text style={[styles.icon, isFocused && styles.activeIcon]}>
                    {icon}
                  </Text>
                  <Text style={[styles.label, isFocused && styles.activeLabel]}>
                    {label as string}
                  </Text>
                  {isFocused && <View style={styles.indicator} />}
                </>
              )}
            </TouchableOpacity>
          );
        });
      })()}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Neutrals.obsidian,
    height: 80,
    paddingBottom: 20,
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
  homeTabContainer: {
    transform: [{ translateY: -15 }],
  },
  homeBtnBubble: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  homeIcon: {
    fontSize: 28,
    color: '#FFFFFF',
    marginBottom: 0,
  },
});
