import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform, Linking, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Neutrals, GoldSystem, Typography, Radius } from '@/constants/design';
import { useResponsive } from '@/hooks/useResponsive';

// ---- Placeholder URLs — swap these once published ----
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.realshare.app';
const APP_STORE_URL  = 'https://apps.apple.com/app/realshare/id0000000000'; // update id later

/** Compact store badge with brand colors and hover scale (web). */
function StoreBadge({ icon, label, url, size = 'normal' }: { icon: 'logo-google-playstore' | 'logo-apple'; label: string; url: string; size?: 'small' | 'normal' }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isSmall = size === 'small';
  const isPlayStore = icon === 'logo-google-playstore';

  const onHoverIn = () => {
    Animated.spring(scaleAnim, { toValue: 1.08, useNativeDriver: true, speed: 20, bounciness: 12 }).start();
  };
  const onHoverOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 12 }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => Linking.openURL(url)}
      {...(Platform.OS === 'web' ? { onMouseEnter: onHoverIn, onMouseLeave: onHoverOut } as any : {})}
    >
      <Animated.View
        style={[
          storeBadgeStyles.pill,
          isSmall && storeBadgeStyles.pillSmall,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        {isPlayStore ? (
          <Image 
            source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Google_Play_Arrow_logo.svg' }} 
            style={{ width: isSmall ? 14 : 16, height: isSmall ? 14 : 16 }} 
            resizeMode="contain" 
          />
        ) : (
          <Ionicons name={icon} size={isSmall ? 14 : 16} color="#FFFFFF" />
        )}
        <Text style={[storeBadgeStyles.text, isSmall && storeBadgeStyles.textSmall, { color: '#FFFFFF' }]}>{label}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const storeBadgeStyles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  pillSmall: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 5,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    color: Neutrals.gray300,
    letterSpacing: 0.2,
  },
  textSmall: {
    fontSize: 9,
  },
});

/**
 * Web-only informational footer (About, How It Works, Contact, Partner
 * With Us, Privacy Policy, Terms of Service, plus a copyright/address bar).
 *
 * NOT auto-rendered by WebShell -- WebShell's 'page' tier body is `flex:1`
 * and most screens fill it with their own full-height ScrollView, so a
 * footer sibling there would render with zero height. Instead this is
 * mounted explicitly, per-screen, at the end of that screen's own
 * ScrollView content. Currently wired into the Home screen only
 * (`(tabs)/index.tsx`, gated on `isDesktop`) for discoverability; the new
 * marketing/legal pages (about.tsx, how-it-works.tsx, contact.tsx,
 * partners.tsx, and LegalPageLayout for the two legal pages) each mount
 * their own copy at the bottom of their content too. Add it the same way
 * to any other screen that should end with it.
 *
 * Every route WebFooter links to (about, how-it-works, contact, partners,
 * privacy-policy, terms-of-service) is itself guarded with
 * `if (Platform.OS !== 'web') return <Redirect href="/" />;`, so this
 * component -- and everything it links to -- never surfaces on native.
 */

interface FooterLinkProps {
  label: string;
  href: string;
}

