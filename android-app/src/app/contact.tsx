import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, ActivityIndicator, Alert } from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';
import { useResponsive } from '@/hooks/useResponsive';
import { WebFooter } from '@/components/layout/WebFooter';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com';

type Intent = 'Buyer' | 'Seller' | 'Agent or Broker';
const INTENTS: Intent[] = ['Buyer', 'Seller', 'Agent or Broker'];

// Public, no-auth lead form (web only) — ported from realshare.in/contact.
// Submits to the same ServiceInquiry intake the mobile Home Services screen
// already uses (service_type: "Website Contact"), so a real record lands in
// the admin dashboard's Services queue rather than disappearing into a fake
// success alert.
export default function ContactScreen() {
  const router = useRouter();
  const { isDesktop } = useResponsive();

  const [intent, setIntent] = useState<Intent>('Buyer');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pincode, setPincode] = useState('');
  const [location, setLocation] = useState('');
  const [message, setMessage] = useState('');
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
      Alert.alert('Consent required', 'Please confirm you agree to be contacted about your enquiry.');
      return;
    }
    setSubmitting(true);
    try {
      const notesParts = [`Enquiry type: ${intent}`];
      if (pincode.trim()) notesParts.push(`Pincode: ${pincode.trim()}`);
      if (message.trim()) notesParts.push(`Message: ${message.trim()}`);

      const res = await fetch(`${API_URL}/api/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: fullName.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          service_type: 'Website Contact',
          property_reference: location.trim() || undefined,
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
        <Text style={styles.headerTitle}>Contact Us</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={[styles.body, isDesktop && styles.bodyDesktop]}>
          <View style={styles.introCol}>
            <Text style={styles.introTitle}>Own the joy</Text>
            <Text style={styles.introSubtitle}>Your dream property is waiting</Text>
            <Text style={styles.bodyText}>
              Take the next step in buying, selling, or listing your property with RealShare.
              Tell us a bit about what you're looking for, and our team will reach out.
            </Text>
            <Text style={styles.bodyText}>Give us a call at +91 40 4010 1212</Text>
          </View>

          <View style={styles.formCol}>
            {submitted ? (
              <View style={styles.successCard}>
                <Text style={styles.successTitle}>Thanks — we've got it.</Text>
                <Text style={styles.bodyText}>
                  Our team will reach out shortly. In the meantime, feel free to browse live
                  listings.
                </Text>
                <TouchableOpacity style={styles.submitBtn} onPress={() => router.push('/(tabs)/explore')}>
                  <Text style={styles.submitBtnText}>Explore Properties</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.formCard}>
                <Text style={styles.formLabel}>Select one of the following</Text>
                <View style={styles.intentRow}>
                  {INTENTS.map((i) => (
                    <TouchableOpacity
                      key={i}
                      style={[styles.intentChip, intent === i && styles.intentChipActive]}
                      onPress={() => setIntent(i)}
                    >
                      <Text style={[styles.intentChipText, intent === i && styles.intentChipTextActive]}>{i}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

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
                    <Text style={styles.formLabel}>Where would you like to own?</Text>
                    <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="e.g. Hyderabad" placeholderTextColor={Neutrals.gray400} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.formLabel}>Pincode</Text>
                    <TextInput style={styles.input} value={pincode} onChangeText={setPincode} placeholder="500090" keyboardType="number-pad" placeholderTextColor={Neutrals.gray400} />
                  </View>
                </View>

                <Text style={styles.formLabel}>Drop us a line (optional)</Text>
                <TextInput
                  style={[styles.input, styles.textarea]}
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Tell us a bit more..."
                  placeholderTextColor={Neutrals.gray400}
                  multiline
                  numberOfLines={4}
                />

                <TouchableOpacity style={styles.consentRow} onPress={() => setConsent(!consent)} activeOpacity={0.7}>
                  <View style={[styles.checkbox, consent && styles.checkboxChecked]} />
                  <Text style={styles.consentText}>
                    I authorize RealShare and its representatives to call, email, or WhatsApp me
                    about products and services.
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
                  {submitting ? <ActivityIndicator color={Neutrals.obsidian} /> : <Text style={styles.submitBtnText}>Submit</Text>}
                </TouchableOpacity>
              </View>
            )}
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
  body: { padding: 24, flexDirection: 'column', gap: 32 },
  bodyDesktop: { flexDirection: 'row', width: '100%', paddingHorizontal: 40, paddingTop: 32 },
  introCol: { flex: 1 },
  introTitle: { ...Typography.displayMedium, color: Neutrals.obsidian, marginBottom: 6 },
  introSubtitle: { ...Typography.headlineMedium, color: GoldSystem.darkGold, marginBottom: 16 },
  bodyText: { ...Typography.bodyLarge, color: Neutrals.gray600, lineHeight: 22, marginBottom: 12 },
  formCol: { flex: 1.2 },
  formCard: {
    backgroundColor: Neutrals.surface, borderRadius: Radius.lg, padding: 24,
    borderWidth: 1, borderColor: Neutrals.border, ...Shadows.soft,
  },
  successCard: {
    backgroundColor: Neutrals.surface, borderRadius: Radius.lg, padding: 32,
    borderWidth: 1, borderColor: Neutrals.border, alignItems: 'center', ...Shadows.soft,
  },
  successTitle: { ...Typography.headlineMedium, color: Neutrals.obsidian, marginBottom: 10, textAlign: 'center' },
  formLabel: { ...Typography.labelMedium, color: Neutrals.gray600, marginBottom: 8, marginTop: 12 },
  intentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  intentChip: { borderWidth: 1, borderColor: Neutrals.border, borderRadius: Radius.full, paddingVertical: 8, paddingHorizontal: 14 },
  intentChipActive: { backgroundColor: GoldSystem.primaryGold, borderColor: GoldSystem.primaryGold },
  intentChipText: { ...Typography.labelMedium, color: Neutrals.gray600 },
  intentChipTextActive: { color: Neutrals.obsidian },
  input: {
    borderWidth: 1, borderColor: Neutrals.border, borderRadius: Radius.md,
    paddingVertical: 12, paddingHorizontal: 14, ...Typography.bodyMedium, color: Neutrals.text,
    backgroundColor: Neutrals.surface,
  },
  textarea: { height: 96, textAlignVertical: 'top' },
  row2: { flexDirection: 'column', gap: 0 },
  row2Desktop: { flexDirection: 'row', gap: 16 },
  consentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 18 },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, borderColor: Neutrals.gray400, marginTop: 2 },
  checkboxChecked: { backgroundColor: GoldSystem.primaryGold, borderColor: GoldSystem.primaryGold },
  consentText: { ...Typography.bodyMedium, color: Neutrals.gray500, flex: 1, lineHeight: 18 },
  submitBtn: {
    backgroundColor: GoldSystem.primaryGold, borderRadius: Radius.md, paddingVertical: 14,
    alignItems: 'center', marginTop: 20,
  },
  submitBtnText: { ...Typography.labelLarge, color: Neutrals.obsidian },
});
