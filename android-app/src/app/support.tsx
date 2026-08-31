import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';

export default function SupportScreen() {
  const router = useRouter();
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    if (!message) return;
    if (typeof window !== 'undefined') {
      alert('Support ticket submitted successfully! We will contact you soon.');
    } else {
      Alert.alert("Success", "Support ticket submitted successfully! We will contact you soon.");
    }
    setMessage('');
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={() => router.back()}>
          <Text style={styles.headerIconText}>&lt;</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Contact Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Get in Touch</Text>
          <View style={styles.contactGrid}>
            <TouchableOpacity style={styles.contactBtn}>
              <View style={[styles.contactIconBox, { backgroundColor: '#E0F2FE' }]}>
                <Text style={styles.contactIcon}>💬</Text>
              </View>
              <Text style={styles.contactLabel}>Chat with us</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.contactBtn}>
              <View style={[styles.contactIconBox, { backgroundColor: '#DCFCE7' }]}>
                <Text style={styles.contactIcon}>📱</Text>
              </View>
              <Text style={styles.contactLabel}>WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactBtn}>
              <View style={[styles.contactIconBox, { backgroundColor: '#F3E8FF' }]}>
                <Text style={styles.contactIcon}>📧</Text>
              </View>
              <Text style={styles.contactLabel}>Email us</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.faqRow}>
              <Text style={styles.faqQuestion}>How do I withdraw my earnings?</Text>
              <Text style={styles.faqArrow}>+</Text>
            </TouchableOpacity>

            <View style={styles.divider} />
            <TouchableOpacity style={styles.faqRow}>
              <Text style={styles.faqQuestion}>Can I sell my property fractions?</Text>
              <Text style={styles.faqArrow}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Support Ticket Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Send us a message</Text>
          <View style={styles.formCard}>
            <Text style={styles.label}>How can we help you?</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Describe your issue in detail..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={message}
              onChangeText={setMessage}
            />
            <TouchableOpacity 
              style={[styles.submitBtn, !message && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={!message}
            >
              <Text style={styles.submitBtnText}>Submit Ticket</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerIconBtn: { padding: 5 },
  headerIconText: { fontSize: 20, color: '#111827' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  contactGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  contactBtn: {
    backgroundColor: '#FFFFFF',
    width: '31%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  contactIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  contactIcon: {
    fontSize: 24,
  },
  contactLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  faqRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    flex: 1,
  },
  faqArrow: {
    fontSize: 20,
    color: '#6B7280',
    marginLeft: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 8,
  },
  textArea: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    height: 120,
    fontSize: 15,
    color: '#0F172A',
    marginBottom: 20,
  },
  submitBtn: {
    backgroundColor: '#1A56DB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: '#93C5FD',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
