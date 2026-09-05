import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';
import { useResponsive } from '@/hooks/useResponsive';
import { WebFooter } from '@/components/layout/WebFooter';

const STEPS = [
  { icon: 'people-outline', title: 'Investor Pool', desc: 'A group of investors joins to form a pool and invest in the project together.' },
  { icon: 'document-text-outline', title: 'Acquire Investor Share', desc: 'Commercial property, flats or villas in the project are acquired as an investor share, typically at a discount to market price.' },
  { icon: 'pie-chart-outline', title: 'Fractional Ownership', desc: 'Your investment is secured by fractional ownership of the property, recorded and tracked in your portfolio.' },
  { icon: 'camera-outline', title: 'Returns Distribution', desc: 'Rental and yield returns are credited to your bank account periodically, depending on project terms.' },
] as const;

const TRUST_BADGES = [
  { icon: 'business-outline', title: 'Late-Stage Projects', desc: 'We favor advanced projects where a majority of structural work is already complete.' },
  { icon: 'thumbs-up-outline', title: '100% Asset Backing', desc: "Every investment is backed by a real, tangible asset acquired as surety." },
  { icon: 'cash-outline', title: 'Prime Locations', desc: 'We invest only in high-demand, gated-community projects in top locations.' },
  { icon: 'shield-checkmark-outline', title: 'RERA Approved Projects', desc: 'We only invest in RERA-approved projects, and only after approvals are in place.' },
] as const;

const HOLIDAY_FEATURES = [
  { title: 'Turnkey Design', desc: 'Holiday properties are outfitted with premium furnishings, essentials and high-end décor.' },
  { title: 'Support', desc: 'A dedicated property management team provides service before, during and after your stay.' },
  { title: 'Simple Scheduling', desc: 'Book stays easily in the RealShare owner app and enjoy your home for allotted days each year.' },
  { title: 'Resale', desc: 'Sell your property share at a time and price of your choosing.' },
  { title: 'Property Management', desc: "We fully manage every aspect of the property — from maintenance to billing." },
  { title: 'Rental Income', desc: 'Earn a fixed monthly rental income on your property when you are not using it.' },
] as const;

const FUTURE_MARKETS = {
  international: ['Bali', 'Bangkok', 'Vietnam', 'Miami', 'Los Angeles', 'New York'],
  resorts: ['Goa', 'Udaipur', 'Pushkar', 'Mangalore / Coorg', 'Manali'],
};

