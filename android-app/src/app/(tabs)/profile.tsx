import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import React, { useState, useEffect, useRef } from 'react';
import { auth, app } from '@/lib/firebase';
import { PhoneAuthProvider, linkWithCredential, verifyBeforeUpdateEmail, RecaptchaVerifier } from 'firebase/auth';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { useUser } from '@/contexts/UserContext';
import { GuestView } from '@/components/ui/GuestView';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile: user, setProfile } = useUser();
  const [loading, setLoading] = useState(false);
  
  // OTP Verification States
  const [isOtpModalVisible, setOtpModalVisible] = useState(false);
  const [otpType, setOtpType] = useState<'phone' | 'email'>('phone');
  const [otpStep, setOtpStep] = useState<'input' | 'code'>('input');
  const [inputValue, setInputValue] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationId, setVerificationId] = useState('');
  const recaptchaVerifier = useRef(null);

  const handleAvatarEdit = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        if (user) {
          setProfile({ ...user, avatar_url: imageUri });
        }
        // In a real app, we would upload this to Firebase Storage/S3 here
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.replace('/sign-in' as any);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handleSendOtp = async () => {
    if (otpType === 'phone' && inputValue.length < 10) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    if (otpType === 'email' && !inputValue.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    
    setIsVerifying(true);
    
    try {
      if (otpType === 'phone') {
        let appVerifier: any;
        
        if (Platform.OS === 'web') {
          // On Web, use Firebase's native RecaptchaVerifier
          if (!(window as any).recaptchaVerifier) {
            (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
              size: 'invisible'
            });
          }
          appVerifier = (window as any).recaptchaVerifier;
        } else {
          // On Native, use the Expo modal
          appVerifier = recaptchaVerifier.current!;
        }

        const phoneProvider = new PhoneAuthProvider(auth);
        const vId = await phoneProvider.verifyPhoneNumber(`+91${inputValue}`, appVerifier);
        setVerificationId(vId);
        setOtpStep('code');
      } else {
        if (auth.currentUser) {
          await verifyBeforeUpdateEmail(auth.currentUser, inputValue);
          Alert.alert('Email Sent', `A verification link has been sent to ${inputValue}. Please check your inbox and verify before continuing.`);
          setOtpModalVisible(false);
          setOtpStep('input');
          setInputValue('');
        }
      }
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.message || 'Failed to send verification.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (codeInput.length < 6) {
      Alert.alert('Invalid Code', 'Please enter the 6-digit OTP code.');
      return;
    }
    setIsVerifying(true);
    
    try {
      if (otpType === 'phone' && auth.currentUser) {
        const credential = PhoneAuthProvider.credential(verificationId, codeInput);
        await linkWithCredential(auth.currentUser, credential);
        
        // Sync with backend
        const token = await auth.currentUser.getIdToken();
        await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com'}/api/users/sync`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (user) {
          setProfile({ ...user, phone_number: `+91 ${inputValue}` });
        }
        
        setOtpModalVisible(false);
        Alert.alert('Success', 'Mobile number verified successfully!');
        
        setTimeout(() => {
          setOtpStep('input');
          setInputValue('');
          setCodeInput('');
        }, 500);
      }
    } catch (err: any) {
      console.error(err);
      Alert.alert('Verification Failed', err.message || 'Invalid code.');
    } finally {
      setIsVerifying(false);
    }
  };



  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#1A56DB" />
      </View>
    );
  }

  if (!auth.currentUser) {
    return (
      <GuestView 
        title="Sign In Required" 
        description="Create an account or sign in to view your profile, manage verifications, and track your investments." 
        icon="👤"
      />
    );
  }


  const initials = (user?.full_name || 'U').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Firebase Recaptcha for Native */}
        {Platform.OS !== 'web' && (
          <FirebaseRecaptchaVerifierModal
            ref={recaptchaVerifier}
            firebaseConfig={app.options}
            attemptInvisibleVerification={true}
          />
        )}

        {/* Firebase Recaptcha Container for Web */}
        {Platform.OS === 'web' && (
          <View nativeID="recaptcha-container" />
        )}

        {/* Profile Card */}
        <View style={styles.profileCard}>
          {/* Avatar */}
          <View style={styles.avatarSection}>
            {user?.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
            <TouchableOpacity style={styles.editAvatarBtn} onPress={handleAvatarEdit}>
              <Text style={styles.editAvatarText}>📷</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.userName}>{user?.full_name || 'User'}</Text>
          <Text style={styles.userRole}>{(user?.role || 'investor').charAt(0).toUpperCase() + (user?.role || 'investor').slice(1)}</Text>


        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.infoCard}>
            <TouchableOpacity 
              style={styles.infoRow}
              onPress={() => {
                if (!user?.email) {
                  setOtpType('email');
                  setOtpStep('input');
                  setOtpModalVisible(true);
                }
              }}
              activeOpacity={user?.email ? 1 : 0.7}
            >
              <View style={styles.infoIconBox}>
                <Text style={styles.infoIcon}>📧</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email Address</Text>
                {user?.email ? (
                  <Text style={styles.infoValue}>{user.email}</Text>
                ) : (
                  <Text style={[styles.infoValue, { color: '#D97706' }]}>Pending - Tap to Verify</Text>
                )}
              </View>
              {!user?.email && (
                <Text style={styles.verifyArrow}>›</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity 
              style={styles.infoRow}
              onPress={() => {
                if (!user?.phone_number) {
                  setOtpType('phone');
                  setOtpStep('input');
                  setOtpModalVisible(true);
                }
              }}
              activeOpacity={user?.phone_number ? 1 : 0.7}
            >
              <View style={styles.infoIconBox}>
                <Text style={styles.infoIcon}>📱</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Mobile Number</Text>
                {user?.phone_number ? (
                  <Text style={styles.infoValue}>{user.phone_number}</Text>
                ) : (
                  <Text style={[styles.infoValue, { color: '#D97706' }]}>Pending - Tap to Verify</Text>
                )}
              </View>
              {!user?.phone_number && (
                <Text style={styles.verifyArrow}>›</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIconBox}>
                <Text style={styles.infoIcon}>📅</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Member Since</Text>
                <Text style={styles.infoValue}>
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                </Text>
              </View>
            </View>
          </View>
        </View>



        {/* Wallet (Investor Only) */}
        {(!user?.role || user?.role === 'investor' || user?.role === 'admin') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Wallet</Text>
            <View style={styles.walletCard}>
              <View>
                <Text style={styles.walletLabel}>Available Balance</Text>
                <Text style={styles.walletAmount}>₹ {Number(user?.wallet_balance || 0).toLocaleString('en-IN')}</Text>
              </View>
              <TouchableOpacity style={styles.walletBtn} onPress={() => Alert.alert('Coming Soon', 'Payment Gateway Integration is pending.')}>
                <Text style={styles.walletBtnText}>+ Add Money</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Quick Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Links</Text>
          <View style={styles.linksCard}>
            {[
              ...((!user?.role || user?.role === 'investor' || user?.role === 'admin') ? [
                { icon: '📈', label: 'My Investments', route: '/portfolio?from=profile' },
                { icon: '🔍', label: 'Explore Properties', route: '/explore?from=profile' },
                { icon: '📄', label: 'Transaction History', route: '/portfolio?from=profile' },
              ] : []),
              { icon: '❓', label: 'Help & Support', route: 'alert_support' },
              { icon: '⚙️', label: 'Settings', route: 'alert_settings' },
            ].map((link, idx) => (
              <React.Fragment key={link.label}>
                {idx > 0 && <View style={styles.divider} />}
                <TouchableOpacity
                  style={styles.linkRow}
                  onPress={() => {
                    if (link.route === 'alert_support') Alert.alert('Support', 'Help Center coming soon.');
                    else if (link.route === 'alert_settings') Alert.alert('Settings', 'Settings screen coming soon.');
                    else router.push(link.route as any);
                  }}
                >
                  <View style={styles.linkIconBox}>
                    <Text style={styles.linkIcon}>{link.icon}</Text>
                  </View>
                  <Text style={styles.linkText}>{link.label}</Text>
                  <Text style={styles.linkArrow}>›</Text>
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Logout Button */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>🚪  Logout</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* OTP Verification Modal */}
      <Modal
        visible={isOtpModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setOtpModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {otpStep === 'input' 
                  ? `Verify ${otpType === 'phone' ? 'Mobile Number' : 'Email Address'}` 
                  : 'Enter Verification Code'}
              </Text>
              <TouchableOpacity onPress={() => setOtpModalVisible(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {otpStep === 'input' ? (
                <>
                  <Text style={styles.modalSubtitle}>
                    Please enter your {otpType === 'phone' ? 'mobile number' : 'email address'} to receive a one-time verification code (OTP).
                  </Text>
                  
                  {otpType === 'phone' ? (
                    <View style={styles.phoneInputContainer}>
                      <Text style={styles.countryCode}>+91</Text>
                      <TextInput
                        style={styles.phoneInput}
                        placeholder="10-digit mobile number"
                        keyboardType="numeric"
                        maxLength={10}
                        value={inputValue}
                        onChangeText={setInputValue}
                      />
                    </View>
                  ) : (
                    <View style={styles.phoneInputContainer}>
                      <TextInput
                        style={styles.phoneInput}
                        placeholder="your@email.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={inputValue}
                        onChangeText={setInputValue}
                      />
                    </View>
                  )}

                  <TouchableOpacity 
                    style={[styles.primaryBtn, inputValue.length < 5 && styles.disabledBtn]} 
                    onPress={handleSendOtp}
                    disabled={isVerifying || inputValue.length < 5}
                  >
                    {isVerifying ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.primaryBtnText}>Send OTP</Text>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.modalSubtitle}>
                    We've sent a 6-digit verification code to {otpType === 'phone' ? '+91 ' : ''}{inputValue}.
                  </Text>
                  <TextInput
                    style={styles.otpInput}
                    placeholder="------"
                    keyboardType="numeric"
                    maxLength={6}
                    value={codeInput}
                    onChangeText={setCodeInput}
                    textAlign="center"
                  />
                  <TouchableOpacity 
                    style={[styles.primaryBtn, codeInput.length < 6 && styles.disabledBtn]} 
                    onPress={handleVerifyOtp}
                    disabled={isVerifying || codeInput.length < 6}
                  >
                    {isVerifying ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.primaryBtnText}>Verify OTP</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.textBtn} 
                    onPress={() => setOtpStep('input')}
                    disabled={isVerifying}
                  >
                    <Text style={styles.textBtnLabel}>Change {otpType === 'phone' ? 'Phone Number' : 'Email'}</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A1A',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: 'rgba(10,10,26,0.85)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(20px)' } as any : {}),
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileCard: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    margin: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(20px)' } as any : {}),
  },
  avatarSection: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: '#D4AF37',
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(212,175,55,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(212,175,55,0.5)',
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: '800',
    color: '#D4AF37',
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: -4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  editAvatarText: {
    fontSize: 14,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: '#D4AF37',
    marginBottom: 12,
    fontWeight: '600',
  },
  kycBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  kycBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  manageText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#D4AF37',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(20px)' } as any : {}),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  infoIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(212,175,55,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  infoIcon: {
    fontSize: 18,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 16,
  },
  docCard: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  docIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(212,175,55,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  docIcon: {
    fontSize: 18,
  },
  docContent: {
    flex: 1,
  },
  docTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  docSubtext: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  docStatusPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  docStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  completeKycBtn: {
    backgroundColor: '#D4AF37',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  completeKycText: {
    color: '#0A0A1A',
    fontWeight: '700',
    fontSize: 14,
  },
  walletCard: {
    backgroundColor: 'rgba(212,175,55,0.1)',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.25)',
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(20px)' } as any : {}),
  },
  walletLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 4,
  },
  walletAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  walletBtn: {
    backgroundColor: 'rgba(212,175,55,0.2)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.4)',
  },
  walletBtnText: {
    color: '#D4AF37',
    fontWeight: '700',
    fontSize: 13,
  },
  linksCard: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(20px)' } as any : {}),
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  linkIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  linkIcon: {
    fontSize: 16,
  },
  linkText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  linkArrow: {
    fontSize: 22,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '300',
  },
  logoutBtn: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  logoutText: {
    color: '#F87171',
    fontWeight: '700',
    fontSize: 15,
  },
  verifyArrow: {
    fontSize: 22,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '300',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#12122A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 320,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  closeBtn: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
  },
  closeBtnText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '700',
  },
  modalBody: {
    flex: 1,
  },
  modalSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 20,
    marginBottom: 24,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 24,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 12,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.15)',
    paddingRight: 12,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
  },
  otpInput: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 64,
    marginBottom: 24,
    backgroundColor: 'rgba(255,255,255,0.07)',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 8,
    color: '#FFFFFF',
  },
  primaryBtn: {
    backgroundColor: '#D4AF37',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledBtn: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryBtnText: {
    color: '#0A0A1A',
    fontSize: 16,
    fontWeight: '700',
  },
  textBtn: {
    marginTop: 16,
    alignItems: 'center',
    padding: 8,
  },
  textBtnLabel: {
    color: '#D4AF37',
    fontWeight: '600',
    fontSize: 14,
  },
});

