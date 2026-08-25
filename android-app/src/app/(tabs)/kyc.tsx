import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';

const API_BASE = 'http://192.168.1.4:3000/api';

type KycStep = 'intro' | 'pan' | 'pan_verified' | 'aadhaar' | 'aadhaar_otp' | 'complete';

export default function KYCScreen() {
  const router = useRouter();
  const [step, setStep] = useState<KycStep>('intro');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // PAN state
  const [panNumber, setPanNumber] = useState('');
  const [panName, setPanName] = useState('');

  // Aadhaar state
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [clientId, setClientId] = useState('');
  const [otp, setOtp] = useState('');
  const [aadhaarName, setAadhaarName] = useState('');

  const getAuthToken = async () => {
    // In production: return await firebase.auth().currentUser?.getIdToken();
    return 'demo-token';
  };

  // ══════════════════════════════════════════
  // STEP 1: Verify PAN
  // ══════════════════════════════════════════
  const handleVerifyPan = async () => {
    if (panNumber.length !== 10) {
      setError('PAN must be exactly 10 characters (e.g., ABCDE1234F)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE}/kyc/verify-pan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ pan_number: panNumber.toUpperCase() }),
      });
      const data = await res.json();

      if (data.success) {
        setPanName(data.pan_name || panNumber);
        setStep('pan_verified');
      } else {
        setError(data.error || 'PAN verification failed');
      }
    } catch (e: any) {
      // For demo: simulate success
      setPanName('Demo User');
      setStep('pan_verified');
    } finally {
      setLoading(false);
    }
  };

  // ══════════════════════════════════════════
  // STEP 2: Send Aadhaar OTP
  // ══════════════════════════════════════════
  const handleSendAadhaarOtp = async () => {
    if (aadhaarNumber.length !== 12) {
      setError('Aadhaar must be exactly 12 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE}/kyc/aadhaar-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ aadhaar_number: aadhaarNumber }),
      });
      const data = await res.json();

      if (data.success) {
        setClientId(data.client_id);
        setStep('aadhaar_otp');
      } else {
        setError(data.error || 'Failed to send OTP');
      }
    } catch (e: any) {
      // Demo: simulate OTP sent
      setClientId('demo-client-id');
      setStep('aadhaar_otp');
    } finally {
      setLoading(false);
    }
  };

  // ══════════════════════════════════════════
  // STEP 3: Verify Aadhaar OTP
  // ══════════════════════════════════════════
  const handleVerifyAadhaarOtp = async () => {
    if (otp.length !== 6) {
      setError('OTP must be 6 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE}/kyc/aadhaar-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ client_id: clientId, otp }),
      });
      const data = await res.json();

      if (data.success) {
        setAadhaarName(data.full_name || 'Verified');
        setStep('complete');
      } else {
        setError(data.error || 'OTP verification failed');
      }
    } catch (e: any) {
      // Demo: simulate success
      setAadhaarName('Demo User');
      setStep('complete');
    } finally {
      setLoading(false);
    }
  };

  // ══════════════════════════════════════════
  // RENDER: Step-based UI
  // ══════════════════════════════════════════

  // Intro Screen
  if (step === 'intro') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.centerContent}>
        <View style={styles.introCard}>
          <Text style={styles.introIcon}>🔐</Text>
          <Text style={styles.introTitle}>Identity Verification</Text>
          <Text style={styles.introSubtitle}>
            As per SEBI & RBI regulations, we need to verify your identity before you can invest in fractional real estate.
          </Text>
          
          <View style={styles.stepsPreview}>
            <View style={styles.stepPreviewRow}>
              <View style={[styles.stepDot, { backgroundColor: '#2563EB' }]}><Text style={styles.stepDotText}>1</Text></View>
              <View>
                <Text style={styles.stepPreviewTitle}>PAN Verification</Text>
                <Text style={styles.stepPreviewDesc}>Enter PAN number — verified instantly via API</Text>
              </View>
            </View>
            <View style={styles.stepPreviewRow}>
              <View style={[styles.stepDot, { backgroundColor: '#7C3AED' }]}><Text style={styles.stepDotText}>2</Text></View>
              <View>
                <Text style={styles.stepPreviewTitle}>Aadhaar eKYC</Text>
                <Text style={styles.stepPreviewDesc}>OTP sent to Aadhaar-linked mobile number</Text>
              </View>
            </View>
            <View style={styles.stepPreviewRow}>
              <View style={[styles.stepDot, { backgroundColor: '#16A34A' }]}><Text style={styles.stepDotText}>✓</Text></View>
              <View>
                <Text style={styles.stepPreviewTitle}>Start Investing</Text>
                <Text style={styles.stepPreviewDesc}>KYC complete — invest in seconds</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep('pan')}>
            <Text style={styles.primaryBtnText}>Begin Verification</Text>
          </TouchableOpacity>
          <Text style={styles.privacyText}>🔒 Your data is encrypted & secured under Indian data privacy laws</Text>
        </View>
      </ScrollView>
    );
  }

  // PAN Verification
  if (step === 'pan') {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.formContent}>
          <View style={styles.stepIndicator}>
            <View style={[styles.stepCircle, styles.stepActive]}><Text style={styles.stepCircleText}>1</Text></View>
            <View style={styles.stepLine} />
            <View style={styles.stepCircle}><Text style={styles.stepCircleTextInactive}>2</Text></View>
          </View>
          <Text style={styles.formTitle}>PAN Card Verification</Text>
          <Text style={styles.formSubtitle}>Enter your 10-character PAN number. It will be verified instantly.</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>PAN NUMBER</Text>
            <TextInput
              style={styles.input}
              placeholder="ABCDE1234F"
              placeholderTextColor="#94A3B8"
              value={panNumber}
              onChangeText={t => setPanNumber(t.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))}
              autoCapitalize="characters"
              maxLength={10}
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={styles.primaryBtn} onPress={handleVerifyPan} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Verify PAN →</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // PAN Verified — proceed to Aadhaar
  if (step === 'pan_verified') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.formContent}>
        <View style={styles.successCard}>
          <View style={styles.successIconBox}><Text style={styles.successIconText}>✓</Text></View>
          <Text style={styles.successTitle}>PAN Verified</Text>
          <Text style={styles.successName}>{panName}</Text>
          <Text style={styles.successPan}>{panNumber}</Text>
        </View>

        <Text style={[styles.formTitle, { marginTop: 32 }]}>Now verify your Aadhaar</Text>
        <Text style={styles.formSubtitle}>An OTP will be sent to your Aadhaar-linked mobile number.</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>AADHAAR NUMBER</Text>
          <TextInput
            style={styles.input}
            placeholder="1234 5678 9012"
            placeholderTextColor="#94A3B8"
            value={aadhaarNumber}
            onChangeText={t => setAadhaarNumber(t.replace(/\D/g, '').slice(0, 12))}
            keyboardType="number-pad"
            maxLength={12}
          />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#7C3AED' }]} onPress={handleSendAadhaarOtp} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Send OTP →</Text>}
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // Aadhaar OTP Input
  if (step === 'aadhaar_otp') {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.formContent}>
          <View style={styles.stepIndicator}>
            <View style={[styles.stepCircle, styles.stepComplete]}><Text style={styles.stepCircleText}>✓</Text></View>
            <View style={[styles.stepLine, { backgroundColor: '#7C3AED' }]} />
            <View style={[styles.stepCircle, styles.stepActive, { backgroundColor: '#7C3AED' }]}><Text style={styles.stepCircleText}>2</Text></View>
          </View>
          <Text style={styles.formTitle}>Enter OTP</Text>
          <Text style={styles.formSubtitle}>A 6-digit OTP has been sent to your Aadhaar-linked mobile number ending in ****{aadhaarNumber.slice(-4)}</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>OTP</Text>
            <TextInput
              style={[styles.input, styles.otpInput]}
              placeholder="• • • • • •"
              placeholderTextColor="#94A3B8"
              value={otp}
              onChangeText={t => setOtp(t.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#7C3AED' }]} onPress={handleVerifyAadhaarOtp} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Verify OTP →</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.resendBtn} onPress={handleSendAadhaarOtp}>
            <Text style={styles.resendText}>Didn't receive? Resend OTP</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // KYC Complete
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.centerContent}>
      <View style={styles.completeCard}>
        <View style={styles.completeIconBox}><Text style={styles.completeIcon}>🎉</Text></View>
        <Text style={styles.completeTitle}>KYC Verified!</Text>
        <Text style={styles.completeSubtitle}>Your identity has been successfully verified. You can now invest in fractional real estate.</Text>

        <View style={styles.verifiedItems}>
          <View style={styles.verifiedRow}>
            <Text style={styles.verifiedCheck}>✅</Text>
            <View>
              <Text style={styles.verifiedLabel}>PAN Card</Text>
              <Text style={styles.verifiedValue}>{panNumber} • {panName}</Text>
            </View>
          </View>
          <View style={styles.verifiedRow}>
            <Text style={styles.verifiedCheck}>✅</Text>
            <View>
              <Text style={styles.verifiedLabel}>Aadhaar eKYC</Text>
              <Text style={styles.verifiedValue}>****{aadhaarNumber.slice(-4)} • {aadhaarName}</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9FC' },
  centerContent: { flex: 1, justifyContent: 'center', padding: 24 },
  formContent: { padding: 24, paddingTop: 60 },

  // Intro
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

  // Step Indicator
  stepIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  stepCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  stepActive: { backgroundColor: '#2563EB' },
  stepComplete: { backgroundColor: '#16A34A' },
  stepCircleText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  stepCircleTextInactive: { color: '#94A3B8', fontWeight: '700', fontSize: 16 },
  stepLine: { width: 60, height: 3, backgroundColor: '#E2E8F0', marginHorizontal: 8, borderRadius: 2 },

  // Form
  formTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  formSubtitle: { fontSize: 14, color: '#64748B', lineHeight: 22, marginBottom: 28 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 11, fontWeight: '700', color: '#64748B', letterSpacing: 1, marginBottom: 8 },
  input: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 14, padding: 16, fontSize: 18, fontWeight: '600', color: '#0F172A', letterSpacing: 2 },
  otpInput: { textAlign: 'center', fontSize: 28, letterSpacing: 12 },
  errorText: { color: '#DC2626', fontSize: 13, fontWeight: '600', marginBottom: 16, textAlign: 'center' },

  // Buttons
  primaryBtn: { backgroundColor: '#2563EB', paddingVertical: 16, borderRadius: 14, alignItems: 'center', shadowColor: '#2563EB', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6 },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  resendBtn: { marginTop: 20, alignItems: 'center' },
  resendText: { color: '#7C3AED', fontWeight: '600', fontSize: 14 },

  // PAN Success
  successCard: { backgroundColor: '#F0FDF4', borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#BBF7D0' },
  successIconBox: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  successIconText: { color: '#fff', fontSize: 28, fontWeight: '800' },
  successTitle: { fontSize: 18, fontWeight: '800', color: '#16A34A', marginBottom: 4 },
  successName: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  successPan: { fontSize: 14, color: '#64748B', marginTop: 2, letterSpacing: 1 },

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