export default function HowItWorksScreen() {
  const router = useRouter();
  const { isDesktop } = useResponsive();

  if (Platform.OS !== 'web') {
    return <Redirect href="/" />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>How It Works</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={[styles.hero, isDesktop && styles.heroDesktop]}>
          <Text style={styles.heroKicker}>ACQUIRE INVESTOR SHARE IN TOP PROJECTS</Text>
          <Text style={styles.heroTitle}>Fractionalizing big real estate investments</Text>
        </View>

        <View style={[styles.section, isDesktop && styles.sectionDesktop]}>
          <View style={[styles.stepsRow, isDesktop && styles.stepsRowDesktop]}>
            {STEPS.map((step, i) => (
              <View key={step.title} style={[styles.stepCard, isDesktop && styles.stepCardDesktop]}>
                <View style={styles.stepIconWrap}>
                  <Ionicons name={step.icon as any} size={22} color={GoldSystem.primaryGold} />
                </View>
                <Text style={styles.stepNumber}>STEP {i + 1}</Text>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDesc}>{step.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.section, styles.tintSection]}>
          <View style={isDesktop ? styles.sectionDesktop : undefined}>
            <Text style={styles.sectionKicker}>100% ASSET BACKED</Text>
            <Text style={styles.sectionTitle}>Investment partnership with builders</Text>
            <View style={[styles.badgeGrid, isDesktop && styles.badgeGridDesktop]}>
              {TRUST_BADGES.map((b) => (
                <View key={b.title} style={[styles.badgeCard, isDesktop && styles.badgeCardDesktop]}>
                  <Ionicons name={b.icon as any} size={20} color={GoldSystem.darkGold} style={{ marginBottom: 8 }} />
                  <Text style={styles.badgeTitle}>{b.title}</Text>
                  <Text style={styles.badgeDesc}>{b.desc}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={[styles.section, isDesktop && styles.sectionDesktop]}>
          <Text style={styles.sectionTitle}>Own a grade-A commercial property and earn rental income</Text>
          <Text style={styles.bodyText}>
            Co-owning with RealShare is the smart choice for a commercial property. Co-own the
            property with a fractional investment and earn regular income. Purchase a share of
            your dream property, let RealShare take care of the hassles of renting — you earn a
            fixed monthly rental income and get exclusive access on the app.
          </Text>
        </View>

        <View style={[styles.section, styles.tintSection]}>
          <View style={isDesktop ? styles.sectionDesktop : undefined}>
            <Text style={styles.sectionTitle}>Own a luxury vacation property and earn rental income</Text>
            <Text style={styles.bodyText}>
              Co-owning with RealShare is the smart choice for a holiday property you'll enjoy
              throughout the year. Purchase a share of your dream property, let RealShare take
              care of the hassles of renting, and get exclusive access for you and your loved
              ones every year.
            </Text>
            <View style={[styles.badgeGrid, isDesktop && styles.badgeGridDesktop]}>
              {HOLIDAY_FEATURES.map((f) => (
                <View key={f.title} style={[styles.featureCard, isDesktop && styles.badgeCardDesktop]}>
                  <Text style={styles.badgeTitle}>{f.title}</Text>
                  <Text style={styles.badgeDesc}>{f.desc}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={[styles.section, isDesktop && styles.sectionDesktop]}>
          <Text style={styles.sectionTitle}>Effortless resale, with gains</Text>
          <Text style={styles.bodyText}>
            Part of owning a RealShare property is the flexibility to resell your share.
            RealShare properties have historically seen an average appreciation of 10–18% —
            about twice the appreciation of a traditional luxury vacation home or commercial
            property purchased outright.
          </Text>
        </View>

        <View style={styles.futureSection}>
          <View style={isDesktop ? styles.sectionDesktop : undefined}>
            <Text style={[styles.sectionTitle, { color: Neutrals.surface }]}>Where we're headed next</Text>
            <Text style={[styles.bodyText, { color: Neutrals.gray300 }]}>
              RealShare listings are currently live in Hyderabad only. International Collections
              and curated resort destinations are part of our roadmap — shown here so you know
              what's coming, not as properties available to invest in today.
            </Text>
            <Text style={styles.futureGroupLabel}>International Collections · Coming soon</Text>
            <View style={styles.chipRow}>
              {FUTURE_MARKETS.international.map((c) => (
                <View key={c} style={styles.chip}><Text style={styles.chipText}>{c}</Text></View>
              ))}
            </View>
            <Text style={[styles.futureGroupLabel, { marginTop: 20 }]}>Resort & Holiday Destinations · Coming soon</Text>
            <View style={styles.chipRow}>
              {FUTURE_MARKETS.resorts.map((c) => (
                <View key={c} style={styles.chip}><Text style={styles.chipText}>{c}</Text></View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.ctaRow}>
          <TouchableOpacity style={styles.ctaBtn} onPress={() => router.push('/(tabs)/explore')}>
            <Text style={styles.ctaBtnText}>Explore Hyderabad Properties</Text>
          </TouchableOpacity>
        </View>
        <WebFooter />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Neutrals.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, paddingTop: Platform.OS === 'web' ? 18 : 50,
    backgroundColor: Neutrals.surface, borderBottomWidth: 1, borderBottomColor: Neutrals.border,
  },
  backBtn: { padding: 8, marginLeft: -8 },
  backIcon: { fontSize: 24, color: Neutrals.obsidian },
  headerTitle: { ...Typography.headlineMedium, color: Neutrals.obsidian },
  hero: { paddingVertical: 40, paddingHorizontal: 24, alignItems: 'center' },
  heroDesktop: { paddingVertical: 56 },
  heroKicker: { ...Typography.labelMedium, color: GoldSystem.darkGold, marginBottom: 10, textAlign: 'center' },
  heroTitle: { ...Typography.displayMedium, color: Neutrals.obsidian, textAlign: 'center', maxWidth: 720 },
  section: { padding: 24 },
  sectionDesktop: { width: '100%', paddingHorizontal: 40 },
  tintSection: { backgroundColor: Neutrals.cream, paddingVertical: 40 },
  sectionKicker: { ...Typography.labelMedium, color: GoldSystem.darkGold, marginBottom: 8 },
  sectionTitle: { ...Typography.headlineLarge, color: Neutrals.obsidian, marginBottom: 16 },
  bodyText: { ...Typography.bodyLarge, color: Neutrals.gray600, lineHeight: 24, marginBottom: 14 },
  stepsRow: { flexDirection: 'column', gap: 20 },
  stepsRowDesktop: { flexDirection: 'row', gap: 16 },
  stepCard: {
    backgroundColor: Neutrals.surface, borderRadius: Radius.lg, padding: 20,
    borderWidth: 1, borderColor: Neutrals.border, ...Shadows.soft,
  },
  stepCardDesktop: { flex: 1 },
  stepIconWrap: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Neutrals.cream,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  stepNumber: { ...Typography.caption, color: Neutrals.gray400, marginBottom: 4, letterSpacing: 1 },
  stepTitle: { ...Typography.headlineMedium, color: Neutrals.obsidian, marginBottom: 6 },
  stepDesc: { ...Typography.bodyMedium, color: Neutrals.gray500, lineHeight: 19 },
  badgeGrid: { flexDirection: 'column', gap: 16, marginTop: 20 },
  badgeGridDesktop: { flexDirection: 'row', flexWrap: 'wrap' },
  badgeCard: {
    backgroundColor: Neutrals.surface, borderRadius: Radius.md, padding: 18,
    borderWidth: 1, borderColor: Neutrals.border,
  },
  badgeCardDesktop: { flexBasis: '31%', flexGrow: 1 },
  featureCard: {
    backgroundColor: Neutrals.surface, borderRadius: Radius.md, padding: 18,
    borderWidth: 1, borderColor: Neutrals.border,
  },
  badgeTitle: { ...Typography.labelLarge, color: Neutrals.obsidian, marginBottom: 6 },
  badgeDesc: { ...Typography.bodyMedium, color: Neutrals.gray500, lineHeight: 18 },
  futureSection: { backgroundColor: Neutrals.obsidian, padding: 24, paddingVertical: 40 },
  futureGroupLabel: { ...Typography.labelMedium, color: GoldSystem.primaryGold, marginTop: 8, marginBottom: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.35)', borderRadius: Radius.full,
    paddingVertical: 8, paddingHorizontal: 16,
  },
  chipText: { ...Typography.labelMedium, color: Neutrals.gray300 },
  ctaRow: { paddingHorizontal: 24, marginTop: 32, alignItems: 'center' },
  ctaBtn: { backgroundColor: GoldSystem.primaryGold, paddingVertical: 14, paddingHorizontal: 28, borderRadius: Radius.md },
  ctaBtnText: { ...Typography.labelLarge, color: Neutrals.obsidian },
});
