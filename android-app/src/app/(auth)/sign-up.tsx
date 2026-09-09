import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, KeyboardAvoidingView, ScrollView, Image, Modal, ImageBackground } from 'react-native';
import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'expo-router';
import { AuthSplitLayout } from '@/components/layout/AuthSplitLayout';
import { Neutrals, GoldSystem, Radius, Typography, Shadows } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '@/hooks/useResponsive';

import { useUser } from '@/contexts/UserContext';
import { getApiUrl } from '@/lib/api';

// Email regex — must have valid format (user@domain.tld)
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const MIN_PASSWORD_LENGTH = 8;
const BG_IMAGE = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2000&auto=format&fit=crop';

export default function SignUpScreen() {
  const router = useRouter();
  const { setProfile } = useUser();
  const { isDesktop } = useResponsive();
  const isDesktopWeb = isDesktop && Platform.OS === 'web';

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
        if (!EMAIL_REGEX.test(identifier.trim())) {
          setError('Please enter a valid email address (e.g. john@gmail.com).');
          setLoading(false); return;
        }
        if (!password) {
          setError('Please enter a password.');
          setLoading(false); return;
        }
        if (password.length < MIN_PASSWORD_LENGTH) {
          setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
          setLoading(false); return;
        }
        if (!/[A-Z]/.test(password)) {
          setError('Password must contain at least one uppercase letter.');
          setLoading(false); return;
        }
        if (!/[0-9]/.test(password)) {
          setError('Password must contain at least one number.');
          setLoading(false); return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, identifier.trim(), password);
        await syncUserToBackend(userCredential.user);
        
        try { await sendEmailVerification(userCredential.user); } catch (e) {}

        await signOut(auth);
        setProfile(null);
        router.replace('/verify-email' as any);
      } else {
        const cleanedPhone = identifier.replace(/\D/g, '').slice(-10);
        if (cleanedPhone.length !== 10) {
          setError('Please enter a valid 10-digit mobile number.');
          setLoading(false); return;
        }
        if (!/^[6-9]/.test(cleanedPhone)) {
          setError('Mobile number must start with 7, 8, 9, or 6.');
          setLoading(false); return;
        }
        
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
      const dummyEmail = `${identifier.trim()}@realshare.test`;
      const dummyPassword = `RealShare!123456`;

      const userCredential = await createUserWithEmailAndPassword(auth, dummyEmail, dummyPassword);
      await syncUserToBackend(userCredential.user);
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

  const renderFormContent = () => (
    <>
      <View style={isDesktopWeb ? styles.desktopHeader : styles.mobileHeader}>
        {!isDesktopWeb && (
          <Image source={require('../../../assets/logo.png')} style={{ width: 160, height: 40, resizeMode: 'contain', marginBottom: 12 }} />
        )}
        <Text style={isDesktopWeb ? styles.desktopTitle : styles.mobileTitle}>Create Account</Text>
        <Text style={isDesktopWeb ? styles.desktopSubtitle : styles.mobileSubtitle}>
          {isDesktopWeb ? "Join the premium fractional real estate network" : "Join the premium real estate network"}
        </Text>
      </View>

      {error ? <Text style={isDesktopWeb ? styles.desktopErrorText : styles.mobileErrorText}>{error}</Text> : null}

      {!pendingVerification && (
        <View style={styles.form}>
          <Text style={isDesktopWeb ? styles.desktopLabel : styles.mobileLabel}>I want to join as a:</Text>
          <View style={styles.roleRow}>
            {['investor', 'agent', 'builder'].map((r) => {
              const isActive = role === r;
              let rolePillStyle, roleTextStyle;
              if (isDesktopWeb) {
                rolePillStyle = [styles.desktopRolePill, isActive && styles.desktopRolePillActive];
                roleTextStyle = [styles.desktopRoleText, isActive && styles.desktopRoleTextActive];
              } else {
                rolePillStyle = [styles.mobileRolePill, isActive && styles.mobileRolePillActive];
                roleTextStyle = [styles.mobileRoleText, isActive && styles.mobileRoleTextActive];
              }
              return (
                <TouchableOpacity key={r} style={rolePillStyle} onPress={() => setRole(r as any)}>
                  <Text style={roleTextStyle}>{r.charAt(0).toUpperCase() + r.slice(1)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={isDesktopWeb ? styles.desktopLabel : styles.mobileLabel}>Email or Mobile Number</Text>
          {isDesktopWeb ? (
            <View style={styles.desktopInputWrapper}>
              <Ionicons name="mail-outline" size={20} color={Neutrals.gray500} style={styles.desktopInputIcon} />
              <TextInput
                autoCapitalize="none" keyboardType="email-address" value={identifier}
                placeholder="john@example.com or 9988776655" placeholderTextColor={Neutrals.gray400}
                onChangeText={setIdentifier} style={styles.desktopInput}
              />
            </View>
          ) : (
            <TextInput
              autoCapitalize="none" keyboardType="email-address" value={identifier}
              placeholder="john@example.com or 9988776655" placeholderTextColor="#94A3B8"
              onChangeText={setIdentifier} style={styles.mobileInput}
            />
          )}

          {isEmail && (
            <>
              <Text style={isDesktopWeb ? styles.desktopLabel : styles.mobileLabel}>Password</Text>
              {isDesktopWeb ? (
                <View style={styles.desktopInputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color={Neutrals.gray500} style={styles.desktopInputIcon} />
                  <TextInput
                    value={password} placeholder="••••••••" placeholderTextColor={Neutrals.gray400}
                    secureTextEntry={true} onChangeText={setPassword} style={styles.desktopInput}
                  />
                </View>
              ) : (
                <TextInput
                  value={password} placeholder="••••••••" placeholderTextColor="#94A3B8"
                  secureTextEntry={true} onChangeText={setPassword} style={styles.mobileInput}
                />
              )}
            </>
          )}

          <Text style={isDesktopWeb ? styles.desktopLabel : styles.mobileLabel}>Referral Code (Optional)</Text>
          {isDesktopWeb ? (
            <View style={styles.desktopInputWrapper}>
              <Ionicons name="gift-outline" size={20} color={Neutrals.gray500} style={styles.desktopInputIcon} />
              <TextInput
                value={referralCode} placeholder="e.g. RS-VIKRAM-2026" placeholderTextColor={Neutrals.gray400}
                autoCapitalize="characters" onChangeText={setReferralCode} style={styles.desktopInput}
              />
            </View>
          ) : (
             <TextInput
               value={referralCode} placeholder="e.g. RS-VIKRAM-2026" placeholderTextColor="#94A3B8"
               autoCapitalize="characters" onChangeText={setReferralCode} style={styles.mobileInput}
             />
          )}

          <TouchableOpacity style={isDesktopWeb ? styles.desktopPrimaryButton : styles.mobilePrimaryButton} onPress={onSignUpPress} disabled={loading}>
            {loading ? <ActivityIndicator color={isDesktopWeb ? Neutrals.white : "#0F172A"} /> : (
              <Text style={isDesktopWeb ? styles.desktopPrimaryButtonText : styles.mobilePrimaryButtonText}>{isEmail ? 'Create Account' : 'Send OTP'}</Text>
            )}
          </TouchableOpacity>

          <View style={isDesktopWeb ? styles.desktopDividerContainer : styles.mobileDividerContainer}>
            <View style={isDesktopWeb ? styles.desktopDividerLine : styles.mobileDividerLine} />
            <Text style={isDesktopWeb ? styles.desktopDividerText : styles.mobileDividerText}>OR</Text>
            <View style={isDesktopWeb ? styles.desktopDividerLine : styles.mobileDividerLine} />
          </View>

          <TouchableOpacity style={isDesktopWeb ? styles.desktopGoogleButton : styles.mobileGoogleButton} onPress={async () => {
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
            <Text style={isDesktopWeb ? styles.desktopGoogleButtonText : styles.mobileGoogleButtonText}>{isDesktopWeb ? "Continue with Google" : "Sign in with Google"}</Text>
          </TouchableOpacity>

          <View style={isDesktopWeb ? styles.desktopFooter : styles.mobileFooter}>
            <Text style={isDesktopWeb ? styles.desktopFooterText : styles.mobileFooterText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.replace('/sign-in')}>
              <Text style={styles.linkText}>Log in</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {pendingVerification && (
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
                value={code} placeholder="------" placeholderTextColor={Neutrals.gray300}
                onChangeText={(c) => setCode(c.replace(/[^0-9]/g, ''))}
                style={[styles.desktopInput, { textAlign: 'center', letterSpacing: 8, fontSize: 24, paddingVertical: 16 }]}
                keyboardType="number-pad" maxLength={6}
              />
            </View>
          ) : (
            <TextInput
              value={code} placeholder="------" placeholderTextColor="#94A3B8"
              onChangeText={(c) => setCode(c.replace(/[^0-9]/g, ''))}
              style={[styles.mobileInput, { textAlign: 'center', letterSpacing: 8, fontSize: 24 }]}
              keyboardType="number-pad" maxLength={6}
            />
          )}

          <TouchableOpacity style={isDesktopWeb ? styles.desktopPrimaryButton : styles.mobilePrimaryButton} onPress={onVerifyOtpPress} disabled={loading}>
            {loading ? <ActivityIndicator color={isDesktopWeb ? Neutrals.white : "#0F172A"} /> : <Text style={isDesktopWeb ? styles.desktopPrimaryButtonText : styles.mobilePrimaryButtonText}>Verify & Create Account</Text>}
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

  return (
    <>
      {isDesktopWeb ? (
        <AuthSplitLayout>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, width: '100%' }}>
            <ScrollView contentContainerStyle={styles.desktopScrollContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View style={styles.desktopCard}>
                {renderFormContent()}
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </AuthSplitLayout>
      ) : (
        <ImageBackground source={{ uri: BG_IMAGE }} style={styles.mobileBackgroundImage} resizeMode="cover">
          <View style={styles.mobileOverlay}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
              <ScrollView contentContainerStyle={styles.mobileScrollContainer} keyboardShouldPersistTaps="handled">
                <View style={styles.mobileGlassContainer}>
                  {renderFormContent()}
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        </ImageBackground>
      )}

      {/* Account Created Success Dialog */}
      <Modal visible={showSuccessModal} transparent={true} animationType="fade" onRequestClose={() => { setShowSuccessModal(false); router.replace('/(auth)/sign-in'); }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconContainer}><Text style={styles.modalIconText}>✓</Text></View>
            <Text style={styles.modalTitle}>Account Created Successfully</Text>
            <Text style={styles.modalMessage}>Your Builder account has been created. Please log in with your credentials to access the Builder Portal.</Text>
            <TouchableOpacity style={styles.modalButton} onPress={() => { setShowSuccessModal(false); router.replace('/(auth)/sign-in'); }}>
              <Text style={styles.modalButtonText}>Go to Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  form: { width: '100%' },
  linkText: { color: GoldSystem.primaryGold, fontSize: 14, fontWeight: '700' },
  roleRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },

  // --- Desktop Styles ---
  desktopScrollContainer: { flexGrow: 1, justifyContent: 'center', paddingVertical: 24 },
  desktopCard: { backgroundColor: Neutrals.white, borderRadius: Radius.xl, padding: 40, width: '100%', ...(Platform.OS === 'web' ? { boxShadow: '0 8px 32px rgba(0,0,0,0.06)' } : Shadows.medium) },
  desktopHeader: { marginBottom: 32 },
  desktopTitle: { fontSize: 32, fontWeight: '800', color: Neutrals.obsidian, marginBottom: 8, fontFamily: 'serif' },
  desktopSubtitle: { fontSize: 15, color: Neutrals.gray500 },
  desktopRolePill: { flex: 1, paddingVertical: 12, backgroundColor: Neutrals.white, borderWidth: 1, borderColor: Neutrals.gray200, borderRadius: Radius.md, alignItems: 'center' },
  desktopRolePillActive: { backgroundColor: 'rgba(212, 175, 55, 0.05)', borderColor: GoldSystem.primaryGold },
  desktopRoleText: { color: Neutrals.gray600, fontWeight: '600', fontSize: 14 },
  desktopRoleTextActive: { color: GoldSystem.primaryGold, fontWeight: '700' },
  desktopLabel: { ...Typography.caption, fontWeight: '600', color: Neutrals.obsidian, marginBottom: 8 },
  desktopInputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Neutrals.gray200, borderRadius: Radius.md, backgroundColor: Neutrals.white, paddingHorizontal: 16, marginBottom: 20, ...(Platform.OS === 'web' ? { boxShadow: '0 2px 4px rgba(0,0,0,0.02) inset' } : {}) },
  desktopInputIcon: { marginRight: 10 },
  desktopInput: { flex: 1, paddingVertical: 14, fontSize: 15, color: Neutrals.obsidian, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}) },
  desktopPrimaryButton: { backgroundColor: GoldSystem.primaryGold, borderRadius: Radius.md, paddingVertical: 16, alignItems: 'center', marginTop: 10, ...(Platform.OS === 'web' ? { boxShadow: '0 4px 12px rgba(191, 155, 48, 0.25)' } : Shadows.soft) },
  desktopPrimaryButtonText: { color: Neutrals.white, fontSize: 16, fontWeight: '700' },
  desktopFooter: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  desktopFooterText: { color: Neutrals.gray500, fontSize: 14 },
  desktopErrorText: { color: '#DC2626', marginBottom: 20, textAlign: 'center', backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', padding: 12, borderRadius: Radius.md, fontSize: 14 },
  desktopDividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  desktopDividerLine: { flex: 1, height: 1, backgroundColor: Neutrals.gray200 },
  desktopDividerText: { marginHorizontal: 12, color: Neutrals.gray500, fontSize: 13, fontWeight: '600' },
  desktopGoogleButton: { backgroundColor: Neutrals.white, borderWidth: 1, borderColor: Neutrals.gray200, borderRadius: Radius.md, paddingVertical: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  desktopGoogleButtonText: { color: Neutrals.obsidian, fontSize: 15, fontWeight: '600' },
  securityBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 40, paddingTop: 32, borderTopWidth: 1, borderTopColor: Neutrals.gray200 },
  securityBadgeTitle: { fontSize: 12, fontWeight: '600', color: Neutrals.gray600 },
  securityBadgeSub: { fontSize: 11, color: Neutrals.gray400 },

  // --- Old Mobile Styles ---
  mobileBackgroundImage: { flex: 1, width: '100%', height: '100%' },
  mobileOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.65)' },
  mobileScrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  mobileGlassContainer: { backgroundColor: 'rgba(15, 23, 42, 0.75)', borderRadius: 24, padding: 32, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.15)', ...(Platform.OS === 'web' ? { backdropFilter: 'blur(16px)' } : {}), shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10, maxWidth: 500, width: '100%', alignSelf: 'center' },
  mobileHeader: { marginBottom: 32, alignItems: 'center' },
  mobileTitle: { fontSize: 32, fontWeight: '800', color: '#FFFFFF', marginBottom: 8 },
  mobileSubtitle: { fontSize: 15, color: '#94A3B8' },
  mobileRolePill: { flex: 1, paddingVertical: 12, backgroundColor: 'rgba(0, 0, 0, 0.3)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 12, alignItems: 'center' },
  mobileRolePillActive: { backgroundColor: 'rgba(212, 175, 55, 0.2)', borderColor: '#D4AF37' },
  mobileRoleText: { color: '#94A3B8', fontWeight: '600', fontSize: 14 },
  mobileRoleTextActive: { color: '#D4AF37', fontWeight: '700' },
  mobileLabel: { fontSize: 13, fontWeight: '600', color: '#E2E8F0', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  mobileInput: { backgroundColor: 'rgba(0, 0, 0, 0.3)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#FFFFFF', marginBottom: 20 },
  mobilePrimaryButton: { backgroundColor: '#D4AF37', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 10, shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  mobilePrimaryButtonText: { color: '#0F172A', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  mobileFooter: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  mobileFooterText: { color: '#94A3B8', fontSize: 14 },
  mobileErrorText: { color: '#FCA5A5', marginBottom: 20, textAlign: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)', padding: 12, borderRadius: 8, fontSize: 14 },
  mobileDividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  mobileDividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)' },
  mobileDividerText: { marginHorizontal: 12, color: '#64748B', fontSize: 13, fontWeight: '600' },
  mobileGoogleButton: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingVertical: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  mobileGoogleButtonText: { color: '#475569', fontSize: 16, fontWeight: '700' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.75)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { backgroundColor: '#0F172A', borderRadius: 24, padding: 28, width: '100%', maxWidth: 420, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.3)', shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.5, shadowRadius: 24, elevation: 12 },
  modalIconContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(212, 175, 55, 0.15)', borderWidth: 1.5, borderColor: '#D4AF37', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  modalIconText: { color: '#D4AF37', fontSize: 30, fontWeight: '800' },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', marginBottom: 12, textAlign: 'center' },
  modalMessage: { fontSize: 15, color: '#94A3B8', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  modalButton: { backgroundColor: '#D4AF37', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, width: '100%', alignItems: 'center', shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  modalButtonText: { color: '#0F172A', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 }
});
