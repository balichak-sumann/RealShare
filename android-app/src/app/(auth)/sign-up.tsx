import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, ImageBackground, KeyboardAvoidingView, ScrollView } from 'react-native';
import { createUserWithEmailAndPassword, signInWithPhoneNumber, RecaptchaVerifier, ConfirmationResult, sendEmailVerification } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'expo-router';

// Premium dark luxury real estate background
const BG_IMAGE = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2000&auto=format&fit=crop';

export default function SignUpScreen() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [authStrategy, setAuthStrategy] = useState<'email' | 'phone'>('email');
  const [code, setCode] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [role, setRole] = useState<'investor' | 'agent' | 'builder'>('investor');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web' && !(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'firebase-recaptcha', {
        'size': 'invisible',
        'callback': (response: any) => {}
      });
    }
  }, []);

  const onSignUpPress = async () => {
    setLoading(true);
    setError('');

    const isEmail = identifier.includes('@');
    setAuthStrategy(isEmail ? 'email' : 'phone');

    try {
      if (isEmail) {
        const userCredential = await createUserWithEmailAndPassword(auth, identifier, password);
        try {
          if (referralCode) {
            const token = await userCredential.user.getIdToken();
            await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com'}/api/users/sync`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ referred_by_code: referralCode, role })
            });
          } else if (role !== 'investor') {
            const token = await userCredential.user.getIdToken();
            await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com'}/api/users/sync`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ role })
            });
          }
        } catch (e) {
          console.error("Failed to sync role", e);
        }

        await sendEmailVerification(userCredential.user);
      } else {
        const phone = identifier.startsWith('+') ? identifier : `+91${identifier}`;
        if (Platform.OS === 'web') {
          const appVerifier = (window as any).recaptchaVerifier;
          const confirmation = await signInWithPhoneNumber(auth, phone, appVerifier);
          setConfirmationResult(confirmation);
          setPendingVerification(true);
        } else {
          setError("Native phone auth requires React Native Firebase. Please test on Web for now.");
        }
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const onPressVerify = async () => {
    if (!confirmationResult) return;
    setLoading(true);
    setError('');

    try {
      const userCredential = await confirmationResult.confirm(code);
      try {
        if (referralCode && userCredential.user) {
          const token = await userCredential.user.getIdToken();
          await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com'}/api/users/sync`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ referred_by_code: referralCode, role })
          });
        } else if (role !== 'investor' && userCredential.user) {
          const token = await userCredential.user.getIdToken();
          await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com'}/api/users/sync`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ role })
          });
        }
      } catch (e) {
        console.error("Failed to sync role", e);
      }
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

                  <Text style={styles.label}>Email or Phone Number</Text>
                  <TextInput
                    autoCapitalize="none"
                    value={identifier}
                    placeholder="john@example.com or 9988776655"
                    placeholderTextColor="#94A3B8"
                    onChangeText={(text) => setIdentifier(text)}
                    style={styles.input}
                  />
                  
                  {identifier.includes('@') && (
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
                    {loading ? <ActivityIndicator color="#0F172A" /> : <Text style={styles.primaryButtonText}>Create Account</Text>}
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
                        await signInWithPopup(auth, googleProvider);
                      } else {
                        alert("Google Sign in on native requires Expo AuthSession");
                      }
                    } catch (err: any) {
                      setError(err.message || "Google sign in failed");
                    } finally {
                      setLoading(false);
                    }
                  }} disabled={loading}>
                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                  </TouchableOpacity>

                  <View style={styles.footer}>
                    <Text style={styles.footerText}>Already have an account? </Text>
                    <TouchableOpacity onPress={() => router.replace('/(auth)/sign-in')}>
                      <Text style={styles.linkText}>Log in</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {pendingVerification && (
                <View style={styles.form}>
                  <Text style={styles.label}>Verification Code</Text>
                  <Text style={{ color: '#94A3B8', marginBottom: 16 }}>
                    We've sent a 6-digit code to {identifier}
                  </Text>
                  <TextInput
                    value={code}
                    placeholder="Enter your verification code"
                    placeholderTextColor="#94A3B8"
                    onChangeText={(code) => setCode(code)}
                    style={styles.input}
                    keyboardType="number-pad"
                  />

                  <TouchableOpacity style={styles.primaryButton} onPress={onPressVerify} disabled={loading}>
                    {loading ? <ActivityIndicator color="#0F172A" /> : <Text style={styles.primaryButtonText}>Verify OTP</Text>}
                  </TouchableOpacity>
                </View>
              )}
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </View>
      {Platform.OS === 'web' && <div id="firebase-recaptcha"></div>}
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
  brandTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#D4AF37',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 12,
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  googleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
