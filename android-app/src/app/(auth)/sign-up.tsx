import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, ImageBackground, KeyboardAvoidingView, ScrollView, Image } from 'react-native';
import { signInWithPhoneNumber, RecaptchaVerifier, ConfirmationResult } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'expo-router';

// Premium dark luxury real estate background
const BG_IMAGE = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2000&auto=format&fit=crop';

export default function SignUpScreen() {
  const router = useRouter();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [role, setRole] = useState<'investor' | 'agent' | 'builder'>('investor');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web' && !(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'firebase-recaptcha-signup', {
        'size': 'invisible',
        'callback': (response: any) => {}
      });
    }
  }, []);

  const onSendOtpPress = async () => {
    if (phoneNumber.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
      
      if (Platform.OS === 'web') {
        const appVerifier = (window as any).recaptchaVerifier;
        const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
        setConfirmationResult(confirmation);
        setPendingVerification(true);
      } else {
        setError("Native phone auth requires React Native Firebase. Please test on Web for now.");
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOtpPress = async () => {
    if (!confirmationResult || code.length < 6) {
      setError('Please enter a valid 6-digit OTP.');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const userCredential = await confirmationResult.confirm(code);
      
      // Sync extra user data to backend if needed
      try {
        if (userCredential.user) {
          const token = await userCredential.user.getIdToken();
          const body: any = { role };
          if (referralCode) {
            body.referred_by_code = referralCode;
          }
          await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com'}/api/users/sync`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
          });
        }
      } catch (e) {
        console.error("Failed to sync role/referral", e);
      }
      
      // onAuthStateChanged in _layout.tsx handles redirection
    } catch (err: any) {
      setError(err.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground source={{ uri: BG_IMAGE }} style={styles.backgroundImage} resizeMode="cover">
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
            
            <View style={styles.glassContainer}>
              <View style={styles.header}>
                <Image source={require('../../../assets/logo.png')} style={{ width: 160, height: 40, resizeMode: 'contain', marginBottom: 12 }} />
                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>Join the premium fractional real estate network</Text>
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              {!pendingVerification && (
                <View style={styles.form}>
                  <Text style={styles.label}>I want to join as a:</Text>
                  <View style={styles.roleRow}>
                    {['investor', 'agent', 'builder'].map((r) => (
                      <TouchableOpacity
                        key={r}
                        style={[styles.rolePill, role === r && styles.rolePillActive]}
                        onPress={() => setRole(r as any)}
                      >
                        <Text style={[styles.roleText, role === r && styles.roleTextActive]}>
                          {r.charAt(0).toUpperCase() + r.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.label}>Mobile Number</Text>
                  <View style={styles.phoneInputWrapper}>
                    <Text style={styles.countryCode}>+91</Text>
                    <TextInput
                      autoCapitalize="none"
                      keyboardType="phone-pad"
                      value={phoneNumber}
                      placeholder="9988776655"
                      placeholderTextColor="#94A3B8"
                      onChangeText={(num) => setPhoneNumber(num.replace(/[^0-9]/g, ''))}
                      maxLength={10}
                      style={[styles.input, { flex: 1, marginBottom: 0, borderLeftWidth: 0, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }]}
                    />
                  </View>

                  <Text style={styles.label}>Referral Code (Optional)</Text>
                  <TextInput
                    value={referralCode}
                    placeholder="e.g. RS-VIKRAM-2026"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="characters"
                    onChangeText={(text) => setReferralCode(text)}
                    style={styles.input}
                  />

                  <TouchableOpacity style={styles.primaryButton} onPress={onSendOtpPress} disabled={loading}>
                    {loading ? <ActivityIndicator color="#0F172A" /> : <Text style={styles.primaryButtonText}>Send OTP</Text>}
                  </TouchableOpacity>

                  <View style={styles.footer}>
                    <Text style={styles.footerText}>Already have an account? </Text>
                    <TouchableOpacity onPress={() => router.replace('/sign-in')}>
                      <Text style={styles.linkText}>Log in</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {pendingVerification && (
                <View style={styles.form}>
                  <Text style={styles.label}>Verification Code</Text>
                  <Text style={{ color: '#94A3B8', marginBottom: 16 }}>
                    We've sent a 6-digit code to +91 {phoneNumber}
                  </Text>
                  <TextInput
                    value={code}
                    placeholder="------"
                    placeholderTextColor="#94A3B8"
                    onChangeText={(c) => setCode(c.replace(/[^0-9]/g, ''))}
                    style={[styles.input, { textAlign: 'center', letterSpacing: 8, fontSize: 24 }]}
                    keyboardType="number-pad"
                    maxLength={6}
                  />

                  <TouchableOpacity style={styles.primaryButton} onPress={onVerifyOtpPress} disabled={loading}>
                    {loading ? <ActivityIndicator color="#0F172A" /> : <Text style={styles.primaryButtonText}>Verify & Create Account</Text>}
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={{ marginTop: 20, alignItems: 'center' }} onPress={() => setPendingVerification(false)}>
                    <Text style={styles.linkText}>Change Phone Number</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </View>
      {Platform.OS === 'web' && <div id="firebase-recaptcha-signup"></div>}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  glassContainer: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(16px)' } : {}),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#94A3B8',
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E2E8F0',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  countryCode: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRightWidth: 0,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#94A3B8',
  },
  input: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#D4AF37',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  linkText: {
    color: '#D4AF37',
    fontSize: 14,
    fontWeight: '700',
  },
  errorText: {
    color: '#FCA5A5',
    marginBottom: 20,
    textAlign: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  rolePill: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    alignItems: 'center',
  },
  rolePillActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderColor: '#D4AF37',
  },
  roleText: {
    color: '#94A3B8',
    fontWeight: '600',
    fontSize: 14,
  },
  roleTextActive: {
    color: '#D4AF37',
    fontWeight: '700',
  }
});
