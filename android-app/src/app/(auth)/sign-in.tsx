import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, KeyboardAvoidingView, ScrollView, Image } from 'react-native';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'expo-router';
import { AuthSplitLayout } from '@/components/layout/AuthSplitLayout';
import { Neutrals, GoldSystem, Radius, Typography, Shadows } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';

// Email regex — must have valid format (user@domain.tld)
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function SignInScreen() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [pendingVerification, setPendingVerification] = useState(false);

  const isEmail = identifier.includes('@');

  const onSignInPress = async () => {
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
          setError('Please enter your password.');
          setLoading(false);
          return;
        }
        const userCredential = await signInWithEmailAndPassword(auth, identifier.trim(), password);
        
        // Check if email is verified (skip for @realshare.test phone-based accounts)
        if (!userCredential.user.emailVerified && !identifier.trim().endsWith('@realshare.test')) {
          await signOut(auth);
          setError('Please verify your email before signing in. Check your inbox for a verification link.');
          setLoading(false);
          return;
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
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password. Please check your credentials or create an account.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.');
      } else {
        setError(err.message || 'Failed to sign in.');
      }
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

      await signInWithEmailAndPassword(auth, dummyEmail, dummyPassword);
      // onAuthStateChanged in _layout.tsx handles redirection
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError("Account not found. Please create an account first.");
      } else {
        setError(err.message || 'Invalid code.');
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
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to your account</Text>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {!pendingVerification ? (
              <View style={styles.form}>
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

                <TouchableOpacity style={styles.primaryButton} onPress={onSignInPress} disabled={loading}>
                  {loading ? <ActivityIndicator color={Neutrals.white} /> : (
                    <Text style={styles.primaryButtonText}>{isEmail ? 'Sign In' : 'Send OTP'}</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.dividerContainer}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity style={styles.googleButton} onPress={async () => {
                  setLoading(true);
                  setError('');
                  try {
                    if (Platform.OS === 'web') {
                      const { signInWithPopup, getAdditionalUserInfo } = await import('firebase/auth');
                      const { googleProvider } = await import('@/lib/firebase');
                      const result = await signInWithPopup(auth, googleProvider);
                      const additionalInfo = getAdditionalUserInfo(result);
                      
                      if (additionalInfo?.isNewUser) {
                        // This Google account was never registered — delete it and show error
                        await result.user.delete();
                        setError('No account found with this Google account. Please create an account first.');
                        setLoading(false);
                        return;
                      }
                      // Existing user — sign-in proceeds via onAuthStateChanged
                    } else {
                      alert("Google Sign in on native requires Expo AuthSession");
                    }
                  } catch (err: any) {
                    if (err.code === 'auth/popup-closed-by-user') {
                      // User closed the popup, not an error
                    } else {
                      setError(err.message || "Google sign in failed");
                    }
                  } finally {
                    setLoading(false);
                  }
                }} disabled={loading}>
                  <Image source={{ uri: 'https://cdn1.iconfinder.com/data/icons/google-s-logo/150/Google_Icons-09-512.png' }} style={{ width: 20, height: 20, marginRight: 12 }} />
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                </TouchableOpacity>

                <View style={styles.footer}>
                  <Text style={styles.footerText}>New to RealShare? </Text>
                  <TouchableOpacity onPress={() => router.replace('/sign-up')}>
                    <Text style={styles.linkText}>Create an Account</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
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
                  {loading ? <ActivityIndicator color={Neutrals.white} /> : <Text style={styles.primaryButtonText}>Verify & Login</Text>}
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
  }
});