function FooterLink({ label, href }: FooterLinkProps) {
  const router = useRouter();
  const { isDesktop } = useResponsive();
  return (
    <TouchableOpacity onPress={() => router.push(href as any)} activeOpacity={0.7}>
      <Text style={[styles.link, !isDesktop && { marginBottom: 4, fontSize: 11 }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function WebFooter() {
  const { isDesktop } = useResponsive();
  const router = useRouter();

  if (!isDesktop) {
    // Ultra-compact mobile footer
    return (
      <View style={{ backgroundColor: Neutrals.obsidian, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image source={require('../../../assets/logo.png')} style={{ width: 16, height: 16, marginRight: 6 }} resizeMode="contain" />
            <Text style={{ color: Neutrals.surface, fontSize: 13, fontWeight: '700' }}>Realshare</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity onPress={() => router.push('/privacy-policy' as any)}><Text style={{ color: Neutrals.gray400, fontSize: 10 }}>Privacy</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/terms-of-service' as any)}><Text style={{ color: Neutrals.gray400, fontSize: 10 }}>Terms</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/disclaimer' as any)}><Text style={{ color: Neutrals.gray400, fontSize: 10 }}>Disclaimer</Text></TouchableOpacity>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 16, marginTop: 8, marginBottom: 8 }}>
          <TouchableOpacity onPress={() => Linking.openURL('https://www.facebook.com/RealshareProperties/')}><Ionicons name="logo-facebook" size={16} color={Neutrals.gray400} /></TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL('https://www.instagram.com/realshare_properties/')}><Ionicons name="logo-instagram" size={16} color={Neutrals.gray400} /></TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL('https://www.linkedin.com/in/realshare-properties-7a96a1344/')}><Ionicons name="logo-linkedin" size={16} color={Neutrals.gray400} /></TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL('https://x.com/Realshare_Prop')}><Ionicons name="logo-twitter" size={16} color={Neutrals.gray400} /></TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL('https://in.pinterest.com/Realshare_Properties')}><Ionicons name="logo-pinterest" size={16} color={Neutrals.gray400} /></TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL('https://www.youtube.com/@RealshareProperties')}><Ionicons name="logo-youtube" size={16} color={Neutrals.gray400} /></TouchableOpacity>
        </View>
        {Platform.OS === 'web' && (
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
            <StoreBadge icon="logo-google-playstore" label="Play Store" url={PLAY_STORE_URL} size="small" />
            <StoreBadge icon="logo-apple" label="App Store" url={APP_STORE_URL} size="small" />
          </View>
        )}
        <Text style={{ color: Neutrals.gray500, fontSize: 9, lineHeight: 13 }}>{"Realshare Properties Pvt. Ltd.\nNizampet, Hyderabad – 500090, TS  ·  +91 40 4010 1212\n+91 95 8172 8172"}</Text>
        <Text style={{ color: Neutrals.gray600, fontSize: 8, marginTop: 6 }}>© {new Date().getFullYear()} Realshare. All rights reserved.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.footer, { marginTop: 40 }]}>
      <View style={[styles.inner, { paddingHorizontal: 40, paddingTop: 48, paddingBottom: 24 }]}>
        <View style={[styles.columns, { gap: 32 }]}>
          <View style={[styles.brandCol, { marginRight: 16 }]}>
            <View style={styles.brandRow}>
              <Image source={require('../../../assets/logo.png')} style={styles.logo} />
              <Text style={styles.brandName}>Realshare</Text>
            </View>
            <Text style={styles.brandBlurb}>
              A new age Intelligent platform bringing Homes that Inspire Life. Earn rental income with commercial and Holiday properties. Invest in premium Realestate with fractional ownership and exit with ease.
            </Text>
            <View style={{ flexDirection: 'row', gap: 16, marginTop: 24 }}>
              <TouchableOpacity onPress={() => Linking.openURL('https://www.facebook.com/RealshareProperties/')}><Ionicons name="logo-facebook" size={20} color={Neutrals.gray400} /></TouchableOpacity>
              <TouchableOpacity onPress={() => Linking.openURL('https://www.instagram.com/realshare_properties/')}><Ionicons name="logo-instagram" size={20} color={Neutrals.gray400} /></TouchableOpacity>
              <TouchableOpacity onPress={() => Linking.openURL('https://www.linkedin.com/in/realshare-properties-7a96a1344/')}><Ionicons name="logo-linkedin" size={20} color={Neutrals.gray400} /></TouchableOpacity>
              <TouchableOpacity onPress={() => Linking.openURL('https://x.com/Realshare_Prop')}><Ionicons name="logo-twitter" size={20} color={Neutrals.gray400} /></TouchableOpacity>
              <TouchableOpacity onPress={() => Linking.openURL('https://in.pinterest.com/Realshare_Properties')}><Ionicons name="logo-pinterest" size={20} color={Neutrals.gray400} /></TouchableOpacity>
              <TouchableOpacity onPress={() => Linking.openURL('https://www.youtube.com/@RealshareProperties')}><Ionicons name="logo-youtube" size={20} color={Neutrals.gray400} /></TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <StoreBadge icon="logo-google-playstore" label="Play Store" url={PLAY_STORE_URL} />
              <StoreBadge icon="logo-apple" label="App Store" url={APP_STORE_URL} />
            </View>
          </View>

          <View style={styles.col}>
            <Text style={styles.colTitle}>Learn</Text>
            <FooterLink label="How It Works" href="/how-it-works" />
            <FooterLink label="About Us" href="/about" />
            <FooterLink label="FAQs" href="/support" />
          </View>

          <View style={styles.col}>
            <Text style={styles.colTitle}>Company</Text>
            <FooterLink label="Contact Us" href="/contact" />
            <FooterLink label="Partner With Us" href="/partners" />
          </View>

          <View style={styles.col}>
            <Text style={styles.colTitle}>Legal</Text>
            <FooterLink label="Privacy Policy" href="/privacy-policy" />
            <FooterLink label="Terms of Service" href="/terms-of-service" />
            <FooterLink label="Disclaimer" href="/disclaimer" />
          </View>

          <View style={[styles.col, { flexBasis: 240 }]}>
            <Text style={styles.colTitle}>Registered Office</Text>
            <Text style={styles.addressText}>
              <Text numberOfLines={1} adjustsFontSizeToFit style={Platform.OS === 'web' ? { whiteSpace: 'nowrap' } as any : {}}>Realshare Properties Pvt. Ltd.</Text>{'\n'}
              206, Panchsheel Complex, Nizampet{'\n'}
              Hyderabad – 500090, Telangana, India
            </Text>
            <Text style={styles.addressText}>+91 40 4010 1212{'\n'}+91 95 8172 8172</Text>
          </View>
        </View>

        <View style={[styles.bottomBar, { marginTop: 32, paddingTop: 20 }]}>
          <Text style={styles.copyright}>All trademarks, logos and names are properties of their respective owners. All rights reserved. © Copyright {new Date().getFullYear()} Realshare Properties Pvt Ltd</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    backgroundColor: Neutrals.obsidian,
  },
  inner: {
    width: '100%',
  },
  columns: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  brandCol: {
    flexBasis: 280,
    flexGrow: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  logo: {
    width: 28,
    height: 28,
    marginRight: 8,
    resizeMode: 'contain',
  },
  brandName: {
    ...Typography.headlineMedium,
    color: Neutrals.surface,
  },
  brandBlurb: {
    ...Typography.bodyMedium,
    color: Neutrals.gray400,
    lineHeight: 20,
    maxWidth: 320,
  },
  col: {
    flexBasis: 160,
    flexGrow: 1,
  },
  colTitle: {
    ...Typography.labelLarge,
    color: GoldSystem.primaryGold,
    marginBottom: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  link: {
    ...Typography.bodyMedium,
    color: Neutrals.gray300,
    marginBottom: 12,
  },
  addressText: {
    ...Typography.bodyMedium,
    color: Neutrals.gray400,
    lineHeight: 20,
    marginBottom: 8,
  },
  bottomBar: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  copyright: {
    ...Typography.caption,
    color: Neutrals.gray500,
    textAlign: 'center',
  },
});

export default WebFooter;
