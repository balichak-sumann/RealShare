import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, ActivityIndicator, Alert } from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';
import { useResponsive } from '@/hooks/useResponsive';
import { WebFooter } from '@/components/layout/WebFooter';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com';

const VALUE_PROPS = [
  { icon: 'earth-outline', title: 'Refer anywhere', desc: 'No matter where you are based, refer clients to properties across RealShare markets.' },
  { icon: 'shield-checkmark-outline', title: 'Connect with confidence', desc: 'Your client relationships are yours to keep — we partner with you and your client every step of the way.' },
  { icon: 'cash-outline', title: 'Earn a competitive commission', desc: 'Get paid a full referral commission on every RealShare property your client buys.' },
  { icon: 'link-outline', title: 'Refer with ease', desc: 'Once approved, use your partner dashboard to track leads, commissions and referral links.' },
] as const;

// Public partner-signup lead form (web only) — for prospective agents/brokers,
// distinct from the in-app Agent Portal which is for already-onboarded
// agents. Submits to the same ServiceInquiry intake as Contact Us and Home
// Services (service_type: "Partner Application") — a real, admin-visible
// record, not a form that goes nowhere.
export default function PartnersScreen() {
  const router = useRouter();
  const { isDesktop } = useResponsive();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [primaryMarket, setPrimaryMarket] = useState('');
  const [company, setCompany] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (Platform.OS !== 'web') {
    return <Redirect href="/" />;
  }

  const handleSubmit = async () => {
    if (!fullName.trim() || (!email.trim() && !phone.trim())) {
      Alert.alert('Missing details', 'Please share your name and at least an email or phone number.');
      return;
    }
    if (!consent) {
      Alert.alert('Consent required', 'Please confirm you agree to be contacted about the partner program.');
      return;
    }
    setSubmitting(true);
    try {
      const notesParts = ['Partner program application'];
      if (company.trim()) notesParts.push(`Company: ${company.trim()}`);

      const res = await fetch(`${API_URL}/api/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: fullName.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          service_type: 'Partner Application',
          property_reference: primaryMarket.trim() || undefined,
          notes: notesParts.join(' | '),
        }),
      });
      if (!res.ok) throw new Error('Request failed');
      setSubmitted(true);
    } catch (e) {
      Alert.alert('Something went wrong', 'Please try again in a moment, or call us at +91 40 4010 1212.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Partners</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={[styles.hero, isDesktop && styles.heroDesktop]}>
          <Text style={styles.heroTitle}>Broaden your business with RealShare</Text>
          <Text style={styles.heroSubtitle}>
            Refer your clients to RealShare and earn a competitive referral commission when
            they co-own a property. We do the legwork — inspections and legal — and keep you
            in the loop every step of the way.
          </Text>
        </View>

        <View style={[styles.section, isDesktop && styles.sectionDesktop]}>
          <View style={[styles.valueGrid, isDesktop && styles.valueGridDesktop]}>
            {VALUE_PROPS.map((v) => (
              <View key={v.title} style={[styles.valueCard, isDesktop && styles.valueCardDesktop]}>
                <Ionicons name={v.icon as any} size={20} color={GoldSystem.darkGold} style={{ marginBottom: 8 }} />
                <Text style={styles.valueTitle}>{v.title}</Text>
                <Text style={styles.valueDesc}>{v.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.section, styles.formSection, isDesktop && styles.sectionDesktop]}>
          <Text style={styles.sectionTitle}>Become a RealShare Preferred Partner</Text>
          <Text style={styles.bodyText}>
            As a RealShare Preferred Partner, you get priority on property referrals and earn a
            competitive commission for every contact who closes on a property. It's easy — apply
            below to create your partner account.
          </Text>

          {submitted ? (
            <View style={styles.successCard}>
              <Text style={styles.successTitle}>Application received</Text>
              <Text style={styles.bodyText}>
                Our partnerships team will reach out shortly to set up your partner account.
              </Text>
            </View>
          ) : (
            <View style={styles.formCard}>
              <Text style={styles.formLabel}>Full Name *</Text>
              <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Your full name" placeholderTextColor={Neutrals.gray400} />

              <View style={[styles.row2, isDesktop && styles.row2Desktop]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Email</Text>
                  <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" placeholderTextColor={Neutrals.gray400} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Phone</Text>
                  <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+91 98765 43210" keyboardType="phone-pad" placeholderTextColor={Neutrals.gray400} />
                </View>
              </View>

              <View style={[styles.row2, isDesktop && styles.row2Desktop]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Primary Market</Text>
                  <TextInput style={styles.input} value={primaryMarket} onChangeText={setPrimaryMarket} placeholder="e.g. Hyderabad" placeholderTextColor={Neutrals.gray400} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Company</Text>
                  <TextInput style={styles.input} value={company} onChangeText={setCompany} placeholder="Brokerage / agency (optional)" placeholderTextColor={Neutrals.gray400} />
                </View>
              </View>

              <TouchableOpacity style={styles.consentRow} onPress={() => setConsent(!consent)} activeOpacity={0.7}>
                <View style={[styles.checkbox, consent && styles.checkboxChecked]} />
                <Text style={styles.consentText}>
                  I authorize RealShare and its representatives to call, email, or WhatsApp me
                  about the partner program.
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
                {submitting ? <ActivityIndicator color={Neutrals.obsidian} /> : <Text style={styles.submitBtnText}>Submit</Text>}
              </TouchableOpacity>
            </View>
          )}
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
  hero: { backgroundColor: Neutrals.cream, padding: 24, paddingVertical: 40, alignItems: 'center' },
  heroDesktop: { paddingVertical: 56 },
  heroTitle: { ...Typography.displayMedium, color: Neutrals.obsidian, textAlign: 'center', marginBottom: 12, maxWidth: 640 },
  heroSubtitle: { ...Typography.bodyLarge, color: Neutrals.gray600, textAlign: 'center', maxWidth: 640, lineHeight: 22 },
  section: { padding: 24 },
  sectionDesktop: { width: '100%', paddingHorizontal: 40 },
  sectionTitle: { ...Typography.headlineLarge, color: Neutrals.obsidian, marginBottom: 12, textAlign: 'center' },
  bodyText: { ...Typography.bodyLarge, color: Neutrals.gray600, lineHeight: 22, marginBottom: 14, textAlign: 'center' },
  valueGrid: { flexDirection: 'column', gap: 16 },
  valueGridDesktop: { flexDirection: 'row', flexWrap: 'wrap' },
  valueCard: {
    backgroundColor: Neutrals.surface, borderRadius: Radius.md, padding: 18,
    borderWidth: 1, borderColor: Neutrals.border,
  },
  valueCardDesktop: { flexBasis: '47%', flexGrow: 1 },
  valueTitle: { ...Typography.labelLarge, color: Neutrals.obsidian, marginBottom: 6 },
  valueDesc: { ...Typography.bodyMedium, color: Neutrals.gray500, lineHeight: 18 },
  formSection: { alignItems: 'center' },
  successCard: {
    backgroundColor: Neutrals.surface, borderRadius: Radius.lg, padding: 32,
    borderWidth: 1, borderColor: Neutrals.border, alignItems: 'center', ...Shadows.soft, marginTop: 12,
    width: '100%', maxWidth: 480, alignSelf: 'center',
  },
  successTitle: { ...Typography.headlineMedium, color: Neutrals.obsidian, marginBottom: 10, textAlign: 'center' },
  formCard: {
    backgroundColor: Neutrals.surface, borderRadius: Radius.lg, padding: 24,
    borderWidth: 1, borderColor: Neutrals.border, ...Shadows.soft, marginTop: 12,
    width: '100%', maxWidth: 560, alignSelf: 'center',
  },
  formLabel: { ...Typography.labelMedium, color: Neutrals.gray600, marginBottom: 8, marginTop: 12 },
  input: {
    borderWidth: 1, borderColor: Neutrals.border, borderRadius: Radius.md,
    paddingVertical: 12, paddingHorizontal: 14, ...Typography.bodyMedium, color: Neutrals.text,
    backgroundColor: Neutrals.surface,
  },
  row2: { flexDirection: 'column', gap: 0 },
  row2Desktop: { flexDirection: 'row', gap: 16 },
  consentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 18 },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, borderColor: Neutrals.gray400, marginTop: 2 },
  checkboxChecked: { backgroundColor: GoldSystem.primaryGold, borderColor: GoldSystem.primaryGold },
  consentText: { ...Typography.bodyMedium, color: Neutrals.gray500, flex: 1, lineHeight: 18, textAlign: 'left' },
  submitBtn: {
    backgroundColor: GoldSystem.primaryGold, borderRadius: Radius.md, paddingVertical: 14,
    alignItems: 'center', marginTop: 20,
  },
  submitBtnText: { ...Typography.labelLarge, color: Neutrals.obsidian },
});
