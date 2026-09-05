import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';
import { auth } from '@/lib/firebase';
import { useResponsive } from '@/hooks/useResponsive';

const CONTACT_METHODS = [
  { icon: 'chatbubble-ellipses-outline' as const, label: 'Chat with us' },
  { icon: 'logo-whatsapp' as const, label: 'WhatsApp' },
  { icon: 'mail-outline' as const, label: 'Email us' },
];

const FAQS = [
  'How do I withdraw my earnings?',
  'Can I sell my property fractions?',
];

export default function SupportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDesktop } = useResponsive();
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!message) return;
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to submit a support request.');
      return;
    }
    setSubmitting(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com'}/api/tickets`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'general',
          subject: message.slice(0, 80),
          description: message,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        Alert.alert('Error', err.error || 'Failed to submit your request. Please try again.');
        return;
      }
      Alert.alert('Success', 'Support ticket submitted successfully! We will contact you soon.');
      setMessage('');
      router.back();
    } catch (e) {
      Alert.alert('Error', 'Failed to submit your request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const ContactRow = (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Get in Touch</Text>
      <View style={styles.contactGrid}>
        {CONTACT_METHODS.map((c) => (
          <TouchableOpacity key={c.label} style={styles.contactBtn} activeOpacity={0.7}>
            <View style={styles.contactIconBox}>
              <Ionicons name={c.icon} size={22} color={GoldSystem.darkGold} />
            </View>
            <Text style={styles.contactLabel}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const FaqCard = (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
      <View style={styles.card}>
        {FAQS.map((q, i) => (
          <View key={q}>
            <TouchableOpacity style={styles.faqRow} activeOpacity={0.7}>
              <Text style={styles.faqQuestion}>{q}</Text>
              <Ionicons name="add" size={18} color={Neutrals.gray500} />
            </TouchableOpacity>
            {i < FAQS.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
      </View>
    </View>
  );

  const TicketForm = (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Send us a message</Text>
      <View style={styles.formCard}>
        <Text style={styles.label}>How can we help you?</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Describe your issue in detail…"
          placeholderTextColor={Neutrals.gray400}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          value={message}
          onChangeText={setMessage}
        />
        <TouchableOpacity
          style={[styles.submitBtn, (!message || submitting) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!message || submitting}
          activeOpacity={0.85}
        >
          <Text style={styles.submitBtnText}>{submitting ? 'Submitting…' : 'Submit Ticket'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header — safe-area aware so it's never covered by the status bar / notch */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'web' ? 18 : insets.top + 12 }]}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Neutrals.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help &amp; Support</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 80 : insets.bottom + 40 }}
      >
        {isDesktop ? (
          <View style={styles.desktopLayout}>
            <View style={styles.desktopLeft}>
              {ContactRow}
              {FaqCard}
            </View>
            <View style={styles.desktopRight}>{TicketForm}</View>
          </View>
        ) : (
          <View style={styles.mobileLayout}>
            {ContactRow}
            {FaqCard}
            {TicketForm}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Neutrals.cream },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: Neutrals.obsidian,
  },
  headerIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.headlineMedium,
    color: Neutrals.white,
  },

  // Layout wrappers
  mobileLayout: {
    width: '100%',
  },
  desktopLayout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    maxWidth: 1000,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    gap: 32,
  },
  desktopLeft: {
    flex: 1,
  },
  desktopRight: {
    flex: 1,
    // keeps the ticket form pinned near the top instead of stretching full height
  },

  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    ...Typography.labelLarge,
    color: Neutrals.obsidian,
    marginBottom: 16,
  },
  contactGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  contactBtn: {
    backgroundColor: Neutrals.surface,
    flex: 1,
    paddingVertical: 18,
    borderRadius: Radius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Neutrals.border,
    ...Shadows.soft,
  },
  contactIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GoldSystem.paleGold,
    marginBottom: 10,
  },
  contactLabel: {
    ...Typography.labelSmall,
    color: Neutrals.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: Neutrals.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Neutrals.border,
    overflow: 'hidden',
    ...Shadows.soft,
  },
  faqRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  faqQuestion: {
    ...Typography.bodyMedium,
    color: Neutrals.text,
    flex: 1,
    marginRight: 12,
  },
  divider: {
    height: 1,
    backgroundColor: Neutrals.border,
    marginHorizontal: 16,
  },
  formCard: {
    backgroundColor: Neutrals.surface,
    borderRadius: Radius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: Neutrals.border,
    ...Shadows.soft,
  },
  label: {
    ...Typography.labelMedium,
    color: Neutrals.textSecondary,
    marginBottom: 8,
  },
  textArea: {
    backgroundColor: Neutrals.cream,
    borderWidth: 1,
    borderColor: Neutrals.border,
    borderRadius: Radius.md,
    padding: 16,
    height: 130,
    fontSize: 15,
    color: Neutrals.text,
    marginBottom: 20,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  submitBtn: {
    backgroundColor: GoldSystem.metallicGold,
    paddingVertical: 14,
    borderRadius: Radius.md,
    alignItems: 'center',
    ...Shadows.gold,
  },
  submitBtnDisabled: {
    backgroundColor: Neutrals.gray300,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnText: {
    ...Typography.labelLarge,
    color: Neutrals.obsidian,
    fontWeight: '700',
  },
});
