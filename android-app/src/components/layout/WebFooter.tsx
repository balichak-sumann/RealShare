import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Neutrals, GoldSystem, Typography, Radius } from '@/constants/design';
import { useResponsive } from '@/hooks/useResponsive';

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
            <Text style={{ color: Neutrals.surface, fontSize: 13, fontWeight: '700' }}>RealShare</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity onPress={() => router.push('/privacy-policy' as any)}><Text style={{ color: Neutrals.gray400, fontSize: 10 }}>Privacy</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/terms-of-service' as any)}><Text style={{ color: Neutrals.gray400, fontSize: 10 }}>Terms</Text></TouchableOpacity>
          </View>
        </View>
        <Text style={{ color: Neutrals.gray500, fontSize: 9, lineHeight: 13 }}>{"RealShare Properties Pvt. Ltd.\nNizampet, Hyderabad – 500090, TS  ·  +91 40 4010 1212"}</Text>
        <Text style={{ color: Neutrals.gray600, fontSize: 8, marginTop: 6 }}>© {new Date().getFullYear()} Realshare Properties. All rights reserved.</Text>
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
              <Text style={styles.brandName}>RealShare</Text>
            </View>
            <Text style={styles.brandBlurb}>
              A new age Intelligent platform bringing Homes that Inspire Life. Earn rental income with commercial and Holiday properties. Invest in premium Realestate with fractional ownership and exit with ease.
            </Text>
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
          </View>

          <View style={styles.col}>
            <Text style={styles.colTitle}>Registered Office</Text>
            <Text style={styles.addressText}>
              RealShare Properties Pvt. Ltd.{'\n'}
              206, Panchsheel Complex, Nizampet{'\n'}
              Hyderabad – 500090, Telangana, India
            </Text>
            <Text style={styles.addressText}>+91 40 4010 1212</Text>
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
