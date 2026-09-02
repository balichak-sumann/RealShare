import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
  Image,
  TouchableWithoutFeedback,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDrawer } from '@/contexts/DrawerContext';
import { useUser } from '@/contexts/UserContext';
import { auth } from '@/lib/firebase';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.78;

interface DrawerWrapperProps {
  children: React.ReactNode;
}

const MENU_ITEMS = [
  { icon: '👤', label: 'Profile', route: '/profile' },
  { icon: '🏦', label: 'Bank Details', route: '/bank-details' },
  { icon: '🛠️', label: 'Services', route: '/services' },
  { icon: '⚙️', label: 'Settings', route: '/settings' },
  { icon: '🎫', label: 'My Tickets', route: '/my-tickets' },
];

export function DrawerWrapper({ children }: DrawerWrapperProps) {
  const { isOpen, closeDrawer } = useDrawer();
  const router = useRouter();
  const { profile } = useUser();
  const slideAnim = useRef(new Animated.Value(0)).current;

  const currentUser = auth.currentUser;
  const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Guest';
  const displayEmail = currentUser?.email || '';

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isOpen ? 1 : 0,
      useNativeDriver: true,
      speed: 18,
      bounciness: 4,
    }).start();
  }, [isOpen]);

  const mainTranslateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, DRAWER_WIDTH],
  });

  const mainScale = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.88],
  });

  const mainBorderRadius = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 24],
  });

  const drawerTranslateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-DRAWER_WIDTH * 0.5, 0],
  });

  const drawerOpacity = slideAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.6, 1],
  });

  const overlayOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  const handleMenuPress = (route: string) => {
    closeDrawer();
    setTimeout(() => {
      router.push(route as any);
    }, 250);
  };

  const handleSignOut = () => {
    closeDrawer();
    auth.signOut();
  };

  return (
    <View style={styles.root}>
      {/* Drawer Menu (behind main content) */}
      <Animated.View
        style={[
          styles.drawer,
          {
            transform: [{ translateX: drawerTranslateX }],
            opacity: drawerOpacity,
          },
        ]}
      >
        {/* User Profile Section */}
        <View style={styles.drawerProfile}>
          <View style={styles.drawerAvatar}>
            <Text style={styles.drawerAvatarText}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.drawerName} numberOfLines={1}>{displayName}</Text>
          {displayEmail ? (
            <Text style={styles.drawerEmail} numberOfLines={1}>{displayEmail}</Text>
          ) : null}
          {profile?.role ? (
            <View style={styles.drawerRoleBadge}>
              <Text style={styles.drawerRoleText}>{profile.role.toUpperCase()}</Text>
            </View>
          ) : null}
        </View>

        {/* Divider */}
        <View style={styles.drawerDivider} />

        {/* Menu Items */}
        <View style={styles.drawerMenuList}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.route}
              style={styles.drawerMenuItem}
              onPress={() => handleMenuPress(item.route)}
              activeOpacity={0.7}
            >
              <Text style={styles.drawerMenuIcon}>{item.icon}</Text>
              <Text style={styles.drawerMenuLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bottom Section */}
        <View style={styles.drawerBottom}>
          <View style={styles.drawerDivider} />
          <TouchableOpacity style={styles.drawerSignOutBtn} onPress={handleSignOut}>
            <Text style={styles.drawerSignOutIcon}>🚪</Text>
            <Text style={styles.drawerSignOutText}>Sign Out</Text>
          </TouchableOpacity>

          <Text style={styles.drawerVersion}>RealShare v2.0</Text>
        </View>
      </Animated.View>

      {/* Main Content */}
      <Animated.View
        style={[
          styles.mainContent,
          {
            transform: [
              { translateX: mainTranslateX },
              { scale: mainScale },
            ],
            borderRadius: mainBorderRadius,
          },
        ]}
      >
        {children}

        {/* Overlay when drawer is open */}
        {isOpen && (
          <TouchableWithoutFeedback onPress={closeDrawer}>
            <Animated.View
              style={[
                styles.overlay,
                { opacity: overlayOpacity },
              ]}
            />
          </TouchableWithoutFeedback>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Neutrals.obsidian,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: DRAWER_WIDTH,
    paddingTop: Platform.OS === 'web' ? 40 : Platform.OS === 'android' ? 50 : 60,
    paddingHorizontal: 24,
    paddingBottom: 30,
    justifyContent: 'flex-start',
  },
  drawerProfile: {
    marginBottom: 24,
  },
  drawerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: GoldSystem.primaryGold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...Shadows.gold,
  },
  drawerAvatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: Neutrals.white,
  },
  drawerName: {
    ...Typography.headlineMedium,
    color: Neutrals.white,
    marginBottom: 4,
  },
  drawerEmail: {
    ...Typography.bodyMedium,
    color: Neutrals.gray400,
    marginBottom: 10,
  },
  drawerRoleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(197, 165, 90, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: GoldSystem.primaryGold,
  },
  drawerRoleText: {
    ...Typography.caption,
    color: GoldSystem.primaryGold,
    letterSpacing: 1,
  },
  drawerDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 8,
  },
  drawerMenuList: {
    flex: 1,
    marginTop: 8,
  },
  drawerMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: Radius.md,
    marginBottom: 2,
  },
  drawerMenuIcon: {
    fontSize: 20,
    width: 36,
  },
  drawerMenuLabel: {
    ...Typography.bodyLarge,
    color: Neutrals.gray200,
  },
  drawerBottom: {
    marginTop: 'auto',
  },
  drawerSignOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  drawerSignOutIcon: {
    fontSize: 20,
    width: 36,
  },
  drawerSignOutText: {
    ...Typography.bodyLarge,
    color: '#EF4444',
  },
  drawerVersion: {
    ...Typography.caption,
    color: Neutrals.gray500,
    textAlign: 'center',
    marginTop: 16,
  },
  mainContent: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: Neutrals.background,
  },
  overlay: {
    ...StyleSheet.absoluteFill as any,
    backgroundColor: '#000',
    zIndex: 999,
  },
});
