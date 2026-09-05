import React, { useEffect, useRef, useState } from 'react';
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
  Modal,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useDrawer } from '@/contexts/DrawerContext';
import { useUser } from '@/contexts/UserContext';
import { auth } from '@/lib/firebase';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
/** Native keeps the original screen-relative width. */
const NATIVE_DRAWER_WIDTH = SCREEN_WIDTH * 0.78;
/** Web caps the drawer so it stays sane inside the centered desktop frame. */
const WEB_DRAWER_MAX = 340;

interface DrawerWrapperProps {
  children: React.ReactNode;
}

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const BASE_MENU_ITEMS: { icon: IoniconName; label: string; route: string }[] = [
  { icon: 'person-outline', label: 'Profile', route: '/profile' },
  { icon: 'card-outline', label: 'Bank Details', route: '/bank-details' },
  { icon: 'construct-outline', label: 'Services', route: '/services' },
  { icon: 'settings-outline', label: 'Settings', route: '/settings' },
  { icon: 'chatbubbles-outline', label: 'Messages', route: '/conversations' },
  { icon: 'ticket-outline', label: 'My Tickets', route: '/my-tickets' },
];

export function DrawerWrapper({ children }: DrawerWrapperProps) {
  const { isOpen, closeDrawer } = useDrawer();
  const router = useRouter();
  const pathname = usePathname();
  const { profile, setProfile } = useUser();
  const slideAnim = useRef(new Animated.Value(0)).current;

  // On web the drawer lives inside the centered app frame, so it must size to
  // that container rather than the browser viewport. Native is untouched.
  const [containerWidth, setContainerWidth] = useState(SCREEN_WIDTH);
  const DRAWER_WIDTH =
    Platform.OS === 'web'
      ? Math.min(containerWidth * 0.78, WEB_DRAWER_MAX)
      : NATIVE_DRAWER_WIDTH;

  const currentUser = auth.currentUser;
  const isGuest = !currentUser;

  // Role specific menu items
  const roleMenuItems: { icon: IoniconName; label: string; route: string }[] = [
    ...(profile?.role === 'builder' ? [{ icon: 'business-outline' as IoniconName, label: 'Builder Console', route: '/builder-portal' }] : []),
    ...(profile?.role === 'agent' ? [{ icon: 'briefcase-outline' as IoniconName, label: 'Agent Console', route: '/agent-portal' }] : []),
    ...(profile?.role === 'employee' || profile?.role === 'admin' ? [{ icon: 'people-outline' as IoniconName, label: 'Employee Portal', route: '/employee-portal' }] : []),
    ...BASE_MENU_ITEMS,
  ];

  // Extract phone number from profile, firebase user, or dummy phone email
  let displayPhone = profile?.phone_number || currentUser?.phoneNumber || '';
  if (!displayPhone && currentUser?.email?.endsWith('@realshare.test')) {
    const rawNumber = currentUser.email.replace('@realshare.test', '');
    displayPhone = rawNumber.startsWith('+91') ? rawNumber : `+91 ${rawNumber}`;
  }
  const hasPhone = !!displayPhone;
  if (!displayPhone) {
    displayPhone = 'Not available';
  }

  // Extract email
  let displayEmail = profile?.email || '';
  if (!displayEmail && currentUser?.email && !currentUser.email.endsWith('@realshare.test')) {
    displayEmail = currentUser.email;
  }
  const hasEmail = !!displayEmail;
  if (!displayEmail) {
    displayEmail = 'Not available';
  }

  // Extract display name
  let displayName = profile?.full_name || currentUser?.displayName || '';
  if (!displayName && currentUser?.email) {
    if (currentUser.email.endsWith('@realshare.test')) {
      displayName = 'Investor';
    } else {
      displayName = currentUser.email.split('@')[0];
    }
  }
  if (!displayName) {
    displayName = 'Guest';
  }

  const roleName = profile?.role || (isGuest ? 'GUEST' : 'INVESTOR');

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isOpen ? 1 : 0,
      useNativeDriver: Platform.OS !== 'web',
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
      if (!currentUser) {
        router.push('/sign-in' as any);
      } else {
        router.push(route as any);
      }
    }, 250);
  };

  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  const handleSignOut = async () => {
    setShowSignOutConfirm(false);
    closeDrawer();
    setProfile(null);
    await auth.signOut();
    router.replace('/(auth)/sign-in');
  };

  return (
    <View
      style={styles.root}
      onLayout={
        Platform.OS === 'web'
          ? (e) => setContainerWidth(e.nativeEvent.layout.width)
          : undefined
      }
    >
      {/* Drawer Menu (behind main content) */}
      <Animated.View
        style={[
          styles.drawer,
          {
            width: DRAWER_WIDTH,
            transform: [{ translateX: drawerTranslateX }],
            opacity: drawerOpacity,
          },
        ]}
      >
        {/* User Profile Section */}
        {currentUser ? (
          <View style={styles.drawerProfile}>
            <View style={styles.drawerAvatarContainer}>
              <View style={[styles.drawerAvatarGlow, Platform.OS === 'web' ? { filter: 'blur(8px)' } as any : {}]} />
              <LinearGradient
                colors={GoldSystem.goldGradient}
                style={styles.drawerAvatar}
              >
                <Text style={styles.drawerAvatarText}>
                  {displayName.charAt(0).toUpperCase()}
                </Text>
              </LinearGradient>
            </View>
            <Text style={styles.drawerName} numberOfLines={1}>{displayName}</Text>
            
            <View style={styles.contactRow}>
              <Ionicons name="call-outline" size={13} color={hasPhone ? Neutrals.gray400 : Neutrals.gray500} style={styles.contactIcon} />
              <Text style={[styles.drawerContactInfo, !hasPhone && styles.unavailableText]} numberOfLines={1}>
                {displayPhone}
              </Text>
            </View>
            
            <View style={styles.contactRow}>
              <Ionicons name="mail-outline" size={13} color={hasEmail ? Neutrals.gray400 : Neutrals.gray500} style={styles.contactIcon} />
              <Text style={[styles.drawerContactInfo, !hasEmail && styles.unavailableText]} numberOfLines={1}>
                {displayEmail}
              </Text>
            </View>

            <View style={[styles.drawerRoleBadge, { marginTop: 10 }]}>
              <Text style={styles.drawerRoleText}>{roleName.toUpperCase()}</Text>
            </View>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.drawerGuestCard}
            onPress={() => handleMenuPress('/sign-in')}
            activeOpacity={0.8}
          >
            <View style={styles.drawerAvatarContainer}>
              <LinearGradient
                colors={GoldSystem.goldGradient}
                style={styles.drawerAvatar}
              >
                <Ionicons name="person" size={28} color={Neutrals.white} />
              </LinearGradient>
            </View>
            <Text style={styles.drawerName}>Welcome</Text>
            <Text style={styles.drawerGuestSubtitle}>Sign in to view your portfolio & account</Text>
            
            <View style={styles.signInPill}>
              <Text style={styles.signInPillText}>Sign In / Register →</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Divider */}
        <View style={styles.drawerDivider} />

        {/* Menu Items */}
        <View style={styles.drawerMenuList}>
          {roleMenuItems.map((item) => {
            const isActive = pathname === item.route || pathname.startsWith(item.route + '/');

            return (
              <TouchableOpacity
                key={item.route}
                onPress={() => handleMenuPress(item.route)}
                activeOpacity={0.7}
                style={styles.drawerMenuBtn}
              >
                {isActive ? (
                  <LinearGradient
                    colors={['rgba(212, 175, 55, 0.15)', 'rgba(212, 175, 55, 0.02)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.drawerMenuItem, styles.drawerMenuItemActive]}
                  >
                    <View style={styles.activeIndicator} />
                    <Ionicons name={item.icon} size={22} color={GoldSystem.metallicGold} style={styles.drawerMenuIcon} />
                    <Text style={[styles.drawerMenuLabel, styles.drawerMenuLabelActive]}>{item.label}</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.drawerMenuItem}>
                    <Ionicons name={item.icon} size={22} color={Neutrals.gray400} style={styles.drawerMenuIcon} />
                    <Text style={styles.drawerMenuLabel}>{item.label}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Bottom Section */}
        <View style={styles.drawerBottom}>
          <View style={styles.drawerDivider} />
          {currentUser ? (
            <TouchableOpacity style={styles.drawerSignOutBtn} onPress={() => setShowSignOutConfirm(true)}>
              <Ionicons name="log-out-outline" size={22} color="#EF4444" style={styles.drawerSignOutIcon} />
              <Text style={styles.drawerSignOutText}>Sign Out</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.drawerSignOutBtn} onPress={() => handleMenuPress('/sign-in')}>
              <Ionicons name="log-in-outline" size={22} color={GoldSystem.metallicGold} style={styles.drawerSignOutIcon} />
              <Text style={[styles.drawerSignOutText, { color: GoldSystem.metallicGold }]}>Sign In</Text>
            </TouchableOpacity>
          )}

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

      {/* Sign Out Confirmation Modal */}
      <Modal
        visible={showSignOutConfirm}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSignOutConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="log-out-outline" size={30} color="#EF4444" />
            </View>

            <Text style={styles.modalTitle}>Sign Out</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to sign out of your account?
            </Text>

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowSignOutConfirm(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleSignOut}
              >
                <Text style={styles.modalConfirmButtonText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingTop: Platform.OS === 'web' ? 40 : Platform.OS === 'android' ? 50 : 60,
    paddingHorizontal: 24,
    paddingBottom: 30,
    justifyContent: 'flex-start',
  },
  drawerProfile: {
    marginBottom: 24,
  },
  drawerGuestCard: {
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  drawerGuestSubtitle: {
    ...Typography.bodyMedium,
    color: Neutrals.gray400,
    fontSize: 13,
    marginTop: 2,
    marginBottom: 12,
  },
  signInPill: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderColor: GoldSystem.metallicGold,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
  },
  signInPillText: {
    ...Typography.labelMedium,
    color: GoldSystem.metallicGold,
    fontWeight: '700',
  },
  drawerAvatarContainer: {
    position: 'relative',
    marginBottom: 16,
    width: 64,
    height: 64,
  },
  drawerAvatarGlow: {
    position: 'absolute',
    top: -4, left: -4, right: -4, bottom: -4,
    backgroundColor: GoldSystem.warmGold,
    borderRadius: 40,
    opacity: 0.3,
  },
  drawerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
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
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  contactIcon: {
    marginRight: 6,
  },
  drawerContactInfo: {
    ...Typography.bodyMedium,
    color: Neutrals.gray400,
    fontSize: 13,
  },
  unavailableText: {
    color: Neutrals.gray500,
    fontStyle: 'italic',
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
    flexShrink: 1,
    marginTop: 8,
    width: '100%',
  },
  drawerMenuBtn: {
    marginBottom: 8,
  },
  drawerMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: Radius.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  drawerMenuItemActive: {
    borderColor: 'rgba(212, 175, 55, 0.2)',
    borderWidth: 1,
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: '25%',
    bottom: '25%',
    width: 4,
    backgroundColor: GoldSystem.metallicGold,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  drawerMenuIcon: {
    width: 36,
  },
  drawerMenuLabel: {
    ...Typography.bodyLarge,
    color: Neutrals.gray400,
    fontWeight: '500',
    letterSpacing: 0.3,
    flex: 1,
  },
  drawerMenuLabelActive: {
    color: GoldSystem.metallicGold,
    fontWeight: '700',
    flex: 1,
  },
  drawerBottom: {
    marginTop: 'auto',
    width: '100%',
    flexShrink: 0,
  },
  drawerSignOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  drawerSignOutIcon: {
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
    width: '100%',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 9999,
  },
  modalCard: {
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  modalIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
  },
  modalCancelButtonText: {
    color: '#E2E8F0',
    fontSize: 15,
    fontWeight: '600',
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  modalConfirmButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
