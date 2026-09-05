import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, ImageBackground, KeyboardAvoidingView, ScrollView, Image, Alert, Modal } from 'react-native';
import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'expo-router';

import { useUser } from '@/contexts/UserContext';

// Premium dark luxury real estate background
const BG_IMAGE = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2000&auto=format&fit=crop';

export default function SignUpScreen() {
  const router = useRouter();
  const { setProfile } = useUser();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [role, setRole] = useState<'investor' | 'agent' | 'builder'>('investor');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const isEmail = identifier.includes('@');

  const syncUserToBackend = async (user: any) => {
    try {
      if (user) {
        const token = await user.getIdToken();
        const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com';
        const url = `${apiUrl}/api/users/sync`;
        console.log('[syncUserToBackend] Fetching URL:', url);
        console.log('[syncUserToBackend] Token prefix:', token?.substring(0, 20));
        const body: any = { role };
        if (referralCode) {
          body.referred_by_code = referralCode;
        }
        console.log('[syncUserToBackend] Body:', JSON.stringify(body));
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        });
        console.log('[syncUserToBackend] Response status:', res.status);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.profile) {
            if (role === 'builder') {
              // Sign out from client so builder logs in explicitly via login page
              await signOut(auth);
              setProfile(null);
              setShowSuccessModal(true);
            } else {
              setProfile(data.profile);
              router.replace('/');
            }
          }
        }
      }
    } catch (e: any) {
      console.error("Failed to sync role/referral", e);
      console.error("[syncUserToBackend] Error name:", e?.name, "message:", e?.message);
    }
  };

  const onSignUpPress = async () => {
    if (!identifier) {
      setError('Please enter your Email or Mobile Number.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isEmail) {
        if (!password) {
          setError('Please enter a password.');
          setLoading(false);
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, identifier.trim(), password);
        await syncUserToBackend(userCredential.user);
        
        // Send Email Verification
        try {
          await sendEmailVerification(userCredential.user);
          if (Platform.OS !== 'web') {
            Alert.alert('Verification Email Sent', 'Please check your inbox to verify your email address.');
          } else {
            window.alert('Verification Email Sent. Please check your inbox to verify your email address.');
          }
        } catch (e) {
          console.error("Failed to send verification email", e);
        }

        // onAuthStateChanged in _layout.tsx handles redirection
      } else {
        // Phone Number Validation
        const cleanedPhone = identifier.replace(/\D/g, '').slice(-10);
        if (cleanedPhone.length !== 10) {
          setError('Please enter a valid 10-digit mobile number.');
          setLoading(false);
          return;
        }
        if (!/^[6-9]/.test(cleanedPhone)) {
          setError('Mobile number must start with 7, 8, 9, or 6.');
          setLoading(false);
          return;
        }
        
        // Simulate network delay for OTP sending
        setTimeout(() => {
          setPendingVerification(true);
          setLoading(false);
        }, 800);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign up.');
      setLoading(false);
    }
  };

  const onVerifyOtpPress = async () => {
    if (code !== '123456') {
      setError('Invalid OTP. Please use 123456 for testing.');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      // Create the dummy email used for backend authentication
      const dummyEmail = `${identifier.trim()}@realshare.test`;
      const dummyPassword = `RealShare!123456`;

      const userCredential = await createUserWithEmailAndPassword(auth, dummyEmail, dummyPassword);
      await syncUserToBackend(userCredential.user);
      
      // onAuthStateChanged in _layout.tsx handles redirection
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('This phone number is already registered. Please log in.');
      } else {
        setError(err.message || 'Failed to create account.');
      }
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

                  <Text style={styles.label}>Email or Mobile Number</Text>
                  <TextInput
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={identifier}
                    placeholder="john@example.com or 9988776655"
                    placeholderTextColor="#94A3B8"
                    onChangeText={(text) => setIdentifier(text)}
                    style={styles.input}
                  />

                  {isEmail && (
                    <>
                      <Text style={styles.label}>Password</Text>
                      <TextInput
                        value={password}
                        placeholder="••••••••"
                        placeholderTextColor="#94A3B8"
                        secureTextEntry={true}
                        onChangeText={(password) => setPassword(password)}
                        style={styles.input}
                      />
                    </>
                  )}

                  <Text style={styles.label}>Referral Code (Optional)</Text>
                  <TextInput
                    value={referralCode}
                    placeholder="e.g. RS-VIKRAM-2026"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="characters"
                    onChangeText={(text) => setReferralCode(text)}
                    style={styles.input}
                  />

                  <TouchableOpacity style={styles.primaryButton} onPress={onSignUpPress} disabled={loading}>
                    {loading ? <ActivityIndicator color="#0F172A" /> : (
                      <Text style={styles.primaryButtonText}>{isEmail ? 'Create Account' : 'Send OTP'}</Text>
                    )}
                  </TouchableOpacity>

                  <View style={styles.dividerContainer}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>OR</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <TouchableOpacity style={styles.googleButton} onPress={async () => {
                    setLoading(true);
                    try {
                      if (Platform.OS === 'web') {
                        const { signInWithPopup } = await import('firebase/auth');
                        const { googleProvider } = await import('@/lib/firebase');
                        const userCred = await signInWithPopup(auth, googleProvider);
                        await syncUserToBackend(userCred.user);
                      } else {
                        alert("Google Sign in on native requires Expo AuthSession");
                      }
                    } catch (err: any) {
                      setError(err.message || "Google sign in failed");
                    } finally {
                      setLoading(false);
                    }
                  }} disabled={loading}>
                    <Image source={{ uri: 'https://cdn1.iconfinder.com/data/icons/google-s-logo/150/Google_Icons-09-512.png' }} style={{ width: 20, height: 20, marginRight: 12 }} />
                    <Text style={styles.googleButtonText}>Continue with Google</Text>
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
                    We've sent a 6-digit code to +91 {identifier}
                  </Text>
                  <Text style={{ color: '#D4AF37', marginBottom: 16, fontSize: 12 }}>
                    TEST MODE: Enter 123456
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

      {/* Account Created Success Dialog */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowSuccessModal(false);
          router.replace('/(auth)/sign-in');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconContainer}>
              <Text style={styles.modalIconText}>✓</Text>
            </View>

            <Text style={styles.modalTitle}>Account Created Successfully</Text>
            <Text style={styles.modalMessage}>
              Your Builder account has been created. Please log in with your credentials to access the Builder Portal.
            </Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowSuccessModal(false);
                router.replace('/(auth)/sign-in');
              }}
            >
              <Text style={styles.modalButtonText}>Go to Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleButtonText: {
    color: '#475569',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalIconText: {
    color: '#D4AF37',
    fontSize: 30,
    fontWeight: '800',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  modalButton: {
    backgroundColor: '#D4AF37',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  modalButtonText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  }
});
