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
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Neutrals, GoldSystem, Typography, Radius } from '@/constants/design';
import { useUser } from '@/contexts/UserContext';
import { useLocation } from '@/contexts/LocationContext';
import { LocationPickerModal } from '@/components/ui/LocationPickerModal';
import { auth } from '@/lib/firebase';

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
  const { profile } = useUser();
  const { city } = useLocation();
  const [query, setQuery] = React.useState('');
  const [showLocationPicker, setShowLocationPicker] = React.useState(false);

  const currentUser = auth.currentUser;
  const isAgent = profile?.role === 'agent';

  const navItems: NavItem[] = [
    { label: 'Home', route: '/', match: /^\/$|^\/\(tabs\)$/ },
    { label: 'Explore', route: '/explore', match: /^\/explore/ },
    { label: 'Properties', route: '/shortlist', match: /^\/shortlist/ },
    { label: 'Portfolio', route: '/portfolio', match: /^\/portfolio/ },
    ...(isAgent
      ? [{ label: 'Clients', route: '/clients', match: /^\/clients/ }]
      : []),
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
    router.push('/search' as any);
  };

  return (
    <View style={styles.bar}>
      <View style={styles.inner}>
        {/* Brand */}
        <TouchableOpacity
          style={styles.brand}
          onPress={() => router.push('/' as any)}
          activeOpacity={0.7}
        >
          <Image
            source={require('../../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </TouchableOpacity>

        {/* Primary nav */}
        <View style={styles.navLinks}>
          {navItems.map((item) => {
            const active = item.match.test(pathname);
            return (
              <TouchableOpacity
                key={item.route}
                onPress={() => router.push(item.route as any)}
                style={styles.navLink}
                activeOpacity={0.7}
              >
                <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                  {item.label}
                </Text>
                {active && <View style={styles.navUnderline} />}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.spacer} />

        {/* Location */}
        <TouchableOpacity style={styles.locationChip} activeOpacity={0.7} onPress={() => setShowLocationPicker(true)}>
          <Ionicons
            name="location-outline"
            size={15}
            color={GoldSystem.primaryGold}
          />
          <Text style={styles.locationText}>{city}</Text>
          <Ionicons name="chevron-down" size={13} color={Neutrals.gray500} />
        </TouchableOpacity>
        <LocationPickerModal visible={showLocationPicker} onClose={() => setShowLocationPicker(false)} />

        {/* Search */}
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={16} color={Neutrals.gray400} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={submitSearch}
            placeholder="Search properties, localities…"
            placeholderTextColor={Neutrals.gray400}
            style={styles.searchInput as any}
            returnKeyType="search"
          />
        </View>

        {/* Notifications */}
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => router.push('/notifications' as any)}
          activeOpacity={0.7}
        >
          <View style={styles.dot} />
          <Ionicons
            name="notifications-outline"
            size={21}
            color={Neutrals.obsidian}
          />
        </TouchableOpacity>

        {/* Account */}
        {currentUser ? (
          <TouchableOpacity
            style={styles.account}
            onPress={() => router.push('/profile' as any)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={GoldSystem.goldGradient}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>
                {(displayName || 'U').charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
            <Text style={styles.accountName} numberOfLines={1}>
              {displayName}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => router.push('/sign-in' as any)}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={GoldSystem.goldGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.signInBtn}
            >
              <Text style={styles.signInText}>Sign In</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: Neutrals.surface,
    borderBottomWidth: 1,
    borderBottomColor: Neutrals.border,
    ...(Platform.OS === 'web'
      ? ({
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 1px 3px rgba(16,24,40,0.04)',
        } as any)
      : {}),
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 68,
    width: '100%',
    maxWidth: 1240,
    alignSelf: 'center',
    paddingHorizontal: 28,
    gap: 8,
  },
  brand: {
    marginRight: 28,
  },
  logo: {
    width: 132,
    height: 38,
  },
  navLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: '100%',
  },
  navLink: {
    paddingHorizontal: 14,
    height: '100%',
    justifyContent: 'center',
    position: 'relative',
  },
  navLabel: {
    ...Typography.labelLarge,
    fontSize: 15,
    color: Neutrals.gray600,
  },
  navLabelActive: {
    color: Neutrals.obsidian,
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
    backgroundColor: GoldSystem.metallicGold,
  },
  spacer: {
    flex: 1,
    minWidth: 16,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Neutrals.gray100,
  },
  locationText: {
    ...Typography.labelMedium,
    fontSize: 13,
    color: Neutrals.text,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    height: 40,
    width: 260,
    borderRadius: Radius.full,
    backgroundColor: Neutrals.gray100,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
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
  account: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingLeft: 6,
    paddingRight: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: Neutrals.gray100,
    maxWidth: 190,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: Neutrals.white,
  },
  accountName: {
    ...Typography.labelMedium,
    fontSize: 13,
    color: Neutrals.text,
    flexShrink: 1,
  },
  signInBtn: {
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: Radius.full,
  },
  signInText: {
    ...Typography.labelLarge,
    color: Neutrals.obsidian,
    fontWeight: '700',
  },
});

export default DesktopNav;
