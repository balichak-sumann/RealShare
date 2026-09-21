import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform, Linking, Animated, useWindowDimensions } from 'react-native';
import { useRouter, Link } from 'expo-router';
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
 * Fully adaptive: mobile (<768px), tablet (768-1099px), desktop (>=1100px).
 */

interface FooterLinkProps {
  label: string;
  href: string;
}

function FooterLink({ label, href }: FooterLinkProps) {
  const router = useRouter();
  const { isDesktop, isTablet } = useResponsive();
  const isWide = isDesktop || isTablet;
  return (
    <TouchableOpacity onPress={() => router.push(href as any)} activeOpacity={0.7}>
      <Text style={[styles.link, !isWide && { marginBottom: 4, fontSize: 11 }]}>{label}</Text>
    </TouchableOpacity>
  );
}

/** Social media icons row */
function SocialIcons({ size = 20 }: { size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: size === 16 ? 16 : 14, flexWrap: 'wrap' }}>
      <TouchableOpacity onPress={() => Linking.openURL('https://www.facebook.com/RealshareProperties/')}><Ionicons name="logo-facebook" size={size} color={Neutrals.gray400} /></TouchableOpacity>
      <TouchableOpacity onPress={() => Linking.openURL('https://www.instagram.com/realshare_properties/')}><Ionicons name="logo-instagram" size={size} color={Neutrals.gray400} /></TouchableOpacity>
      <TouchableOpacity onPress={() => Linking.openURL('https://www.linkedin.com/in/realshare-properties-7a96a1344/')}><Ionicons name="logo-linkedin" size={size} color={Neutrals.gray400} /></TouchableOpacity>
      <TouchableOpacity onPress={() => Linking.openURL('https://x.com/Realshare_Prop')}><Ionicons name="logo-twitter" size={size} color={Neutrals.gray400} /></TouchableOpacity>
      <TouchableOpacity onPress={() => Linking.openURL('https://in.pinterest.com/Realshare_Properties')}><Ionicons name="logo-pinterest" size={size} color={Neutrals.gray400} /></TouchableOpacity>
      <TouchableOpacity onPress={() => Linking.openURL('https://www.youtube.com/@RealshareProperties')}><Ionicons name="logo-youtube" size={size} color={Neutrals.gray400} /></TouchableOpacity>
    </View>
  );
}

export function WebFooter() {
  const { isDesktop, isTablet, isMobile, width } = useResponsive();
  const router = useRouter();
  const isWide = isDesktop || isTablet;

  if (isMobile) {
    // Ultra-compact mobile footer
    return (
      <View style={{ backgroundColor: Neutrals.obsidian, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image source={require('../../../assets/logo.png')} style={{ width: 16, height: 16, marginRight: 6 }} resizeMode="contain" />
            <Text style={{ color: Neutrals.surface, fontSize: 13, fontWeight: '700' }}>Realshare</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Link href="/privacy-policy" asChild>
              <TouchableOpacity><Text style={{ color: Neutrals.gray400, fontSize: 10 }}>Privacy</Text></TouchableOpacity>
            </Link>
            <Link href="/terms-of-service" asChild>
              <TouchableOpacity><Text style={{ color: Neutrals.gray400, fontSize: 10 }}>Terms</Text></TouchableOpacity>
            </Link>
            <Link href="/disclaimer" asChild>
              <TouchableOpacity><Text style={{ color: Neutrals.gray400, fontSize: 10 }}>Disclaimer</Text></TouchableOpacity>
            </Link>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 16, marginTop: 8, marginBottom: 8 }}>
          <SocialIcons size={16} />
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

  // Tablet: 2-column grid for link sections, full-width brand + address
  // Desktop: 5-column single row
  const isNarrowTablet = isTablet && width < 900;

  return (
    <View style={[styles.footer, { marginTop: 40 }]}>
      <View style={[styles.inner, { paddingHorizontal: isTablet ? 24 : 40, paddingTop: isTablet ? 36 : 48, paddingBottom: 24 }]}>
        
        {/* Main columns area */}
        <View style={[styles.columns, { gap: isTablet ? 20 : 32 }]}>
          
          {/* Brand column — full width on tablet, flex on desktop */}
          <View style={[
            styles.brandCol, 
            { marginRight: isDesktop ? 16 : 0 },
            isTablet && { flexBasis: '100%', marginBottom: 24 },
          ]}>
            <View style={styles.brandRow}>
              <Image source={require('../../../assets/logo.png')} style={styles.logo} />
              <Text style={styles.brandName}>Realshare</Text>
            </View>
            <Text style={[styles.brandBlurb, isTablet && { maxWidth: '100%' }]}>
              A new age Intelligent platform bringing Homes that Inspire Life. Earn rental income with commercial and Holiday properties. Invest in premium Realestate with fractional ownership and exit with ease.
            </Text>
            <View style={{ flexDirection: 'row', gap: 16, marginTop: 24 }}>
              <SocialIcons size={20} />
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <StoreBadge icon="logo-google-playstore" label="Play Store" url={PLAY_STORE_URL} />
              <StoreBadge icon="logo-apple" label="App Store" url={APP_STORE_URL} />
            </View>
          </View>

          {/* Link columns — on tablet these wrap into a 2×2 grid, on desktop they're in a row */}
          <View style={[
            styles.col, 
            isTablet && { flexBasis: isNarrowTablet ? '45%' : '22%', minWidth: 140 },
          ]}>
            <Text style={styles.colTitle}>Learn</Text>
            <FooterLink label="How It Works" href="/how-it-works" />
            <FooterLink label="About Us" href="/about" />
            <FooterLink label="FAQs" href="/support" />
          </View>

          <View style={[
            styles.col,
            isTablet && { flexBasis: isNarrowTablet ? '45%' : '22%', minWidth: 140 },
          ]}>
            <Text style={styles.colTitle}>Company</Text>
            <FooterLink label="Contact Us" href="/contact" />
            <FooterLink label="Partner With Us" href="/partners" />
          </View>

          <View style={[
            styles.col,
            isTablet && { flexBasis: isNarrowTablet ? '45%' : '22%', minWidth: 140 },
          ]}>
            <Text style={styles.colTitle}>Legal</Text>
            <FooterLink label="Privacy Policy" href="/privacy-policy" />
            <FooterLink label="Terms of Service" href="/terms-of-service" />
            <FooterLink label="Disclaimer" href="/disclaimer" />
          </View>

          {/* Address column — adapts width to content, never wraps text */}
          <View style={[
            styles.col, 
            { flexBasis: isDesktop ? 260 : isNarrowTablet ? '45%' : '22%', minWidth: 200, flexShrink: 0 },
          ]}>
            <Text style={styles.colTitle}>Registered Office</Text>
            <Text style={styles.addressText}>
              Realshare Properties Pvt. Ltd.{'\n'}
              206, Panchsheel Complex, Nizampet{'\n'}
              Hyderabad – 500090, Telangana, India
            </Text>
            <Text style={styles.addressText}>+91 40 4010 1212{'\n'}+91 95 8172 8172</Text>
          </View>
        </View>

        <View style={[styles.bottomBar, { marginTop: isTablet ? 24 : 32, paddingTop: 20 }]}>
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
    maxWidth: 1400,
    alignSelf: 'center',
  },
  columns: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  brandCol: {
    flexBasis: 280,
    flexGrow: 1,
    flexShrink: 1,
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
    flexBasis: 140,
    flexGrow: 1,
    flexShrink: 1,
    marginBottom: 16,
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
