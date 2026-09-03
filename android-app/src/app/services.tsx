import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '@/contexts/UserContext';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com';

const SERVICES = [
  { id: '1', title: 'Packers & Movers', image: 'https://images.unsplash.com/photo-1600518464441-9154a4dea21b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', desc: 'Verified professionals for a hassle-free move.', price: 'Starts ₹3,500' },
  { id: '2', title: 'Interior Design', image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', desc: 'Premium design consultations and execution.', price: 'Free Consultation' },
  { id: '3', title: 'Legal Assistance', image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', desc: 'Title checks, drafting, and registration.', price: 'Starts ₹4,999' },
  { id: '4', title: 'Deep Cleaning', image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', desc: 'Pre-move in deep cleaning services.', price: 'Starts ₹1,200' },
  { id: '5', title: 'Property Mgmt', image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', desc: 'Full lifecycle tenant & property management.', price: 'Starts ₹800/mo' },
  { id: '6', title: 'Home Loans', image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', desc: 'Instant approvals with lowest interest rates.', price: 'Coming Soon' },
  { id: '7', title: 'Insurance Services', image: 'https://images.unsplash.com/photo-1450101499163-c8848c66cb85?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', desc: 'Home, Auto, Personal & Health Insurance.', price: 'Coming Soon' },
];

export default function ServicesScreen() {
  const router = useRouter();
  const { profile } = useUser();
  const [inquiryFor, setInquiryFor] = useState<string | null>(null);
  const [name, setName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone_number || '');
  const [submitting, setSubmitting] = useState(false);

  const openInquiry = (serviceTitle: string) => {
    setInquiryFor(serviceTitle);
  };

  const submitInquiry = async () => {
    if (!inquiryFor) return;
    if (!name || !phone) {
      Alert.alert('Missing details', 'Please enter your name and phone number.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: name,
          phone,
          email: profile?.email || undefined,
          service_type: inquiryFor,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        Alert.alert('Error', err.error || 'Failed to submit your request. Please try again.');
        return;
      }
      Alert.alert('Request received', `Our team will reach out about ${inquiryFor} shortly.`);
      setInquiryFor(null);
    } catch (e) {
      Alert.alert('Error', 'Failed to submit your request. Please try again.');
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
        <Text style={styles.headerTitle}>Home Services</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        
        {/* Banner */}
        <LinearGradient colors={GoldSystem.goldGradient} style={styles.banner}>
          <Text style={styles.bannerTitle}>RealShare Concierge</Text>
          <Text style={styles.bannerDesc}>End-to-end services to make your house a home.</Text>
          <TouchableOpacity style={styles.bannerBtn} onPress={() => openInquiry('General Consultation')}>
            <Text style={styles.bannerBtnText}>Talk to an Expert</Text>
          </TouchableOpacity>
        </LinearGradient>

        <Text style={styles.sectionTitle}>Browse Services</Text>
        
        <View style={styles.servicesGrid}>
          {SERVICES.map(service => (
            <TouchableOpacity key={service.id} style={styles.serviceCard} activeOpacity={0.9} onPress={() => openInquiry(service.title)}>
              <ImageBackground 
                source={{ uri: service.image }} 
                style={styles.serviceImage}
              >
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.8)']}
                  style={styles.imageGradient}
                />
              </ImageBackground>
              <View style={styles.serviceContent}>
                <Text style={styles.serviceTitle}>{service.title}</Text>
                <Text style={styles.serviceDesc}>{service.desc}</Text>
                <View style={{ flex: 1 }} />
                <View style={styles.serviceFooter}>
                  <Text style={styles.servicePrice}>{service.price}</Text>
                  <Text style={styles.arrowIcon}>→</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>

      <Modal visible={!!inquiryFor} transparent animationType="slide" onRequestClose={() => setInquiryFor(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{inquiryFor}</Text>
            <Text style={styles.modalSubtitle}>Leave your details and our team will call you back.</Text>
            <TextInput
              style={styles.input}
              placeholder="Your name"
              value={name}
              onChangeText={setName}
              placeholderTextColor={Neutrals.gray400}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholderTextColor={Neutrals.gray400}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setInquiryFor(null)} disabled={submitting}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmitBtn} onPress={submitInquiry} disabled={submitting}>
                {submitting ? (
                  <ActivityIndicator color={Neutrals.surface} />
                ) : (
                  <Text style={styles.modalSubmitText}>Request Callback</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Neutrals.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 50,
    backgroundColor: Neutrals.surface,
    borderBottomWidth: 1,
    borderBottomColor: Neutrals.border,
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  backIcon: {
    fontSize: 24,
    color: Neutrals.obsidian,
  },
  headerTitle: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  banner: {
    padding: 24,
    borderRadius: Radius.lg,
    marginBottom: 32,
    ...Shadows.strong,
  },
  bannerTitle: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
    marginBottom: 8,
  },
  bannerDesc: {
    ...Typography.bodyMedium,
    color: Neutrals.obsidian,
    opacity: 0.9,
    marginBottom: 20,
    maxWidth: '80%',
  },
  bannerBtn: {
    backgroundColor: Neutrals.obsidian,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  bannerBtnText: {
    ...Typography.labelMedium,
    color: Neutrals.surface,
  },
  sectionTitle: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
    marginBottom: 16,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  serviceCard: {
    width: '47.5%',
    backgroundColor: Neutrals.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Neutrals.border,
    minHeight: 220,
    ...Shadows.soft,
    overflow: 'hidden',
  },
  serviceImage: {
    width: '100%',
    height: 100,
    justifyContent: 'flex-end',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  serviceContent: {
    padding: 12,
    flex: 1,
  },
  serviceTitle: {
    ...Typography.labelLarge,
    color: Neutrals.obsidian,
    marginBottom: 4,
  },
  serviceDesc: {
    ...Typography.caption,
    color: Neutrals.gray600,
    marginBottom: 12,
    lineHeight: 16,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Neutrals.border,
  },
  servicePrice: {
    ...Typography.caption,
    color: GoldSystem.primaryGold,
    fontWeight: '700',
    fontSize: 11,
  },
  arrowIcon: {
    color: Neutrals.gray400,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Neutrals.surface,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
    marginBottom: 4,
  },
  modalSubtitle: {
    ...Typography.bodyMedium,
    color: Neutrals.gray600,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: Neutrals.border,
    borderRadius: Radius.md,
    padding: 14,
    marginBottom: 12,
    ...Typography.bodyMedium,
    color: Neutrals.obsidian,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Neutrals.border,
    alignItems: 'center',
  },
  modalCancelText: {
    ...Typography.labelMedium,
    color: Neutrals.obsidian,
  },
  modalSubmitBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Radius.md,
    backgroundColor: Neutrals.obsidian,
    alignItems: 'center',
  },
  modalSubmitText: {
    ...Typography.labelMedium,
    color: Neutrals.surface,
  },
});
