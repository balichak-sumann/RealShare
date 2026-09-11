import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
  TextInput,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useResponsive } from '@/hooks/useResponsive';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Neutrals, GoldSystem, Typography, Radius } from '@/constants/design';
import { useUser } from '@/contexts/UserContext';
import { useLocation } from '@/contexts/LocationContext';
import { LocationPickerModal } from '@/components/ui/LocationPickerModal';
import { auth } from '@/lib/firebase';
import { getApiUrl } from '@/lib/api';

/**
 * Desktop top navigation.
 *
 * Rendered only by WebShell on wide web viewports. This is what replaces the
 * phone chrome (bottom tab bar + hamburger header) — desktop users get a
 * conventional horizontal nav instead of mobile navigation stretched wide.
 */

interface NavItem {
  label: string;
  route: string;
  match: RegExp;
}

export function DesktopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { isTablet } = useResponsive();
  const { profile } = useUser();
  const { city } = useLocation();
  const [query, setQuery] = React.useState('');
  const [showLocationPicker, setShowLocationPicker] = React.useState(false);
  const [hasUnread, setHasUnread] = React.useState(false);

  const currentUser = auth.currentUser;
  const isAgent = profile?.role === 'agent';

  React.useEffect(() => {
    if (!currentUser) {
      setHasUnread(false);
      return;
    }
    const checkUnread = async () => {
      try {
        const token = await currentUser.getIdToken();
        const res = await fetch(
          `${getApiUrl()}/api/notifications/feed`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setHasUnread(true);
          }
        }
      } catch (e) {}
    };
    checkUnread();
  }, [currentUser]);

  const navItems: NavItem[] = [
    { label: 'Home', route: '/', match: /^\/$|^\/\(tabs\)$/ },
    { label: 'Properties', route: '/search', match: /^\/search/ },
    { label: 'Portfolio', route: '/portfolio', match: /^\/portfolio/ },
    ...(isAgent
      ? [{ label: 'Clients', route: '/clients', match: /^\/clients/ }]
      : []),
    { label: 'How It Works', route: '/how-it-works', match: /^\/how-it-works/ },
    { label: 'About', route: '/about', match: /^\/about/ },
    { label: 'Partners', route: '/partners', match: /^\/partners/ },
    { label: 'Contact', route: '/contact', match: /^\/contact/ },
  ];

  const displayName =
    profile?.full_name ||
    currentUser?.displayName ||
    (currentUser?.email && !currentUser.email.endsWith('@realshare.test')
      ? currentUser.email.split('@')[0]
      : currentUser
      ? 'Investor'
      : '');

  const submitSearch = () => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}` as any);
    } else {
      router.push('/search' as any);
    }
  };

  return (
    <>
      {/* Logo — OUTSIDE all RN Web Views so nothing can clip it */}
      {Platform.OS === 'web' && (
        <div
          onClick={() => router.push('/' as any)}
          style={{
            position: 'fixed',
            top: 0,
            left: isTablet ? 16 : 48,
            width: isTablet ? 90 : 105,
            height: isTablet ? 80 : 90,
            backgroundColor: '#fff',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 4,
            borderBottomLeftRadius: 8,
            borderBottomRightRadius: 8,
            boxShadow: '0 4px 10px rgba(0,0,0,0.12)',
            zIndex: 9999,
            cursor: 'pointer',
          }}
        >
          <img
            src={require('../../../assets/logo.png')}
            alt="Realshare"
            style={{ width: '115%', height: '115%', objectFit: 'contain' }}
          />
        </div>
      )}

      <View style={[styles.container, isTablet && { overflow: 'hidden' }]}>
        {/* Top Gold Header - Sticky */}
        <View style={styles.topHeader}>
          {/* Native-only logo */}
          {Platform.OS !== 'web' && (
            <TouchableOpacity
              style={[styles.brand, isTablet && { left: 16, width: 90, height: 110 }]}
              onPress={() => router.push('/' as any)}
              activeOpacity={1}
            >
              <Image
                source={require('../../../assets/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </TouchableOpacity>
          )}

          <View style={styles.inner}>
            {/* Brand spacer */}
            <View style={[styles.brandPlaceholder, isTablet && { width: 90, marginRight: 8 }]} />

          {/* Primary nav */}
          <View style={[styles.navLinks, { gap: isTablet ? 8 : 32 }]}>
            {navItems.map((item) => {
              const active = item.match.test(pathname);
              return (
                <TouchableOpacity
                  key={item.route}
                  onPress={() => router.push(item.route as any)}
                  style={styles.navLink}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.navLabel, isTablet && { fontSize: 12 }, active && styles.navLabelActive]}>
                    {item.label}
                  </Text>
                  {active && <View style={styles.navUnderline} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Account */}
          {currentUser ? (
            <TouchableOpacity
              style={styles.accountSub}
              onPress={() => router.push('/(tabs)/profile' as any)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={GoldSystem.goldGradient}
                style={[styles.avatar, styles.avatarRing]}
              >
                <Text style={styles.avatarText}>
                  {(displayName || 'U').charAt(0).toUpperCase()}
                </Text>
              </LinearGradient>
              <Text style={styles.accountNameTop} numberOfLines={1}>
                {displayName}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => router.push('/sign-in' as any)}
              activeOpacity={0.85}
              style={styles.signInBtn}
            >
                <Text style={styles.signInText}>Sign In</Text>
            </TouchableOpacity>
          )}

          {/* Notifications */}
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push('/notifications' as any)}
            activeOpacity={0.7}
          >
            {hasUnread && <View style={styles.dot} />}
            <Ionicons
              name="notifications-outline"
              size={21}
              color={Neutrals.white}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    ...(Platform.OS === 'web' ? ({ overflow: 'visible', position: 'relative' } as any) : {}),
  },
  topHeader: {
    backgroundColor: GoldSystem.darkGold,
    ...(Platform.OS === 'web'
      ? ({
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 2px 8px rgba(0,0,0,0.14)',
          overflow: 'visible',
        } as any)
      : {}),
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 68,
    width: '100%',
    paddingHorizontal: 16,
    gap: 6,
    position: 'relative',
    zIndex: 10,
    ...(Platform.OS === 'web' ? ({ overflow: 'visible' } as any) : {}),
  },
  brandPlaceholder: {
    width: 145,
    marginRight: 12,
  },
  brand: {
    ...(Platform.OS === 'web'
      ? ({
          position: 'fixed',
          top: 0,
          left: 16,
          zIndex: 9999,
        } as any)
      : {
          position: 'absolute',
          top: 0,
          left: 16,
          zIndex: 200,
        }),
    width: 110,
    height: 130,
    backgroundColor: Neutrals.white,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    borderBottomLeftRadius: Radius.md,
    borderBottomRightRadius: Radius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  navLinks: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
    height: '100%',
  },
  navLink: {
    paddingHorizontal: 10,
    height: '100%',
    justifyContent: 'center',
    position: 'relative',
  },
  navLabel: {
    ...Typography.labelLarge,
    fontSize: 16,
    color: GoldSystem.paleGold,
  },
  navLabelActive: {
    color: Neutrals.white,
    fontWeight: '700',
  },
  navUnderline: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 0,
    height: 3,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    backgroundColor: Neutrals.white,
  },
  spacer: {
    flex: 1,
    minWidth: 16,
  },
  locationDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 8,
  },
  locationDropdownText: {
    ...Typography.labelLarge,
    fontSize: 15,
    color: Neutrals.obsidian,
  },
  subHeader: {
    backgroundColor: Neutrals.white,
    position: 'relative',
    zIndex: 1,
  },
  subHeaderInner: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 58,
    width: '100%',
    paddingHorizontal: 16,
    gap: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    height: 42,
    flex: 1,
    maxWidth: 350,
    borderRadius: Radius.full,
    backgroundColor: Neutrals.gray100,
    borderWidth: 1,
    borderColor: Neutrals.gray200,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Neutrals.text,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Neutrals.ruby,
    zIndex: 2,
  },
  accountSub: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 4,
    paddingRight: 16,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    maxWidth: 220,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRing: {
    borderWidth: 2,
    borderColor: Neutrals.white,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: Neutrals.white,
  },
  accountNameTop: {
    ...Typography.labelMedium,
    fontSize: 14,
    color: Neutrals.white,
    flexShrink: 1,
  },
  signInBtn: {
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: Radius.full,
    backgroundColor: '#FFFFFF',
  },
  signInText: {
    ...Typography.labelLarge,
    color: GoldSystem.darkGold,
    fontWeight: '700',
  },
});

export default DesktopNav;
