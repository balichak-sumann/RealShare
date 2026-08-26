import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';

const API_BASE = `${process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com'}/api`;

WebBrowser.maybeCompleteAuthSession();

export default function KYCScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  // Use expo-linking to construct a return URL that works in Expo Go and standalone apps
  const returnUrl = Linking.createURL('kyc-success');

  useEffect(() => {
    // Listen for deep links returning from the browser
    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => subscription.remove();
  }, []);

  const handleDeepLink = (event: Linking.EventType) => {
    const data = Linking.parse(event.url);
    if (data.path === 'kyc-success' || event.url.includes('kyc-success')) {
      setIsVerified(true);
    }
  };

  const getAuthToken = async () => {
    // In production: return await firebase.auth().currentUser?.getIdToken();
    return 'demo-token';
  };

  const handleBeginVerification = async () => {
    setLoading(true);
    setError('');

    try {
      const token = await getAuthToken();
      
      // Construct the URL to our backend's DigiLocker auth init endpoint
      const authInitUrl = `${API_BASE}/kyc/digilocker/auth?token=${token}&return_url=${encodeURIComponent(returnUrl)}`;

      // Open the browser for the OAuth flow
      const result = await WebBrowser.openAuthSessionAsync(authInitUrl, returnUrl);

      if (result.type === 'success' && result.url) {
        // The browser was successfully redirected back to our app's scheme
        handleDeepLink({ url: result.url });
      } else if (result.type === 'cancel') {
        setError('Verification was cancelled.');
      }
    } catch (e: any) {
      console.error('WebBrowser Error:', e);
      setError('An error occurred while launching DigiLocker. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isVerified) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.centerContent}>
        <View style={styles.completeCard}>
          <View style={styles.completeIconBox}><Text style={styles.completeIcon}>🎉</Text></View>
          <Text style={styles.completeTitle}>KYC Verified!</Text>
          <Text style={styles.completeSubtitle}>Your identity has been successfully verified via DigiLocker. You can now invest in fractional real estate.</Text>

          <View style={styles.verifiedItems}>
            <View style={styles.verifiedRow}>
              <Text style={styles.verifiedCheck}>✅</Text>
              <View>
                <Text style={styles.verifiedLabel}>PAN & Aadhaar</Text>
                <Text style={styles.verifiedValue}>Fetched from DigiLocker</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#16A34A' }]} onPress={() => router.push('/' as any)}>
            <Text style={styles.primaryBtnText}>Start Investing →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.centerContent}>
      <View style={styles.introCard}>
        <Text style={styles.introIcon}>🔐</Text>
        <Text style={styles.introTitle}>Identity Verification</Text>
        <Text style={styles.introSubtitle}>
          As per SEBI & RBI regulations, we need to verify your identity before you can invest. We use DigiLocker for instant, paperless verification.
        </Text>
        
        <View style={styles.stepsPreview}>
          <View style={styles.stepPreviewRow}>
            <View style={[styles.stepDot, { backgroundColor: '#2563EB' }]}><Text style={styles.stepDotText}>1</Text></View>
            <View>
              <Text style={styles.stepPreviewTitle}>Connect DigiLocker</Text>
              <Text style={styles.stepPreviewDesc}>Login to your Govt. DigiLocker account</Text>
            </View>
          </View>
          <View style={styles.stepPreviewRow}>
            <View style={[styles.stepDot, { backgroundColor: '#7C3AED' }]}><Text style={styles.stepDotText}>2</Text></View>
            <View>
              <Text style={styles.stepPreviewTitle}>Provide Consent</Text>
              <Text style={styles.stepPreviewDesc}>Allow access to your PAN and Aadhaar</Text>
            </View>
          </View>
          <View style={styles.stepPreviewRow}>
            <View style={[styles.stepDot, { backgroundColor: '#16A34A' }]}><Text style={styles.stepDotText}>✓</Text></View>
            <View>
              <Text style={styles.stepPreviewTitle}>Start Investing</Text>
              <Text style={styles.stepPreviewDesc}>KYC complete in seconds</Text>
            </View>
          </View>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity style={styles.primaryBtn} onPress={handleBeginVerification} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Connect DigiLocker</Text>}
        </TouchableOpacity>
        <Text style={styles.privacyText}>🔒 Your data is encrypted & secured under Indian data privacy laws</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9FC' },
  centerContent: { flex: 1, justifyContent: 'center', padding: 24 },
  
  introCard: { backgroundColor: '#fff', borderRadius: 24, padding: 32, alignItems: 'center', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 20, elevation: 4 },
  introIcon: { fontSize: 48, marginBottom: 16 },
  introTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A', marginBottom: 8, textAlign: 'center' },
  introSubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  stepsPreview: { width: '100%', marginBottom: 28, gap: 20 },
  stepPreviewRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepDot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  stepDotText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  stepPreviewTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  stepPreviewDesc: { fontSize: 12, color: '#64748B', marginTop: 2 },
  privacyText: { fontSize: 11, color: '#94A3B8', textAlign: 'center', marginTop: 16 },

  errorText: { color: '#DC2626', fontSize: 13, fontWeight: '600', marginBottom: 16, textAlign: 'center' },

  primaryBtn: { backgroundColor: '#2563EB', paddingVertical: 16, borderRadius: 14, alignItems: 'center', shadowColor: '#2563EB', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6, width: '100%' },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },

  // Complete
  completeCard: { backgroundColor: '#fff', borderRadius: 24, padding: 32, alignItems: 'center', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 20, elevation: 4 },
  completeIconBox: { marginBottom: 16 },
  completeIcon: { fontSize: 56 },
  completeTitle: { fontSize: 26, fontWeight: '900', color: '#16A34A', marginBottom: 8 },
  completeSubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  verifiedItems: { width: '100%', gap: 16, marginBottom: 28 },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F0FDF4', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#BBF7D0' },
  verifiedCheck: { fontSize: 18 },
  verifiedLabel: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  verifiedValue: { fontSize: 12, color: '#64748B', marginTop: 2 },
});

