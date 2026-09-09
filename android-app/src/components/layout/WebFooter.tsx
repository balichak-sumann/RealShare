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
  const { isDesktop } = useResponsive();
  return (
    <TouchableOpacity onPress={() => router.push(href as any)} activeOpacity={0.7}>
      <Text style={[styles.link, !isDesktop && { marginBottom: 4, fontSize: 11 }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function WebFooter() {
  const { isDesktop } = useResponsive();
  return (
    <View style={[styles.footer, isDesktop && { marginTop: 40 }]}>
      <View style={[
        styles.inner, 
        isDesktop ? { paddingHorizontal: 40, paddingTop: 48, paddingBottom: 24 } : { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 }
      ]}>
        <View style={[styles.columns, isDesktop ? { gap: 32 } : { gap: 8 }]}>
          <View style={[styles.brandCol, isDesktop && { marginRight: 16 }, !isDesktop && { flexBasis: '100%', marginBottom: 2 }]}>
            <View style={[styles.brandRow, !isDesktop && { marginBottom: 2 }]}>
              <Image source={require('../../../assets/logo.png')} style={[styles.logo, !isDesktop && { width: 18, height: 18 }]} />
              <Text style={[styles.brandName, !isDesktop && { fontSize: 16 }]}>RealShare</Text>
            </View>
            {isDesktop && (
              <Text style={styles.brandBlurb}>
                A new age Intelligent platform bringing Homes that Inspire Life. Earn rental income with commercial and Holiday properties. Invest in premium Realestate with fractional ownership and exit with ease.
              </Text>
            )}
          </View>

          {isDesktop && (
            <>
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
            </>
          )}

          <View style={[styles.col, !isDesktop && { flexBasis: '45%' }]}>
            <Text style={[styles.colTitle, !isDesktop && { marginBottom: 4, fontSize: 10 }]}>Legal</Text>
            <FooterLink label="Privacy Policy" href="/privacy-policy" />
            <FooterLink label="Terms of Service" href="/terms-of-service" />
          </View>

          <View style={[styles.col, !isDesktop && { flexBasis: '50%' }]}>
            <Text style={[styles.colTitle, !isDesktop && { marginBottom: 4, fontSize: 10 }]}>Registered Office</Text>
            <Text style={[styles.addressText, !isDesktop && { fontSize: 10, lineHeight: 14, marginBottom: 2 }]}>
              {isDesktop 
                ? "RealShare Properties Pvt. Ltd.\n206, Panchsheel Complex, Nizampet\nHyderabad – 500090, Telangana, India"
                : "RealShare Properties Pvt. Ltd., 206, Panchsheel Complex, Nizampet, Hyderabad – 500090, TS, India"}
            </Text>
            <Text style={[styles.addressText, !isDesktop && { fontSize: 10 }]}>+91 40 4010 1212</Text>
          </View>
        </View>

        <View style={[styles.bottomBar, isDesktop ? { marginTop: 32, paddingTop: 20 } : { marginTop: 8, paddingTop: 8 }]}>
          <Text style={[styles.copyright, !isDesktop && { fontSize: 9 }]}>All trademarks, logos and names are properties of their respective owners. All rights reserved. © {new Date().getFullYear()} Realshare Properties</Text>
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
