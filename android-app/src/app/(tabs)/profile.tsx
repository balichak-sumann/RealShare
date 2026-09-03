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
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { auth, app } from '@/lib/firebase';
import { PhoneAuthProvider, linkWithCredential, verifyBeforeUpdateEmail, RecaptchaVerifier } from 'firebase/auth';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { useUser } from '@/contexts/UserContext';
import { GuestView } from '@/components/ui/GuestView';
import { TabAnimationWrapper } from '@/components/ui/TabAnimationWrapper';
import { GoldSystem, Neutrals, Typography, Radius, Shadows } from '@/constants/design';
import { useFocusEffect } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

  // Animations
  const headerScale = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const cardsAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      headerScale.setValue(0);
      statsAnim.setValue(0);
      cardsAnim.setValue(0);

      Animated.stagger(150, [
        Animated.spring(headerScale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 12,
          bounciness: 5,
        }),
        Animated.spring(statsAnim, {
          toValue: 1,
          useNativeDriver: true,
          speed: 12,
          bounciness: 5,
        }),
        Animated.spring(cardsAnim, {
          toValue: 1,
          useNativeDriver: true,
          speed: 12,
          bounciness: 5,
        }),
      ]).start();
    }, [])
  );

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
          if (!(window as any).recaptchaVerifier) {
            (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
              size: 'invisible'
            });
          }
          appVerifier = (window as any).recaptchaVerifier;
        } else {
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
        <ActivityIndicator size="large" color={GoldSystem.primaryGold} />
      </View>
    );
  }

  if (!auth.currentUser) {
    return (
      <TabAnimationWrapper>
      <GuestView 
        title="Sign In Required" 
        description="Create an account or sign in to view your profile, manage verifications, and track your investments." 
        icon="👤"
      />
      </TabAnimationWrapper>
    );
  }

  const initials = (user?.full_name || 'U').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  const roleName = (user?.role || 'investor').charAt(0).toUpperCase() + (user?.role || 'investor').slice(1);
  const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' }) : 'N/A';

  // KYC completion count
  const kycItems = [
    { done: !!user?.email },
    { done: !!user?.phone_number },
    { done: false }, // Aadhar
    { done: false }, // PAN
  ];
  const kycDone = kycItems.filter(i => i.done).length;
  const kycTotal = kycItems.length;
  const kycPercent = Math.round((kycDone / kycTotal) * 100);

  const headerTranslateY = headerScale.interpolate({
    inputRange: [0, 1],
    outputRange: [-40, 0],
  });
  const statsTranslateY = statsAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [30, 0],
  });
  const cardsTranslateY = cardsAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0],
  });

  return (
    <TabAnimationWrapper>
    <View style={styles.container}>
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

        {/* ─── HERO PROFILE SECTION ─── */}
        <Animated.View style={[
          styles.heroSection,
          { opacity: headerScale, transform: [{ translateY: headerTranslateY }] }
        ]}>
          <View style={styles.heroBackground}>
            {/* Decorative circles */}
            <View style={[styles.heroCircle, styles.heroCircle1]} />
            <View style={[styles.heroCircle, styles.heroCircle2]} />
          </View>

          {/* Back + Settings row */}
          <View style={styles.heroTopRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.heroBackBtn}>
              <Text style={styles.heroBackText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.heroPageTitle}>My Profile</Text>
            <TouchableOpacity onPress={() => Alert.alert('Settings', 'Coming soon')} style={styles.heroSettingsBtn}>
              <Text style={styles.heroSettingsText}>⚙️</Text>
            </TouchableOpacity>
          </View>

          {/* Avatar + Info */}
          <View style={styles.heroAvatarRow}>
            <View style={styles.avatarRing}>
              <View style={styles.avatarRingInner}>
                {user?.avatar_url ? (
                  <Image source={{ uri: user.avatar_url }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitials}>{initials}</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity style={styles.editAvatarBtn} onPress={handleAvatarEdit}>
                <Text style={styles.editAvatarIcon}>📷</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.heroInfo}>
              <Text style={styles.heroName} numberOfLines={1}>{user?.full_name || 'User'}</Text>
              <View style={styles.heroRoleBadge}>
                <Text style={styles.heroRoleText}>{roleName}</Text>
              </View>
              <Text style={styles.heroMemberSince}>Member since {memberSince}</Text>
            </View>
          </View>
        </Animated.View>

        {/* ─── QUICK STATS ROW ─── */}
        <Animated.View style={[
          styles.statsRow,
          { opacity: statsAnim, transform: [{ translateY: statsTranslateY }] }
        ]}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>₹{Number(user?.wallet_balance || 0).toLocaleString('en-IN')}</Text>
            <Text style={styles.statLabel}>Wallet</Text>
          </View>
          <View style={[styles.statCard, styles.statCardMiddle]}>
            <Text style={styles.statValue}>{kycPercent}%</Text>
            <Text style={styles.statLabel}>KYC Done</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Properties</Text>
          </View>
        </Animated.View>

        {/* ─── KYC PROGRESS CARD ─── */}
        <Animated.View style={[
          styles.sectionWrapper,
          { opacity: cardsAnim, transform: [{ translateY: cardsTranslateY }] }
        ]}>
          <View style={styles.kycCard}>
            <View style={styles.kycHeader}>
              <View>
                <Text style={styles.kycTitle}>Verification Status</Text>
                <Text style={styles.kycSubtitle}>{kycDone} of {kycTotal} steps completed</Text>
              </View>
              <View style={styles.kycProgressRing}>
                <Text style={styles.kycProgressText}>{kycPercent}%</Text>
              </View>
            </View>
            <View style={styles.kycProgressBar}>
              <View style={[styles.kycProgressFill, { width: `${kycPercent}%` }]} />
            </View>
          </View>
        </Animated.View>

        {/* ─── PERSONAL INFORMATION ─── */}
        <Animated.View style={[
          styles.sectionWrapper,
          { opacity: cardsAnim, transform: [{ translateY: cardsTranslateY }] }
        ]}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.card}>
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
              <View style={[styles.infoIconBox, { backgroundColor: 'rgba(197, 165, 90, 0.1)' }]}>
                <Text style={styles.infoIcon}>📧</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email Address</Text>
                {user?.email ? (
                  <View style={styles.verifiedRow}>
                    <Text style={styles.infoValue}>{user.email}</Text>
                    <View style={styles.verifiedBadge}><Text style={styles.verifiedBadgeText}>✓</Text></View>
                  </View>
                ) : (
                  <Text style={[styles.infoValue, { color: '#D97706' }]}>Tap to Verify</Text>
                )}
              </View>
              {!user?.email && <Text style={styles.infoArrow}>›</Text>}
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
              <View style={[styles.infoIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                <Text style={styles.infoIcon}>📱</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Mobile Number</Text>
                {user?.phone_number ? (
                  <View style={styles.verifiedRow}>
                    <Text style={styles.infoValue}>{user.phone_number}</Text>
                    <View style={styles.verifiedBadge}><Text style={styles.verifiedBadgeText}>✓</Text></View>
                  </View>
                ) : (
                  <Text style={[styles.infoValue, { color: '#D97706' }]}>Tap to Verify</Text>
                )}
              </View>
              {!user?.phone_number && <Text style={styles.infoArrow}>›</Text>}
            </TouchableOpacity>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={[styles.infoIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                <Text style={styles.infoIcon}>📅</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Member Since</Text>
                <Text style={styles.infoValue}>
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={[styles.infoIconBox, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                <Text style={styles.infoIcon}>📍</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Full Address</Text>
                <Text style={styles.infoValue}>
                  {user?.full_address || 'Not Provided'}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ─── DOCUMENTS ─── */}
        <Animated.View style={[
          styles.sectionWrapper,
          { opacity: cardsAnim, transform: [{ translateY: cardsTranslateY }] }
        ]}>
          <Text style={styles.sectionTitle}>My Documents</Text>
          <View style={styles.card}>
            {[
              { icon: '💳', title: 'Aadhar Card', sub: 'Identity proof', status: 'Not Uploaded', statusColor: '#DC2626', statusBg: '#FEE2E2' },
              { icon: '🏦', title: 'PAN Card', sub: 'Tax & compliance', status: 'Pending Review', statusColor: '#D97706', statusBg: '#FEF3C7' },
              { icon: '🛂', title: 'Passport', sub: 'Optional', status: 'Uploaded', statusColor: '#059669', statusBg: '#D1FAE5' },
            ].map((doc, idx) => (
              <React.Fragment key={doc.title}>
                {idx > 0 && <View style={styles.divider} />}
                <TouchableOpacity 
                  style={styles.docRow}
                  onPress={() => Alert.alert('Upload', `${doc.title} upload coming soon`)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.docIconBox, { backgroundColor: GoldSystem.paleGold }]}>
                    <Text style={styles.docIcon}>{doc.icon}</Text>
                  </View>
                  <View style={styles.docContent}>
                    <Text style={styles.docTitle}>{doc.title}</Text>
                    <Text style={styles.docSub}>{doc.sub}</Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: doc.statusBg }]}>
                    <Text style={[styles.statusText, { color: doc.statusColor }]}>{doc.status}</Text>
                  </View>
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </View>
        </Animated.View>

        {/* ─── WALLET ─── */}
        {(!user?.role || user?.role === 'investor' || user?.role === 'admin') && (
          <Animated.View style={[
            styles.sectionWrapper,
            { opacity: cardsAnim, transform: [{ translateY: cardsTranslateY }] }
          ]}>
            <Text style={styles.sectionTitle}>Wallet</Text>
            <View style={styles.walletCard}>
              <View style={styles.walletLeft}>
                <Text style={styles.walletLabel}>Available Balance</Text>
                <Text style={styles.walletAmount}>₹ {Number(user?.wallet_balance || 0).toLocaleString('en-IN')}</Text>
              </View>
              <TouchableOpacity 
                style={styles.walletBtn} 
                onPress={() => Alert.alert('Coming Soon', 'Payment Gateway Integration is pending.')}
              >
                <Text style={styles.walletBtnText}>+ Add Money</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* ─── QUICK ACTIONS ─── */}
        <Animated.View style={[
          styles.sectionWrapper,
          { opacity: cardsAnim, transform: [{ translateY: cardsTranslateY }] }
        ]}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {[
              { icon: '📈', label: 'Investments', route: '/portfolio?from=profile', color: '#10B981' },
              { icon: '🔍', label: 'Explore', route: '/explore?from=profile', color: '#3B82F6' },
              { icon: '📄', label: 'Transactions', route: '/portfolio?from=profile', color: '#F59E0B' },
              { icon: '❓', label: 'Support Tickets', route: '/my-tickets', color: '#8B5CF6' },
            ].map((action) => (
              <TouchableOpacity
                key={action.label}
                style={styles.actionCard}
                onPress={() => {
                  router.push(action.route as any);
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIconBox, { backgroundColor: `${action.color}15` }]}>
                  <Text style={styles.actionIcon}>{action.icon}</Text>
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* ─── LOGOUT ─── */}
        <View style={styles.sectionWrapper}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <Text style={styles.logoutText}>Sign Out</Text>
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
            <View style={styles.modalHandle} />
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
                        placeholderTextColor={Neutrals.gray400}
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
                        placeholderTextColor={Neutrals.gray400}
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
                    placeholderTextColor={Neutrals.gray300}
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
    </TabAnimationWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Neutrals.background,
  },

  /* ─── HERO SECTION ─── */
  heroSection: {
    backgroundColor: Neutrals.obsidian,
    paddingTop: Platform.OS === 'web' ? 20 : Platform.OS === 'android' ? 44 : 54,
    paddingBottom: 28,
    paddingHorizontal: 20,
    overflow: 'hidden',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroBackground: {
    ...StyleSheet.absoluteFill as any,
  },
  heroCircle: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(197, 165, 90, 0.08)',
  },
  heroCircle1: {
    width: 280,
    height: 280,
    top: -80,
    right: -60,
  },
  heroCircle2: {
    width: 200,
    height: 200,
    bottom: -60,
    left: -40,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  heroBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBackText: {
    fontSize: 22,
    color: Neutrals.white,
    fontWeight: '300',
  },
  heroPageTitle: {
    ...Typography.headlineMedium,
    color: Neutrals.white,
  },
  heroSettingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSettingsText: {
    fontSize: 16,
  },
  heroAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  /* Avatar Ring */
  avatarRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2.5,
    borderColor: GoldSystem.primaryGold,
    padding: 3,
    position: 'relative',
  },
  avatarRingInner: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: GoldSystem.darkGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 30,
    fontWeight: '800',
    color: Neutrals.white,
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: GoldSystem.primaryGold,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Neutrals.obsidian,
  },
  editAvatarIcon: {
    fontSize: 13,
  },
  heroInfo: {
    flex: 1,
    marginLeft: 18,
  },
  heroName: {
    ...Typography.headlineLarge,
    color: Neutrals.white,
    marginBottom: 6,
  },
  heroRoleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(197, 165, 90, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: GoldSystem.primaryGold,
    marginBottom: 8,
  },
  heroRoleText: {
    ...Typography.caption,
    color: GoldSystem.softGold,
    letterSpacing: 1,
    fontWeight: '700',
  },
  heroMemberSince: {
    ...Typography.labelSmall,
    color: Neutrals.gray400,
  },

  /* ─── STATS ROW ─── */
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: -16,
    backgroundColor: Neutrals.white,
    borderRadius: Radius.lg,
    ...Shadows.medium,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 18,
  },
  statCardMiddle: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: Neutrals.gray100,
  },
  statValue: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
    marginBottom: 2,
  },
  statLabel: {
    ...Typography.caption,
    color: Neutrals.gray500,
  },

  /* ─── SECTION WRAPPER ─── */
  sectionWrapper: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    ...Typography.labelLarge,
    color: Neutrals.gray700,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  /* ─── KYC CARD ─── */
  kycCard: {
    backgroundColor: Neutrals.white,
    borderRadius: Radius.lg,
    padding: 18,
    ...Shadows.soft,
    borderWidth: 1,
    borderColor: GoldSystem.paleGold,
  },
  kycHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  kycTitle: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
  },
  kycSubtitle: {
    ...Typography.bodyMedium,
    color: Neutrals.gray500,
    marginTop: 2,
  },
  kycProgressRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: GoldSystem.primaryGold,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(197, 165, 90, 0.08)',
  },
  kycProgressText: {
    ...Typography.labelMedium,
    color: GoldSystem.darkGold,
  },
  kycProgressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Neutrals.gray100,
    overflow: 'hidden',
  },
  kycProgressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: GoldSystem.primaryGold,
  },

  /* ─── CARD (shared) ─── */
  card: {
    backgroundColor: Neutrals.white,
    borderRadius: Radius.lg,
    ...Shadows.soft,
    overflow: 'hidden',
  },

  /* ─── INFO ROWS ─── */
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  infoIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
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
    ...Typography.caption,
    color: Neutrals.gray500,
    marginBottom: 2,
  },
  infoValue: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: Neutrals.obsidian,
  },
  infoArrow: {
    fontSize: 22,
    color: Neutrals.gray300,
    fontWeight: '300',
    marginLeft: 8,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  verifiedBadgeText: {
    color: Neutrals.white,
    fontSize: 10,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: Neutrals.gray100,
    marginHorizontal: 16,
  },

  /* ─── DOCUMENTS ─── */
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  docIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
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
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: Neutrals.obsidian,
    marginBottom: 2,
  },
  docSub: {
    ...Typography.caption,
    color: Neutrals.gray500,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  statusText: {
    ...Typography.caption,
    fontWeight: '700',
  },

  /* ─── WALLET ─── */
  walletCard: {
    backgroundColor: Neutrals.obsidian,
    borderRadius: Radius.lg,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Shadows.strong,
  },
  walletLeft: {},
  walletLabel: {
    ...Typography.caption,
    color: Neutrals.gray400,
    marginBottom: 6,
  },
  walletAmount: {
    ...Typography.displayMedium,
    color: Neutrals.white,
  },
  walletBtn: {
    backgroundColor: GoldSystem.primaryGold,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: Radius.md,
    ...Shadows.gold,
  },
  walletBtnText: {
    ...Typography.labelLarge,
    color: Neutrals.obsidian,
  },

  /* ─── QUICK ACTIONS GRID ─── */
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    backgroundColor: Neutrals.white,
    borderRadius: Radius.lg,
    padding: 18,
    alignItems: 'center',
    ...Shadows.soft,
  },
  actionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionIcon: {
    fontSize: 22,
  },
  actionLabel: {
    ...Typography.labelMedium,
    color: Neutrals.gray700,
  },

  /* ─── LOGOUT ─── */
  logoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
    paddingVertical: 16,
    borderRadius: Radius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.15)',
  },
  logoutText: {
    ...Typography.labelLarge,
    color: '#EF4444',
  },

  /* ─── MODAL ─── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Neutrals.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    minHeight: 340,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Neutrals.gray200,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
  },
  closeBtn: {
    padding: 8,
    backgroundColor: Neutrals.gray100,
    borderRadius: 20,
  },
  closeBtnText: {
    fontSize: 16,
    color: Neutrals.gray500,
    fontWeight: '700',
  },
  modalBody: {
    flex: 1,
  },
  modalSubtitle: {
    ...Typography.bodyMedium,
    color: Neutrals.gray500,
    lineHeight: 20,
    marginBottom: 24,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Neutrals.gray200,
    borderRadius: Radius.md,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 24,
    backgroundColor: Neutrals.gray100,
  },
  countryCode: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: Neutrals.obsidian,
    marginRight: 12,
    borderRightWidth: 1,
    borderRightColor: Neutrals.gray200,
    paddingRight: 12,
  },
  phoneInput: {
    flex: 1,
    ...Typography.bodyLarge,
    color: Neutrals.obsidian,
  },
  otpInput: {
    borderWidth: 1.5,
    borderColor: Neutrals.gray200,
    borderRadius: Radius.md,
    paddingHorizontal: 16,
    height: 64,
    marginBottom: 24,
    backgroundColor: Neutrals.gray100,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 8,
    color: Neutrals.obsidian,
  },
  primaryBtn: {
    backgroundColor: GoldSystem.primaryGold,
    height: 56,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.gold,
  },
  disabledBtn: {
    backgroundColor: Neutrals.gray300,
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryBtnText: {
    color: Neutrals.obsidian,
    ...Typography.labelLarge,
  },
  textBtn: {
    marginTop: 16,
    alignItems: 'center',
    padding: 8,
  },
  textBtnLabel: {
    color: GoldSystem.primaryGold,
    ...Typography.labelLarge,
  },
});
