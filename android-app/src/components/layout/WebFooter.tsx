import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Neutrals, GoldSystem, Typography, Radius } from '@/constants/design';

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
  return (
    <TouchableOpacity onPress={() => router.push(href as any)} activeOpacity={0.7}>
      <Text style={styles.link}>{label}</Text>
    </TouchableOpacity>
  );
}

export function WebFooter() {
  return (
    <View style={styles.footer}>
      <View style={styles.inner}>
        <View style={styles.columns}>
          <View style={styles.brandCol}>
            <View style={styles.brandRow}>
              <Image source={require('../../../assets/logo.png')} style={styles.logo} />
              <Text style={styles.brandName}>RealShare</Text>
            </View>
            <Text style={styles.brandBlurb}>
              Fractional ownership in premium real estate — co-own commercial and
              holiday properties, earn rental income, and exit with ease.
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

        <View style={styles.bottomBar}>
          <Text style={styles.copyright}>© {new Date().getFullYear()} RealShare. All rights reserved.</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    backgroundColor: Neutrals.obsidian,
    marginTop: 40,
  },
  inner: {
    width: '100%',
    paddingHorizontal: 40,
    paddingTop: 48,
    paddingBottom: 24,
  },
  columns: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 32,
  },
  brandCol: {
    flexBasis: 280,
    flexGrow: 1,
    marginRight: 16,
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
    marginTop: 32,
    paddingTop: 20,
  },
  copyright: {
    ...Typography.caption,
    color: Neutrals.gray500,
  },
});

export default WebFooter;
