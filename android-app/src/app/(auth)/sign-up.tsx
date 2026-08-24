import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { createUserWithEmailAndPassword, signInWithPhoneNumber, RecaptchaVerifier, ConfirmationResult, sendEmailVerification } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'expo-router';

export default function SignUpScreen() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [authStrategy, setAuthStrategy] = useState<'email' | 'phone'>('email');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  useEffect(() => {
    // Setup invisible reCAPTCHA for web
    if (Platform.OS === 'web' && !(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'firebase-recaptcha', {
        'size': 'invisible',
        'callback': (response: any) => {
          // reCAPTCHA solved
        }
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
        // Firebase Email Auth automatically signs the user in on creation
        const userCredential = await createUserWithEmailAndPassword(auth, identifier, password);
        await sendEmailVerification(userCredential.user);
        // onAuthStateChanged in _layout.tsx will redirect to verify-email
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
      await confirmationResult.confirm(code);
      // onAuthStateChanged in _layout.tsx will redirect
    } catch (err: any) {
      setError(err.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>RealShare</Text>
        <Text style={styles.subtitle}>Create your account to start investing</Text>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {!pendingVerification && (
        <View style={styles.form}>
          <Text style={styles.label}>Email or Phone Number</Text>
          <TextInput
            autoCapitalize="none"
            value={identifier}
            placeholder="john@example.com or 9988776655"
            placeholderTextColor="#9CA3AF"
            onChangeText={(text) => setIdentifier(text)}
            style={styles.input}
          />
          
          {/* Only show password if it looks like an email */}
          {identifier.includes('@') && (
            <>
              <Text style={styles.label}>Password</Text>
              <TextInput
                value={password}
                placeholder="********"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={true}
                onChangeText={(password) => setPassword(password)}
                style={styles.input}
              />
            </>
          )}

          <TouchableOpacity style={styles.primaryButton} onPress={onSignUpPress} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Sign Up</Text>}
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
          <Text style={{ color: '#6B7280', marginBottom: 12 }}>
            We've sent a 6-digit code to {identifier}
          </Text>
          <TextInput
            value={code}
            placeholder="Enter your verification code"
            placeholderTextColor="#9CA3AF"
            onChangeText={(code) => setCode(code)}
            style={styles.input}
            keyboardType="number-pad"
          />

          <TouchableOpacity style={styles.primaryButton} onPress={onPressVerify} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Verify OTP</Text>}
          </TouchableOpacity>
        </View>
      )}

      {/* Required for Firebase reCAPTCHA */}
      {Platform.OS === 'web' && <div id="firebase-recaptcha"></div>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A56DB',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#1A56DB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#1A56DB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: {
    color: '#6B7280',
    fontSize: 15,
  },
  linkText: {
    color: '#1A56DB',
    fontSize: 15,
    fontWeight: '600',
  },
  errorText: {
    color: '#DC2626',
    marginBottom: 16,
    textAlign: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  googleButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  }
});
