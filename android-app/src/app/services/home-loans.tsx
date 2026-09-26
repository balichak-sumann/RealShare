// Asset refresh trigger 2
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground, TextInput, Alert, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '@/contexts/UserContext';
import { getApiUrl } from '@/lib/api';
import { useResponsive } from '@/hooks/useResponsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HERO_IMAGE = require('../../../assets/images/indian_home_loan.jpg');

const BANK_PARTNERS = [
  { name: 'Axis Bank', source: require('../../../assets/images/banks/axis.png') },
  { name: 'Kotak Bank', source: require('../../../assets/images/banks/kotak.png') },
  { name: 'HDFC Bank', source: require('../../../assets/images/banks/hdfc.png') },
  { name: 'ICICI Bank', source: require('../../../assets/images/banks/icici.png') },
  { name: 'SBI', source: require('../../../assets/images/banks/sbi.png') },
  { name: 'Union Bank', source: require('../../../assets/images/banks/union.png') },
  { name: 'IndusInd Bank', source: require('../../../assets/images/banks/indusind.png') },
];
export default function HomeLoansScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useUser();
  const { isDesktop, isTablet } = useResponsive();
  const isWide = isDesktop || isTablet;

  const [name, setName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone_number || '');
  const [loanAmount, setLoanAmount] = useState('');
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
          service_type: 'Home Loans',
          estimated_budget: loanAmount.trim() ? `Loan Amount: ${loanAmount.trim()}` : undefined,
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
      setLoanAmount('');
      setName('');
      setPhone('');
    } catch (e) {
      if (Platform.OS === 'web') window.alert('Error: Failed to submit your request. Please try again.');
      else Alert.alert('Error', 'Failed to submit your request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {!isWide && (
        <View style={[styles.header, { paddingTop: Platform.OS === 'web' ? 18 : Math.max(insets.top, 50) }]}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.push('/')} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Home Loans</Text>
          <View style={{ width: 24 }} />
        </View>
      )}

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
        <ImageBackground source={HERO_IMAGE} style={[styles.heroBanner, isWide && styles.heroBannerDesktop]}>
          <LinearGradient colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.8)']} style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <Text style={styles.heroSuperTitle}>REALSHARE FINANCE</Text>
            <Text style={styles.heroTitle}>Lowest Interest Rates. <Text style={{ color: GoldSystem.primaryGold }}>Instant Approvals.</Text></Text>
            <Text style={styles.heroDesc}>Partnered with top banks to make your dream home a reality.</Text>
          </View>
        </ImageBackground>

        <View style={[styles.mainSection, isWide && styles.mainSectionDesktop]}>
          <View style={[styles.detailsContainer, isWide && { flex: 1 }]}>
            <Text style={styles.promoHeader}>Get Home Loans at the Lowest rate from our partner Bank.</Text>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              <View style={styles.partnersGrid}>
                {BANK_PARTNERS.map((bank, index) => (
                  <View key={index} style={styles.partnerLogoContainer}>
                    <Image source={bank.source} style={styles.partnerLogo} contentFit="contain" />
                    <Text style={styles.partnerName}>{bank.name}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>

            <Text style={styles.sectionTitle}>Why choose RealShare Finance?</Text>
            
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}><Text style={styles.iconText}>%</Text></View>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Lowest rate</Text>
                <Text style={styles.featureDesc}>We negotiate with top banks to get you exclusive interest rates starting at 7.25%* p.a.</Text>
              </View>
            </View>
            
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}><Text style={styles.iconText}>⚡</Text></View>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Faster Processing</Text>
                <Text style={styles.featureDesc}>Get pre-approved in as little as 48 hours with minimal documentation required.</Text>
              </View>
            </View>
            
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}><Text style={styles.iconText}>🏢</Text></View>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>0%* Processing Fee</Text>
                <Text style={styles.featureDesc}>Special waiver on processing fees for select projects and banking partners.</Text>
              </View>
            </View>
            
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}><Text style={styles.iconText}>👨‍💼</Text></View>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Dedicated expert</Text>
                <Text style={styles.featureDesc}>A personal finance manager to handle your entire application process from start to finish.</Text>
              </View>
            </View>
          </View>

          <View style={[styles.formContainer, isWide && { width: 400 }]}>
            <Text style={styles.formTitle}>Check Your Eligibility</Text>
            <Text style={styles.formSubtitle}>Enter your details for a quick callback</Text>
            
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
              placeholder="Desired Loan Amount (₹)"
              value={loanAmount}
              onChangeText={setLoanAmount}
              keyboardType="number-pad"
              placeholderTextColor={Neutrals.gray400}
            />
            
            {(() => {
              const isFormValid = name.trim() !== '' && phone.trim() !== '' && loanAmount.trim() !== '';
              return (
                <TouchableOpacity 
                  style={[styles.submitBtn, (!isFormValid || submitting) && { opacity: 0.5 }]} 
                  onPress={submitInquiry} 
                  disabled={!isFormValid || submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color={Neutrals.obsidian} />
                  ) : (
                    <Text style={styles.submitText}>Get Free Consultation</Text>
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
  },
  partnersSection: {
    marginTop: 40,
  },
  partnersGrid: {
    flexDirection: 'row',
    gap: 16,
    paddingBottom: 8,
  },
  partnerLogoContainer: {
    width: 130,
    height: 120,
    backgroundColor: Neutrals.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Neutrals.gray200,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    ...Platform.select({
      ios: Shadows.soft,
      android: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 } as any,
      web: Shadows.soft,
    }),
  },
  partnerLogo: {
    width: 100,
    height: 70,
    marginBottom: 8,
  },
  partnerName: {
    ...Typography.labelSmall,
    color: Neutrals.gray600,
    fontSize: 9,
    textAlign: 'center',
  }
});
