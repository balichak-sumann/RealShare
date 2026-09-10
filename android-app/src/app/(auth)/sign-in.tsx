import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, KeyboardAvoidingView, ScrollView, Image, ImageBackground, Linking } from 'react-native';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'expo-router';
import { AuthSplitLayout } from '@/components/layout/AuthSplitLayout';
import { Neutrals, GoldSystem, Radius, Typography, Shadows } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '@/hooks/useResponsive';

// Email regex — must have valid format (user@domain.tld)
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export default function SignInScreen() {
  const router = useRouter();
  const { isDesktop } = useResponsive();
  const isDesktopWeb = isDesktop && Platform.OS === 'web';

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

  const renderFormContent = () => (
    <>
      <View style={isDesktopWeb ? styles.desktopHeader : styles.mobileHeader}>
        {!isDesktopWeb && (
          <Image source={require('../../../assets/logo.png')} style={{ width: 160, height: 40, resizeMode: 'contain', marginBottom: 12 }} />
        )}
        <Text style={isDesktopWeb ? styles.desktopTitle : styles.mobileTitle}>Welcome Back</Text>
        <Text style={isDesktopWeb ? styles.desktopSubtitle : styles.mobileSubtitle}>
          {isDesktopWeb ? "Sign in to your account" : "Securely log in to your portfolio"}
        </Text>
      </View>

      {error ? <Text style={isDesktopWeb ? styles.desktopErrorText : styles.mobileErrorText}>{error}</Text> : null}

      {!pendingVerification ? (
        <View style={styles.form}>
          <Text style={isDesktopWeb ? styles.desktopLabel : styles.mobileLabel}>Email or Mobile Number</Text>
          {isDesktopWeb ? (
            <View style={styles.desktopInputWrapper}>
              <Ionicons name="mail-outline" size={20} color={Neutrals.gray500} style={styles.desktopInputIcon} />
              <TextInput
                autoCapitalize="none"
                keyboardType="email-address"
                value={identifier}
                placeholder="john@example.com or 9988776655"
                placeholderTextColor={Neutrals.gray400}
                onChangeText={(text) => setIdentifier(text)}
                style={styles.desktopInput}
              />
            </View>
          ) : (
            <TextInput
              autoCapitalize="none"
              keyboardType="email-address"
              value={identifier}
              placeholder="john@example.com or 9988776655"
              placeholderTextColor="#94A3B8"
              onChangeText={(text) => setIdentifier(text)}
              style={styles.mobileInput}
            />
          )}

          {isEmail && (
            <>
              <Text style={isDesktopWeb ? styles.desktopLabel : styles.mobileLabel}>Password</Text>
              {isDesktopWeb ? (
                <View style={styles.desktopInputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color={Neutrals.gray500} style={styles.desktopInputIcon} />
                  <TextInput
                    value={password}
                    placeholder="••••••••"
                    placeholderTextColor={Neutrals.gray400}
                    secureTextEntry={true}
                    onChangeText={(password) => setPassword(password)}
                    style={styles.desktopInput}
                  />
                </View>
              ) : (
                <TextInput
                  value={password}
                  placeholder="••••••••"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={true}
                  onChangeText={(password) => setPassword(password)}
                  style={styles.mobileInput}
                />
              )}
            </>
          )}

          <TouchableOpacity style={isDesktopWeb ? styles.desktopPrimaryButton : styles.mobilePrimaryButton} onPress={onSignInPress} disabled={loading}>
            {loading ? <ActivityIndicator color={isDesktopWeb ? Neutrals.white : "#0F172A"} /> : (
              <Text style={isDesktopWeb ? styles.desktopPrimaryButtonText : styles.mobilePrimaryButtonText}>{isEmail ? 'Sign In' : 'Send OTP'}</Text>
            )}
          </TouchableOpacity>

          <View style={isDesktopWeb ? styles.desktopDividerContainer : styles.mobileDividerContainer}>
            <View style={isDesktopWeb ? styles.desktopDividerLine : styles.mobileDividerLine} />
            <Text style={isDesktopWeb ? styles.desktopDividerText : styles.mobileDividerText}>OR</Text>
            <View style={isDesktopWeb ? styles.desktopDividerLine : styles.mobileDividerLine} />
          </View>

          <TouchableOpacity style={isDesktopWeb ? styles.desktopGoogleButton : styles.mobileGoogleButton} onPress={async () => {
            setLoading(true);
            setError('');
            try {
              if (Platform.OS === 'web') {
                const { signInWithPopup, getAdditionalUserInfo } = await import('firebase/auth');
                const { googleProvider } = await import('@/lib/firebase');
                const result = await signInWithPopup(auth, googleProvider);
                const additionalInfo = getAdditionalUserInfo(result);
                
                if (additionalInfo?.isNewUser) {
                  await result.user.delete();
                  setError('No account found with this Google account. Please create an account first.');
                  setLoading(false);
                  return;
                }
              } else {
                alert("Google Sign in on native requires Expo AuthSession");
              }
            } catch (err: any) {
              if (err.code !== 'auth/popup-closed-by-user') {
                setError(err.message || "Google sign in failed");
              }
            } finally {
              setLoading(false);
            }
          }} disabled={loading}>
            <Image source={{ uri: 'https://cdn1.iconfinder.com/data/icons/google-s-logo/150/Google_Icons-09-512.png' }} style={{ width: 20, height: 20, marginRight: 12 }} />
            <Text style={isDesktopWeb ? styles.desktopGoogleButtonText : styles.mobileGoogleButtonText}>{isDesktopWeb ? "Continue with Google" : "Sign in with Google"}</Text>
          </TouchableOpacity>

          <View style={isDesktopWeb ? styles.desktopFooter : styles.mobileFooter}>
            <Text style={isDesktopWeb ? styles.desktopFooterText : styles.mobileFooterText}>New to RealShare? </Text>
            <TouchableOpacity onPress={() => router.replace('/sign-up')}>
              <Text style={styles.linkText}>Create an Account</Text>
            </TouchableOpacity>
          </View>

          <View style={[isDesktopWeb ? styles.desktopFooter : styles.mobileFooter, { marginTop: 16 }]}>
            <Text style={isDesktopWeb ? styles.desktopFooterText : styles.mobileFooterText}>Are you an admin? </Text>
            <TouchableOpacity onPress={() => {
              if (Platform.OS === 'web') {
                window.location.href = 'https://admin.realshare.in';
              } else {
                Linking.openURL('https://admin.realshare.in');
              }
            }}>
              <Text style={styles.linkText}>Admin Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.form}>
          <Text style={isDesktopWeb ? styles.desktopLabel : styles.mobileLabel}>Verification Code</Text>
          <Text style={{ color: isDesktopWeb ? Neutrals.gray500 : '#94A3B8', marginBottom: 16 }}>
            We've sent a 6-digit code to +91 {identifier}
          </Text>
          <Text style={{ color: isDesktopWeb ? GoldSystem.primaryGold : '#D4AF37', marginBottom: 16, fontSize: 12 }}>
            TEST MODE: Enter 123456
          </Text>
          {isDesktopWeb ? (
            <View style={[styles.desktopInputWrapper, { paddingHorizontal: 0 }]}>
              <TextInput
                value={code}
                placeholder="------"
                placeholderTextColor={Neutrals.gray300}
                onChangeText={(c) => setCode(c.replace(/[^0-9]/g, ''))}
                style={[styles.desktopInput, { textAlign: 'center', letterSpacing: 8, fontSize: 24, paddingVertical: 16 }]}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>
          ) : (
            <TextInput
              value={code}
              placeholder="------"
              placeholderTextColor="#94A3B8"
              onChangeText={(c) => setCode(c.replace(/[^0-9]/g, ''))}
              style={[styles.mobileInput, { textAlign: 'center', letterSpacing: 8, fontSize: 24 }]}
              keyboardType="number-pad"
              maxLength={6}
            />
          )}

          <TouchableOpacity style={isDesktopWeb ? styles.desktopPrimaryButton : styles.mobilePrimaryButton} onPress={onVerifyOtpPress} disabled={loading}>
            {loading ? <ActivityIndicator color={isDesktopWeb ? Neutrals.white : "#0F172A"} /> : <Text style={isDesktopWeb ? styles.desktopPrimaryButtonText : styles.mobilePrimaryButtonText}>Verify & Login</Text>}
          </TouchableOpacity>
          
          <TouchableOpacity style={{ marginTop: 20, alignItems: 'center' }} onPress={() => setPendingVerification(false)}>
            <Text style={styles.linkText}>Change Phone Number</Text>
          </TouchableOpacity>
        </View>
      )}

      {isDesktopWeb && (
        <View style={styles.securityBadge}>
          <Ionicons name="shield-checkmark-outline" size={20} color={Neutrals.gray500} />
          <View style={{ marginLeft: 8 }}>
            <Text style={styles.securityBadgeTitle}>Your information is safe with us.</Text>
            <Text style={styles.securityBadgeSub}>We use industry-standard security measures.</Text>
          </View>
        </View>
      )}
    </>
  );

  if (isDesktopWeb) {
    return (
      <AuthSplitLayout>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, width: '100%' }}>
          <ScrollView contentContainerStyle={styles.desktopScrollContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.desktopCard}>
              {renderFormContent()}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </AuthSplitLayout>
    );
  }

  // Old Mobile View
  return (
    <ImageBackground source={require('../../../assets/images/auth_bg.jpg')} style={styles.mobileBackgroundImage} resizeMode="cover">
      <View style={styles.mobileOverlay}>
        <TouchableOpacity style={styles.mobileBackButton} onPress={() => router.replace('/')}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.mobileScrollContainer} keyboardShouldPersistTaps="handled">
            <View style={styles.mobileGlassContainer}>
              {renderFormContent()}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  form: { width: '100%' },
  linkText: { color: GoldSystem.primaryGold, fontSize: 14, fontWeight: '700' },

  // --- Desktop Styles ---
  desktopScrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 24,
  },
  desktopCard: {
    backgroundColor: Neutrals.white,
    borderRadius: Radius.xl,
    padding: 40,
    width: '100%',
    ...(Platform.OS === 'web' ? { boxShadow: '0 8px 32px rgba(0,0,0,0.06)' } : Shadows.medium),
  },
  desktopHeader: { marginBottom: 32 },
  desktopTitle: { fontSize: 32, fontWeight: '800', color: Neutrals.obsidian, marginBottom: 8, fontFamily: 'serif' },
  desktopSubtitle: { fontSize: 15, color: Neutrals.gray500 },
  desktopLabel: { ...Typography.caption, fontWeight: '600', color: Neutrals.obsidian, marginBottom: 8 },
  desktopInputWrapper: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Neutrals.gray200,
    borderRadius: Radius.md, backgroundColor: Neutrals.white, paddingHorizontal: 16, marginBottom: 20,
    ...(Platform.OS === 'web' ? { boxShadow: '0 2px 4px rgba(0,0,0,0.02) inset' } : {}),
  },
  desktopInputIcon: { marginRight: 10 },
  desktopInput: { flex: 1, paddingVertical: 14, fontSize: 15, color: Neutrals.obsidian, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}) },
  desktopPrimaryButton: {
    backgroundColor: GoldSystem.primaryGold, borderRadius: Radius.md, paddingVertical: 16, alignItems: 'center', marginTop: 10,
    ...(Platform.OS === 'web' ? { boxShadow: '0 4px 12px rgba(191, 155, 48, 0.25)' } : Shadows.soft),
  },
  desktopPrimaryButtonText: { color: Neutrals.white, fontSize: 16, fontWeight: '700' },
  desktopFooter: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  desktopFooterText: { color: Neutrals.gray500, fontSize: 14 },
  desktopErrorText: {
    color: '#DC2626', marginBottom: 20, textAlign: 'center', backgroundColor: '#FEF2F2',
    borderWidth: 1, borderColor: '#FECACA', padding: 12, borderRadius: Radius.md, fontSize: 14,
  },
  desktopDividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  desktopDividerLine: { flex: 1, height: 1, backgroundColor: Neutrals.gray200 },
  desktopDividerText: { marginHorizontal: 12, color: Neutrals.gray500, fontSize: 13, fontWeight: '600' },
  desktopGoogleButton: {
    backgroundColor: Neutrals.white, borderWidth: 1, borderColor: Neutrals.gray200, borderRadius: Radius.md,
    paddingVertical: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
  },
  desktopGoogleButtonText: { color: Neutrals.obsidian, fontSize: 15, fontWeight: '600' },
  securityBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 40, paddingTop: 32, borderTopWidth: 1, borderTopColor: Neutrals.gray200 },
  securityBadgeTitle: { fontSize: 12, fontWeight: '600', color: Neutrals.gray600 },
  securityBadgeSub: { fontSize: 11, color: Neutrals.gray400 },

  // --- Old Mobile Styles ---
  mobileBackgroundImage: { flex: 1, width: '100%', height: '100%' },
  mobileOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.65)' },
  mobileBackButton: {
    position: 'absolute', top: Platform.OS === 'ios' ? 60 : 40, left: 24, zIndex: 10,
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  mobileScrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  mobileGlassContainer: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)', borderRadius: 24, padding: 32, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.15)',
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(16px)' } : {}), shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3, shadowRadius: 20, elevation: 10, maxWidth: 500, width: '100%', alignSelf: 'center',
  },
  mobileHeader: { marginBottom: 32, alignItems: 'center' },
  mobileTitle: { fontSize: 32, fontWeight: '800', color: '#FFFFFF', marginBottom: 8 },
  mobileSubtitle: { fontSize: 15, color: '#94A3B8' },
  mobileLabel: { fontSize: 13, fontWeight: '600', color: '#E2E8F0', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  mobileInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#FFFFFF', marginBottom: 20,
  },
  mobilePrimaryButton: {
    backgroundColor: '#D4AF37', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 10,
    shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  mobilePrimaryButtonText: { color: '#0F172A', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  mobileFooter: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  mobileFooterText: { color: '#94A3B8', fontSize: 14 },
  mobileErrorText: {
    color: '#FCA5A5', marginBottom: 20, textAlign: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)', padding: 12, borderRadius: 8, fontSize: 14,
  },
  mobileDividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  mobileDividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)' },
  mobileDividerText: { marginHorizontal: 12, color: '#64748B', fontSize: 13, fontWeight: '600' },
  mobileGoogleButton: {
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingVertical: 14,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
  },
  mobileGoogleButtonText: { color: '#475569', fontSize: 16, fontWeight: '700' },
});
