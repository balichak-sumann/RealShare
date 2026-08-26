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
        await fetch('https://realshare-5l24.onrender.com/api/users/sync', {
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

  const getKycStatusStyle = (status: string) => {
    switch (status) {
      case 'verified': return { bg: '#D1FAE5', text: '#059669', label: '✓ Verified' };
      case 'pending': return { bg: '#FEF3C7', text: '#D97706', label: '⏳ Pending Review' };
      case 'rejected': return { bg: '#FEE2E2', text: '#DC2626', label: '✕ Rejected' };
      default: return { bg: '#F3F4F6', text: '#6B7280', label: 'Not Submitted' };
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#1A56DB" />
      </View>
    );
  }

  const kycInfo = getKycStatusStyle(user?.kyc_status || 'not_submitted');
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

          {/* KYC Badge */}
          <View style={[styles.kycBadge, { backgroundColor: kycInfo.bg }]}>
            <Text style={[styles.kycBadgeText, { color: kycInfo.text }]}>{kycInfo.label}</Text>
          </View>
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

        {/* KYC Documents */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>KYC Documents</Text>
            <TouchableOpacity onPress={() => router.push('/kyc' as any)}>
              <Text style={styles.manageText}>Manage →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.docCard}>
            <View style={styles.docRow}>
              <View style={styles.docIconBox}>
                <Text style={styles.docIcon}>🪪</Text>
              </View>
              <View style={styles.docContent}>
                <Text style={styles.docTitle}>Aadhar Card</Text>
                <Text style={styles.docSubtext}>
                  {user?.kyc_status === 'verified' ? 'XXXX XXXX 4567' : 'Upload your Aadhar card'}
                </Text>
              </View>
              <View style={[styles.docStatusPill, { backgroundColor: kycInfo.bg }]}>
                <Text style={[styles.docStatusText, { color: kycInfo.text }]}>
                  {user?.kyc_status === 'verified' ? 'Verified' : user?.kyc_status === 'pending' ? 'Pending' : 'Upload'}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.docRow}>
              <View style={styles.docIconBox}>
                <Text style={styles.docIcon}>💳</Text>
              </View>
              <View style={styles.docContent}>
                <Text style={styles.docTitle}>PAN Card</Text>
                <Text style={styles.docSubtext}>
                  {user?.kyc_status === 'verified' ? 'ABCDE1234F' : 'Upload your PAN card'}
                </Text>
              </View>
              <View style={[styles.docStatusPill, { backgroundColor: kycInfo.bg }]}>
                <Text style={[styles.docStatusText, { color: kycInfo.text }]}>
                  {user?.kyc_status === 'verified' ? 'Verified' : user?.kyc_status === 'pending' ? 'Pending' : 'Upload'}
                </Text>
              </View>
            </View>
          </View>

          {user?.kyc_status !== 'verified' && (
            <TouchableOpacity style={styles.completeKycBtn} onPress={() => router.push('/kyc' as any)}>
              <Text style={styles.completeKycText}>Complete KYC Verification</Text>
            </TouchableOpacity>
          )}
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
    backgroundColor: '#F8FAFC',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
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
    borderColor: '#1A56DB',
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#1A56DB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#E1EFFE',
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: -4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  editAvatarText: {
    fontSize: 14,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
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
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  manageText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A56DB',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
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
    backgroundColor: '#F0F5FF',
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
    color: '#6B7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
  },
  docCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
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
    backgroundColor: '#FEF3C7',
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
    color: '#111827',
    marginBottom: 2,
  },
  docSubtext: {
    fontSize: 12,
    color: '#6B7280',
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
    backgroundColor: '#1A56DB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  completeKycText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  walletCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  walletLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  walletAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  walletBtn: {
    backgroundColor: '#E1EFFE',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  walletBtnText: {
    color: '#1A56DB',
    fontWeight: '700',
    fontSize: 13,
  },
  linksCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
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
    backgroundColor: '#F0F5FF',
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
    color: '#111827',
  },
  linkArrow: {
    fontSize: 22,
    color: '#9CA3AF',
    fontWeight: '300',
  },
  logoutBtn: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  logoutText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 15,
  },
  verifyArrow: {
    fontSize: 22,
    color: '#9CA3AF',
    fontWeight: '300',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
  },
  closeBtnText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '700',
  },
  modalBody: {
    flex: 1,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 24,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 24,
    backgroundColor: '#F9FAFB',
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginRight: 12,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    paddingRight: 12,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  otpInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 64,
    marginBottom: 24,
    backgroundColor: '#F9FAFB',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 8,
  },
  primaryBtn: {
    backgroundColor: '#1A56DB',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1A56DB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledBtn: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  textBtn: {
    marginTop: 16,
    alignItems: 'center',
    padding: 8,
  },
  textBtnLabel: {
    color: '#1A56DB',
    fontWeight: '600',
    fontSize: 14,
  },
});

