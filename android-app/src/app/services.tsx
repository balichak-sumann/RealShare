import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground, Modal, TextInput, Alert, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '@/contexts/UserContext';
import { getApiUrl } from '@/lib/api';

import { useResponsive } from '@/hooks/useResponsive';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80';

const DEFAULT_SERVICES = [
  { id: '1', title: 'Interior Design', image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', desc: 'Premium design consultations and execution for your dream home.', price: 'Free Consultation' },
  { id: '2', title: 'Property Management', image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', desc: 'Full lifecycle tenant & property management for complete peace of mind.', price: 'Starts ₹800/mo' },
  { id: '3', title: 'Home Loans', image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', desc: 'Instant approvals with lowest interest rates from top banks.', price: 'Coming Soon' },
];

export default function ServicesScreen() {
  const router = useRouter();
  const { profile } = useUser();
  const { isDesktop } = useResponsive();
  const [services, setServices] = useState<any[]>(DEFAULT_SERVICES);
  const [inquiryFor, setInquiryFor] = useState<string | null>(null);
  const [name, setName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone_number || '');
  const [budget, setBudget] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${getApiUrl()}/api/services/catalog?active=true`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setServices(data.map(s => ({
              id: s.id,
              title: s.title,
              image: s.image_url,
              desc: s.description || s.category,
              price: s.pricing || 'Free Consultation'
            })));
          }
        }
      } catch (err) {
        console.warn('Failed to load dynamic services catalog', err);
      }
    })();
  }, []);

  const openInquiry = (serviceTitle: string) => {
    setInquiryFor(serviceTitle);
    if (profile?.full_name && !name) setName(profile.full_name);
    if (profile?.phone_number && !phone) setPhone(profile.phone_number);
  };

  const submitInquiry = async () => {
    if (!inquiryFor) return;
    const cleanedPhone = phone.replace(/\D/g, '').slice(-10);
    if (cleanedPhone.length !== 10 || !/^[6-9]/.test(cleanedPhone)) {
      Alert.alert('Invalid Mobile Number', 'Please enter a valid 10-digit mobile number starting with 7, 8, 9, or 6.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: name.trim() || 'Valued Investor',
          phone: cleanedPhone,
          email: profile?.email || undefined,
          service_type: inquiryFor,
          estimated_budget: budget.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        Alert.alert('Error', err.error || 'Failed to submit your request. Please try again.');
        return;
      }
      Alert.alert('Request Received 🎉', `Thank you! Our concierge team will reach out regarding ${inquiryFor} shortly.`);
      setInquiryFor(null);
      setBudget('');
      setNotes('');
    } catch (e) {
      Alert.alert('Error', 'Failed to submit your request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {!isDesktop && (
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.canGoBack() ? router.back() : router.push('/')} 
            style={styles.backBtn}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Home Services</Text>
          <View style={{ width: 24 }} />
        </View>
      )}

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
        
        {/* Hero Banner */}
        <ImageBackground source={{ uri: HERO_IMAGE }} style={[styles.heroBanner, isDesktop && styles.heroBannerDesktop]}>
          <LinearGradient colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.8)']} style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <Text style={styles.heroSuperTitle}>REALSHARE CONCIERGE</Text>
            <Text style={styles.heroTitle}>End-to-end services to make your house a <Text style={{ color: GoldSystem.primaryGold }}>home.</Text></Text>
            <TouchableOpacity style={styles.heroBtn} onPress={() => openInquiry('General Consultation')}>
              <Text style={styles.heroBtnText}>Talk to an Expert</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>

        <Text style={[styles.sectionTitle, isDesktop && styles.sectionTitleDesktop]}>Browse Premium Services</Text>
        
        <View style={[styles.servicesGrid, isDesktop && styles.servicesGridDesktop]}>
          {services.map(service => (
            <TouchableOpacity key={service.id} style={[styles.serviceCard, isDesktop && styles.serviceCardDesktop]} activeOpacity={0.9} onPress={() => openInquiry(service.title)}>
              <ImageBackground 
                source={{ uri: service.image }} 
                style={styles.serviceImage}
              >
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.6)']}
                  style={styles.imageGradient}
                />
              </ImageBackground>
              <View style={styles.serviceContent}>
                <Text style={styles.serviceTitle}>{service.title}</Text>
                <Text style={styles.serviceDesc} numberOfLines={3}>{service.desc}</Text>
                <View style={{ flex: 1 }} />
                <View style={styles.serviceFooter}>
                  <Text style={styles.servicePrice}>{service.price}</Text>
                  <View style={styles.iconCircle}>
                    <Text style={styles.arrowIcon}>→</Text>
                  </View>
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
              placeholder="Your full name"
              value={name}
              onChangeText={setName}
              placeholderTextColor={Neutrals.gray400}
            />
            <TextInput
              style={styles.input}
              placeholder="10-digit mobile number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholderTextColor={Neutrals.gray400}
            />
            <TextInput
              style={styles.input}
              placeholder="Estimated budget (optional)"
              value={budget}
              onChangeText={setBudget}
              placeholderTextColor={Neutrals.gray400}
            />
            <TextInput
              style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
              placeholder="Additional notes / specific requirements"
              value={notes}
              onChangeText={setNotes}
              multiline
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
    paddingTop: Platform.OS === 'web' ? 18 : 50,
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
  },
  heroBanner: {
    height: 280,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    ...(Platform.OS !== 'web' ? { borderBottomLeftRadius: Radius.xl, borderBottomRightRadius: Radius.xl } : {}),
  },
  heroBannerDesktop: {
    height: 400,
    borderRadius: Radius.xl,
    marginHorizontal: 24,
    marginTop: 24,
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heroContent: {
    padding: 24,
    paddingBottom: 32,
  },
  heroSuperTitle: {
    ...Typography.labelMedium,
    color: GoldSystem.primaryGold,
    letterSpacing: 2,
    marginBottom: 8,
  },
  heroTitle: {
    ...Typography.displayMedium,
    color: Neutrals.white,
    marginBottom: 24,
    maxWidth: 600,
  },
  heroBtn: {
    backgroundColor: GoldSystem.primaryGold,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  heroBtnText: {
    ...Typography.labelLarge,
    color: Neutrals.obsidian,
  },
  sectionTitle: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
    marginBottom: 20,
    marginTop: 32,
    paddingHorizontal: 16,
  },
  sectionTitleDesktop: {
    ...Typography.displaySmall,
    paddingHorizontal: 24,
    marginTop: 48,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingHorizontal: 16,
  },
  servicesGridDesktop: {
    gap: 24,
    paddingHorizontal: 24,
  },
  serviceCard: {
    width: '100%',
    backgroundColor: Neutrals.white,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Neutrals.border,
    minHeight: 280,
    ...Shadows.medium,
    overflow: 'hidden',
  },
  serviceCardDesktop: {
    width: '31%',
    minWidth: 300,
    minHeight: 360,
  },
  serviceImage: {
    width: '100%',
    height: 180,
    justifyContent: 'flex-end',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
  },
  serviceContent: {
    padding: 20,
    flex: 1,
  },
  serviceTitle: {
    ...Typography.headlineSmall,
    color: Neutrals.obsidian,
    marginBottom: 8,
  },
  serviceDesc: {
    ...Typography.bodyMedium,
    color: Neutrals.gray600,
    marginBottom: 24,
    lineHeight: 22,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Neutrals.gray100,
  },
  servicePrice: {
    ...Typography.labelLarge,
    color: GoldSystem.darkGold,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Neutrals.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowIcon: {
    color: Neutrals.obsidian,
    fontSize: 16,
    fontWeight: 'bold',
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
