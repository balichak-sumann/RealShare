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

        <View style={[styles.section, isDesktop && styles.sectionDesktop, { paddingVertical: 60 }]}>
          <View style={[styles.resaleBanner, isDesktop && styles.resaleBannerDesktop]}>
            <View style={styles.resaleBannerContent}>
              <View style={styles.resaleIconWrap}>
                <Ionicons name="trending-up-outline" size={32} color={GoldSystem.metallicGold} />
              </View>
              <Text style={styles.resaleTitle}>Effortless resale, with gains</Text>
              <Text style={styles.resaleDesc}>
                Part of owning a RealShare property is the flexibility to resell your share.
                RealShare has historically seen an average appreciation that is about twice the appreciation of a traditional luxury vacation home or commercial property purchased outright.
              </Text>
            </View>
            <View style={[styles.resaleStatBlock, isDesktop && styles.resaleStatBlockDesktop]}>
              <Text style={styles.resaleStatValue}>10–18%</Text>
              <Text style={styles.resaleStatLabel}>Historical Avg. Appreciation</Text>
            </View>
          </View>
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
  resaleBanner: {
    backgroundColor: Neutrals.obsidian,
    borderRadius: Radius.xl,
    padding: 32,
    flexDirection: 'column',
    gap: 32,
    ...Shadows.strong,
  },
  resaleBannerDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 48,
  },
  resaleBannerContent: {
    flex: 1,
  },
  resaleIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  resaleTitle: {
    ...Typography.displayMedium,
    color: Neutrals.surface,
    marginBottom: 16,
  },
  resaleDesc: {
    ...Typography.bodyLarge,
    color: Neutrals.gray300,
    lineHeight: 26,
  },
  resaleStatBlock: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 24,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resaleStatBlockDesktop: {
    minWidth: 280,
    padding: 32,
    marginLeft: 32,
  },
  resaleStatValue: {
    ...Typography.displayLarge,
    color: GoldSystem.metallicGold,
    marginBottom: 8,
  },
  resaleStatLabel: {
    ...Typography.labelLarge,
    color: Neutrals.gray300,
    textAlign: 'center',
  },

});
