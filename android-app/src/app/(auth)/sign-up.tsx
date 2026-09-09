import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, KeyboardAvoidingView, ScrollView, Image, Modal } from 'react-native';
import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'expo-router';
import { AuthSplitLayout } from '@/components/layout/AuthSplitLayout';
import { Neutrals, GoldSystem, Radius, Typography, Shadows } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';

import { useUser } from '@/contexts/UserContext';
import { getApiUrl } from '@/lib/api';

// Email regex — must have valid format (user@domain.tld)
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const MIN_PASSWORD_LENGTH = 8;

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
        const apiUrl = getApiUrl();
        const url = `${apiUrl}/api/users/sync`;
        const body: any = { role };
        if (referralCode) {
          body.referred_by_code = referralCode;
        }
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.profile) {
            if (role === 'builder') {
              // Sign out from client so builder logs in explicitly via login page
              await signOut(auth).catch(() => {});
              setProfile(null);
              setShowSuccessModal(true);
            } else {
              setProfile(data.profile);
              router.replace('/');
            }
          }
        } else {
          if (role === 'builder') {
            await signOut(auth).catch(() => {});
            setProfile(null);
            setShowSuccessModal(true);
          } else {
            router.replace('/');
          }
        }
      }
    } catch (e: any) {
      console.error("Failed to sync role/referral", e?.message);
      if (role === 'builder') {
        await signOut(auth).catch(() => {});
        setProfile(null);
        setShowSuccessModal(true);
      } else {
        router.replace('/');
      }
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
        // Validate email format
        if (!EMAIL_REGEX.test(identifier.trim())) {
          setError('Please enter a valid email address (e.g. john@gmail.com).');
          setLoading(false);
          return;
        }
        if (!password) {
          setError('Please enter a password.');
          setLoading(false);
          return;
        }
        if (password.length < MIN_PASSWORD_LENGTH) {
          setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
          setLoading(false);
          return;
        }
        if (!/[A-Z]/.test(password)) {
          setError('Password must contain at least one uppercase letter.');
          setLoading(false);
          return;
        }
        if (!/[0-9]/.test(password)) {
          setError('Password must contain at least one number.');
          setLoading(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, identifier.trim(), password);
        await syncUserToBackend(userCredential.user);
        
        // Send Email Verification
        try {
          await sendEmailVerification(userCredential.user);
        } catch (e) {
          console.error("Failed to send verification email", e);
        }

        // Sign out and redirect to verify-email screen
        await signOut(auth);
        setProfile(null);
        router.replace('/verify-email' as any);
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
        }, 500);
      }
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please sign in instead.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please use at least 8 characters with uppercase and numbers.');
      } else {
        setError(err.message || 'Failed to sign up.');
      }
    } finally {
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
    <AuthSplitLayout>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, width: '100%' }}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          
          <View style={styles.card}>
            <View style={styles.header}>
              {Platform.OS !== 'web' && (
                <Text style={styles.mobileEyebrow}>RealShare</Text>
              )}
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
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={20} color={Neutrals.gray500} style={styles.inputIcon} />
                  <TextInput
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={identifier}
                    placeholder="john@example.com or 9988776655"
                    placeholderTextColor={Neutrals.gray400}
                    onChangeText={(text) => setIdentifier(text)}
                    style={styles.input}
                  />
                </View>

                {isEmail && (
                  <>
                    <Text style={styles.label}>Password</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="lock-closed-outline" size={20} color={Neutrals.gray500} style={styles.inputIcon} />
                      <TextInput
                        value={password}
                        placeholder="••••••••"
                        placeholderTextColor={Neutrals.gray400}
                        secureTextEntry={true}
                        onChangeText={(password) => setPassword(password)}
                        style={styles.input}
                      />
                    </View>
                  </>
                )}

                <Text style={styles.label}>Referral Code (Optional)</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="gift-outline" size={20} color={Neutrals.gray500} style={styles.inputIcon} />
                  <TextInput
                    value={referralCode}
                    placeholder="e.g. RS-VIKRAM-2026"
                    placeholderTextColor={Neutrals.gray400}
                    autoCapitalize="characters"
                    onChangeText={(text) => setReferralCode(text)}
                    style={styles.input}
                  />
                </View>

                <TouchableOpacity style={styles.primaryButton} onPress={onSignUpPress} disabled={loading}>
                  {loading ? <ActivityIndicator color={Neutrals.white} /> : (
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
                <Text style={{ color: Neutrals.gray500, marginBottom: 16 }}>
                  We've sent a 6-digit code to +91 {identifier}
                </Text>
                <Text style={{ color: GoldSystem.primaryGold, marginBottom: 16, fontSize: 12 }}>
                  TEST MODE: Enter 123456
                </Text>
                <View style={[styles.inputWrapper, { paddingHorizontal: 0 }]}>
                  <TextInput
                    value={code}
                    placeholder="------"
                    placeholderTextColor={Neutrals.gray300}
                    onChangeText={(c) => setCode(c.replace(/[^0-9]/g, ''))}
                    style={[styles.input, { textAlign: 'center', letterSpacing: 8, fontSize: 24, paddingVertical: 16 }]}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>

                <TouchableOpacity style={styles.primaryButton} onPress={onVerifyOtpPress} disabled={loading}>
                  {loading ? <ActivityIndicator color={Neutrals.white} /> : <Text style={styles.primaryButtonText}>Verify & Create Account</Text>}
                </TouchableOpacity>
                
                <TouchableOpacity style={{ marginTop: 20, alignItems: 'center' }} onPress={() => setPendingVerification(false)}>
                  <Text style={styles.linkText}>Change Phone Number</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.securityBadge}>
              <Ionicons name="shield-checkmark-outline" size={20} color={Neutrals.gray500} />
              <View style={{ marginLeft: 8 }}>
                <Text style={styles.securityBadgeTitle}>Your information is safe with us.</Text>
                <Text style={styles.securityBadgeSub}>We use industry-standard security measures.</Text>
              </View>
            </View>

          </View>

        </ScrollView>
      </KeyboardAvoidingView>

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
    </AuthSplitLayout>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: Platform.OS === 'web' ? 0 : 16,
  },
  card: {
    backgroundColor: Neutrals.white,
    borderRadius: Radius.xl,
    padding: Platform.OS === 'web' ? 40 : 24,
    width: '100%',
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 8px 32px rgba(0,0,0,0.06)'
    } : Shadows.medium),
  },
  header: {
    marginBottom: 32,
  },
  mobileEyebrow: {
    fontSize: 14,
    fontWeight: '700',
    color: GoldSystem.primaryGold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: Neutrals.obsidian,
    marginBottom: 8,
    fontFamily: 'serif',
  },
  subtitle: {
    fontSize: 15,
    color: Neutrals.gray500,
  },
  form: {
    width: '100%',
  },
  label: {
    ...Typography.caption,
    fontWeight: '600',
    color: Neutrals.obsidian,
    marginBottom: 8,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  rolePill: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: Neutrals.white,
    borderWidth: 1,
    borderColor: Neutrals.gray200,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  rolePillActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    borderColor: GoldSystem.primaryGold,
  },
  roleText: {
    color: Neutrals.gray600,
    fontWeight: '600',
    fontSize: 14,
  },
  roleTextActive: {
    color: GoldSystem.primaryGold,
    fontWeight: '700',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Neutrals.gray200,
    borderRadius: Radius.md,
    backgroundColor: Neutrals.white,
    paddingHorizontal: 16,
    marginBottom: 20,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 2px 4px rgba(0,0,0,0.02) inset'
    } : {}),
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: Neutrals.obsidian,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
  },
  primaryButton: {
    backgroundColor: GoldSystem.primaryGold,
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 4px 12px rgba(191, 155, 48, 0.25)'
    } : Shadows.soft),
  },
  primaryButtonText: {
    color: Neutrals.white,
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: {
    color: Neutrals.gray500,
    fontSize: 14,
  },
  linkText: {
    color: GoldSystem.primaryGold,
    fontSize: 14,
    fontWeight: '700',
  },
  errorText: {
    color: '#DC2626',
    marginBottom: 20,
    textAlign: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 12,
    borderRadius: Radius.md,
    fontSize: 14,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Neutrals.gray200,
  },
  dividerText: {
    marginHorizontal: 12,
    color: Neutrals.gray500,
    fontSize: 13,
    fontWeight: '600',
  },
  googleButton: {
    backgroundColor: Neutrals.white,
    borderWidth: 1,
    borderColor: Neutrals.gray200,
    borderRadius: Radius.md,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleButtonText: {
    color: Neutrals.obsidian,
    fontSize: 15,
    fontWeight: '600',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    paddingTop: 32,
    borderTopWidth: 1,
    borderTopColor: Neutrals.gray200,
  },
  securityBadgeTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Neutrals.gray600,
  },
  securityBadgeSub: {
    fontSize: 11,
    color: Neutrals.gray400,
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
