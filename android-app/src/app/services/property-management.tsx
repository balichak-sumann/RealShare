import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground, TextInput, Alert, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '@/contexts/UserContext';
import { getApiUrl } from '@/lib/api';
import { useResponsive } from '@/hooks/useResponsive';

const HERO_IMAGE = require('../../../assets/images/indian_property_management.jpg');

export default function PropertyManagementScreen() {
  const router = useRouter();
  const { profile } = useUser();
  const { isDesktop } = useResponsive();

  const [name, setName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone_number || '');
  const [propertyLocation, setPropertyLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submitInquiry = async () => {
    const cleanedPhone = phone.replace(/\D/g, '').slice(-10);
    if (cleanedPhone.length !== 10 || !/^[6-9]/.test(cleanedPhone)) {
      Alert.alert('Invalid Mobile Number', 'Please enter a valid 10-digit mobile number starting with 7, 8, 9, or 6.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/forms/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: name.trim() || 'Valued Buyer',
          phone: cleanedPhone,
          email: profile?.email || undefined,
          service_type: 'Property Management',
          notes: propertyLocation.trim() ? `Location: ${propertyLocation.trim()}` : undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const errMsg = err.error || 'Failed to submit your request. Please try again.';
        if (Platform.OS === 'web') window.alert('Error: ' + errMsg);
        else Alert.alert('Error', errMsg);
        return;
      }
      const successTitle = 'Successfully submitted';
      const successMsg = 'Your request has been successfully submitted and one of our team members will contact you.';
      if (Platform.OS === 'web') window.alert(`${successTitle}\n\n${successMsg}`);
      else Alert.alert(successTitle, successMsg);
      setPhone('');
      setName('');
      setPropertyLocation('');
    } catch (e) {
      if (Platform.OS === 'web') window.alert('Error: Failed to submit your request. Please try again.');
      else Alert.alert('Error', 'Failed to submit your request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {!isDesktop && (
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.push('/')} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Property Management</Text>
          <View style={{ width: 24 }} />
        </View>
      )}

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
        <ImageBackground source={HERO_IMAGE} style={[styles.heroBanner, isDesktop && styles.heroBannerDesktop]}>
          <LinearGradient colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.8)']} style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <Text style={styles.heroSuperTitle}>REALSHARE MANAGEMENT</Text>
            <Text style={styles.heroTitle}>Complete peace of mind for your <Text style={{ color: GoldSystem.primaryGold }}>investments.</Text></Text>
            <Text style={styles.heroDesc}>End-to-end tenant and property lifecycle management.</Text>
          </View>
        </ImageBackground>

        <View style={[styles.mainSection, isDesktop && styles.mainSectionDesktop]}>
          <View style={[styles.detailsContainer, isDesktop && { flex: 1 }]}>
            <Text style={styles.promoHeader}>Property Management Services</Text>
            
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}><Text style={styles.iconText}>🛡️</Text></View>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Verified Tenant Placement</Text>
                <Text style={styles.featureDesc}>Rigorous background and credit checks to ensure reliable, trustworthy tenants for your property.</Text>
              </View>
            </View>
            
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}><Text style={styles.iconText}>🏦</Text></View>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Rent Collection</Text>
                <Text style={styles.featureDesc}>On-time digital rent payments collected securely and deposited directly into your bank account.</Text>
              </View>
            </View>
            
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}><Text style={styles.iconText}>🛠️</Text></View>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>24/7 Property Maintenance</Text>
                <Text style={styles.featureDesc}>Our network of trusted, certified vendors handles all repair and maintenance requests around the clock.</Text>
              </View>
            </View>
            
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}><Text style={styles.iconText}>📜</Text></View>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Comprehensive Legal Support</Text>
                <Text style={styles.featureDesc}>End-to-end assistance with rental agreements, compliance, and dispute resolution.</Text>
              </View>
            </View>


          </View>

          <View style={[styles.formContainer, isDesktop && { width: 400 }]}>
            <Text style={styles.formTitle}>Get a Free Quote</Text>
            <Text style={styles.formSubtitle}>Enter your details below</Text>
            
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
              placeholder="Property Location / City"
              value={propertyLocation}
              onChangeText={setPropertyLocation}
              placeholderTextColor={Neutrals.gray400}
            />
            
            {(() => {
              const isFormValid = name.trim() !== '' && phone.trim() !== '' && propertyLocation.trim() !== '';
              return (
                <TouchableOpacity 
                  style={[styles.submitBtn, (!isFormValid || submitting) && { opacity: 0.5 }]} 
                  onPress={submitInquiry} 
                  disabled={!isFormValid || submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color={Neutrals.obsidian} />
                  ) : (
                    <Text style={styles.submitText}>Submit Inquiry</Text>
                  )}
                </TouchableOpacity>
              );
            })()}
          </View>
        </View>
      </ScrollView>
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
    height: 300,
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
    marginBottom: 12,
    maxWidth: 600,
  },
  heroDesc: {
    ...Typography.bodyLarge,
    color: Neutrals.gray200,
    maxWidth: 600,
  },
  mainSection: {
    padding: 16,
    flexDirection: 'column',
    gap: 32,
  },
  mainSectionDesktop: {
    padding: 24,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 48,
  },
  detailsContainer: {
    // flex handled dynamically
  },
  promoHeader: {
    ...Typography.displaySmall,
    color: GoldSystem.darkGold,
    marginBottom: 32,
    fontWeight: 'bold',
  },
  disclaimerText: {
    ...Typography.bodySmall,
    color: Neutrals.gray500,
    fontStyle: 'italic',
    marginTop: 16,
  },
  sectionTitle: {
    ...Typography.headlineLarge,
    color: Neutrals.obsidian,
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    gap: 16,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Neutrals.white,
    borderWidth: 1,
    borderColor: Neutrals.gray200,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.soft,
  },
  iconText: {
    fontSize: 20,
    color: GoldSystem.darkGold,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    ...Typography.headlineSmall,
    color: Neutrals.obsidian,
    marginBottom: 4,
  },
  featureDesc: {
    ...Typography.bodyMedium,
    color: Neutrals.gray600,
    lineHeight: 22,
  },
  formContainer: {
    backgroundColor: Neutrals.surface,
    borderRadius: Radius.xl,
    padding: 24,
    borderWidth: 1,
    borderColor: Neutrals.border,
    ...Shadows.medium,
  },
  formTitle: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
    marginBottom: 4,
  },
  formSubtitle: {
    ...Typography.bodyMedium,
    color: Neutrals.gray600,
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: Neutrals.border,
    borderRadius: Radius.md,
    padding: 14,
    marginBottom: 16,
    ...Typography.bodyMedium,
    color: Neutrals.obsidian,
    backgroundColor: Neutrals.background,
  },
  submitBtn: {
    backgroundColor: GoldSystem.primaryGold,
    paddingVertical: 16,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: 8,
  },
  submitText: {
    ...Typography.labelLarge,
    color: Neutrals.obsidian,
  }
});
