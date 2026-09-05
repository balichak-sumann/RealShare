import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform } from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';
import { useResponsive } from '@/hooks/useResponsive';
import { WebFooter } from '@/components/layout/WebFooter';

// Web-only marketing page (ported from the realshare.in "About" page). Native
// never renders this — the mobile app has no route to it, and this redirect
// is a second guard in case a deep link ever points here on device.
export default function AboutScreen() {
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
        <Text style={styles.headerTitle}>About Us</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={[styles.hero, isDesktop && styles.heroDesktop]}>
          <Text style={styles.heroKicker}>ABOUT REALSHARE</Text>
          <Text style={styles.heroTitle}>Rebranding real estate ownership</Text>
          <Text style={styles.heroSubtitle}>
            Own your family's dream commercial or holiday property, and earn for your future.
          </Text>
        </View>

        <View style={[styles.section, isDesktop && styles.sectionDesktop]}>
          <View style={[styles.storyRow, isDesktop && styles.storyRowDesktop]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Our story</Text>
              <Text style={styles.bodyText}>
                RealShare started on the belief in ethics and transparency in real estate
                transactions, with a vision to change the way real estate investments are
                offered to customers. Our tech-enabled marketplace streamlines the
                purchasing, co-owning, and reselling process.
              </Text>
              <Text style={styles.bodyText}>
                We believe in the culmination of our passion for building world-class
                communities, innovation and sustainability — which yields exceptional
                experiences and returns where our customers live, work, and play.
              </Text>
            </View>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.storyLogo}
            />
          </View>
        </View>

        <View style={[styles.section, styles.founderSection, isDesktop && styles.sectionDesktop]}>
          <Text style={styles.sectionTitle}>Founder & Promoter</Text>
          <View style={[styles.founderCard, isDesktop && styles.founderCardDesktop]}>
            <View style={styles.founderInfo}>
              <Text style={styles.founderName}>Raj Kumar Chintireddy</Text>
              <Text style={styles.founderRole}>Chairman & MD, RealShare</Text>
              <Text style={styles.bodyText}>
                Raj Kumar, a seasoned leader and serial entrepreneur, began his career 20
                years ago with a startup distributing computers and providing networking
                solutions. He rose to become the founder-director of Skytel, an internet and
                VoIP services company, and went on to establish Zye Telecom Pvt Ltd in 2013.
                He also started Zyetek Network Pvt Ltd in 2022 before rebranding the company
                as RealShare Properties Pvt. Ltd., which is selling commercial, residential
                and vacation properties in India and abroad. Raj Kumar has investments in
                Telecom, Agri, real estate, software development and consulting services.
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.section, isDesktop && styles.sectionDesktop]}>
          <Text style={styles.sectionTitle}>Registered office</Text>
          <Text style={styles.bodyText}>
            RealShare Properties Pvt. Ltd.{'\n'}
            206, Panchsheel Complex, Nizampet{'\n'}
            Hyderabad – 500090, Telangana, India{'\n'}
            +91 40 4010 1212
          </Text>
        </View>

        <View style={styles.ctaRow}>
          <TouchableOpacity style={styles.ctaBtn} onPress={() => router.push('/how-it-works')}>
            <Text style={styles.ctaBtnText}>See how it works</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ctaBtnOutline} onPress={() => router.push('/(tabs)/explore')}>
            <Text style={styles.ctaBtnOutlineText}>Explore Properties</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: Platform.OS === 'web' ? 18 : 50,
    backgroundColor: Neutrals.surface,
    borderBottomWidth: 1,
    borderBottomColor: Neutrals.border,
  },
  backBtn: { padding: 8, marginLeft: -8 },
  backIcon: { fontSize: 24, color: Neutrals.obsidian },
  headerTitle: { ...Typography.headlineMedium, color: Neutrals.obsidian },
  hero: {
    backgroundColor: Neutrals.obsidian,
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  heroDesktop: { paddingVertical: 64, paddingHorizontal: 40, alignItems: 'center' },
  heroKicker: { ...Typography.labelMedium, color: GoldSystem.primaryGold, marginBottom: 10, textAlign: 'center' },
  heroTitle: { ...Typography.displayMedium, color: Neutrals.surface, textAlign: 'center', marginBottom: 12 },
  heroSubtitle: { ...Typography.bodyLarge, color: Neutrals.gray300, textAlign: 'center', maxWidth: 560, alignSelf: 'center' },
  section: { padding: 24 },
  sectionDesktop: { width: '100%', paddingHorizontal: 40 },
  sectionTitle: { ...Typography.headlineLarge, color: Neutrals.obsidian, marginBottom: 16 },
  bodyText: { ...Typography.bodyLarge, color: Neutrals.gray600, lineHeight: 24, marginBottom: 14 },
  storyRow: { flexDirection: 'column' },
  storyRowDesktop: { flexDirection: 'row', alignItems: 'center', gap: 40 },
  storyLogo: { width: 120, height: 120, resizeMode: 'contain', alignSelf: 'center', marginTop: 20, opacity: 0.9 },
  founderSection: { backgroundColor: Neutrals.cream },
  founderCard: {
    backgroundColor: Neutrals.surface,
    borderRadius: Radius.lg,
    padding: 24,
    borderWidth: 1,
    borderColor: Neutrals.border,
    ...Shadows.soft,
  },
  founderCardDesktop: { flexDirection: 'row', gap: 24 },
  founderInfo: { flex: 1 },
  founderName: { ...Typography.headlineMedium, color: Neutrals.obsidian },
  founderRole: { ...Typography.labelLarge, color: GoldSystem.darkGold, marginBottom: 12 },
  ctaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 24, marginTop: 8 },
  ctaBtn: { backgroundColor: GoldSystem.primaryGold, paddingVertical: 14, paddingHorizontal: 24, borderRadius: Radius.md },
  ctaBtnText: { ...Typography.labelLarge, color: Neutrals.obsidian },
  ctaBtnOutline: { borderWidth: 1.5, borderColor: Neutrals.obsidian, paddingVertical: 14, paddingHorizontal: 24, borderRadius: Radius.md },
  ctaBtnOutlineText: { ...Typography.labelLarge, color: Neutrals.obsidian },
});
