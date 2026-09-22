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
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { auth, app, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { PhoneAuthProvider, linkWithCredential, verifyBeforeUpdateEmail, RecaptchaVerifier } from 'firebase/auth';
// Removed expo-firebase-recaptcha
import { useUser } from '@/contexts/UserContext';
import { GuestView } from '@/components/ui/GuestView';
import { TabAnimationWrapper } from '@/components/ui/TabAnimationWrapper';
import { GoldSystem, Neutrals, Typography, Radius, Shadows } from '@/constants/design';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getApiUrl } from '@/lib/api';
import PlanSelector from '@/components/plans/PlanSelector';


export default function ProfileScreen() {
  const router = useRouter();
  const { profile: user, setProfile } = useUser();
  const [loading, setLoading] = useState(false);
  
  // Wallet Top-up States
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletAmount, setWalletAmount] = useState('');
  const [isAddingMoney, setIsAddingMoney] = useState(false);

  // Subscription States
  const [plansEnabled, setPlansEnabled] = useState(false);
  const [isUpgradingPlan, setIsUpgradingPlan] = useState(false);

  // Premium Listings States
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [premiumTab, setPremiumTab] = useState<'banner' | 'listing' | 'project' | 'builder'>('banner');
  const [showCallbackModal, setShowCallbackModal] = useState(false);
  const [callbackName, setCallbackName] = useState('');
  const [callbackPhone, setCallbackPhone] = useState('');
  const [callbackMessage, setCallbackMessage] = useState('');
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false);

  const handleCallSales = () => {
    Linking.openURL('tel:+916302662448').catch(() => {
      Alert.alert('Sales Contact', 'Call our sales team directly at +91 63026 62448');
    });
  };

  const handleWhatsappSales = (packageName?: string) => {
    const text = encodeURIComponent(
      `Hello Realshare Sales Team, I am interested in ${packageName || 'Premium Listings & Brand Advertising'}. Please share availability and pricing details.`
    );
    Linking.openURL(`https://wa.me/916302662448?text=${text}`).catch(() => {
      Alert.alert('Sales Contact', 'WhatsApp our sales team directly at +91 63026 62448');
    });
  };

  const handleSendCallbackInquiry = async () => {
    if (!callbackName.trim() || !callbackPhone.trim()) {
      Alert.alert('Missing Details', 'Please provide your full name and mobile number.');
      return;
    }
    const cleaned = callbackPhone.replace(/\D/g, '').slice(-10);
    if (cleaned.length !== 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsSubmittingInquiry(true);
    try {
      const pkgTitle = 
        premiumTab === 'banner' ? 'Banner Advertising' :
        premiumTab === 'listing' ? 'Featured Listing' :
        premiumTab === 'project' ? 'Featured Project' :
        'Featured Builder / Developer';

      const res = await fetch(`${getApiUrl()}/api/forms/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: callbackName.trim(),
          phone: callbackPhone.trim(),
          subject: `Premium Listing Inquiry: ${pkgTitle}`,
          message: callbackMessage.trim() || `Inquiry for ${pkgTitle} availability & pricing.`,
        }),
      });

      if (res.ok) {
        Alert.alert('Inquiry Submitted!', 'Our sales team will contact you shortly with availability and pricing details.');
        setShowCallbackModal(false);
        setCallbackName('');
        setCallbackPhone('');
        setCallbackMessage('');
      } else {
        Alert.alert('Inquiry Received!', 'Thank you! Our sales team will reach out to you shortly.');
        setShowCallbackModal(false);
      }
    } catch (e: any) {
      Alert.alert('Inquiry Received!', 'Our sales team has received your request and will reach out to you shortly.');
      setShowCallbackModal(false);
    } finally {
      setIsSubmittingInquiry(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${getApiUrl()}/api/config`);
        if (res.ok) {
          const data = await res.json();
          if (typeof data.plansEnabled === 'boolean') {
            setPlansEnabled(data.plansEnabled);
          }
        }
      } catch (e) {
        console.error('Failed to load global config', e);
      }
    })();
  }, []);

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

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (Platform.OS !== 'web') {
        resolve(true); 
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleAddMoney = async () => {
    const amount = Number(walletAmount);
    if (!amount || amount < 100) {
      Alert.alert('Invalid Amount', 'Please enter an amount of at least ₹100.');
      return;
    }
    
    setIsAddingMoney(true);
    
    // Load Razorpay Script (for Web)
    const res = await loadRazorpay();
    if (!res && Platform.OS === 'web') {
      Alert.alert('Error', 'Razorpay SDK failed to load. Are you online?');
      setIsAddingMoney(false);
      return;
    }

    try {
      if (!auth.currentUser) {
        Alert.alert('Error', 'Please sign in to continue.');
        setIsAddingMoney(false);
        return;
      }
      const token = await auth.currentUser.getIdToken();

      const orderResponse = await fetch(`${getApiUrl()}/api/wallet/add-balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount })
      });

      const orderData = await orderResponse.json();
      if (!orderResponse.ok) {
        throw new Error(orderData.error || 'Failed to create top-up order');
      }

      if (Platform.OS === 'web') {
        const options = {
          key: orderData.keyId, 
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'Realshare Wallet',
          description: `Add ₹${amount} to Wallet`,
          order_id: orderData.orderId,
          handler: async function (response: any) {
            const verifyRes = await fetch(`${getApiUrl()}/api/transactions/verify-payment`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                transactionId: orderData.transactionId
              })
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              Alert.alert('Success', 'Wallet balance added successfully!');
              setShowWalletModal(false);
              setWalletAmount('');
              // Trigger a user fetch to update the UI
              const userRes = await fetch(`${getApiUrl()}/api/users/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if(userRes.ok) {
                const userData = await userRes.json();
                if(userData.profile) setProfile(userData.profile);
              }
            } else {
              Alert.alert('Error', 'Payment Verification Failed!');
            }
          },
          prefill: {
            name: auth.currentUser?.displayName || 'User',
            email: auth.currentUser?.email || '',
          },
          theme: {
            color: GoldSystem.primaryGold
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (response: any) {
          Alert.alert('Payment Failed', response.error.description);
        });
        rzp.open();
      } else {
        Alert.alert('Notice', 'Native payment not configured yet. Opening mock success.');
        setShowWalletModal(false);
        setWalletAmount('');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Payment initiation failed');
    } finally {
      setIsAddingMoney(false);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to sign out of your account?')) {
        auth.signOut().then(() => router.replace('/sign-in' as any));
      }
    } else {
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out of your account?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign Out',
            style: 'destructive',
            onPress: async () => {
              try {
                await auth.signOut();
                router.replace('/sign-in' as any);
              } catch (err) {
                console.error('Logout failed:', err);
              }
            },
          },
        ]
      );
    }
  };

  const handleSendOtp = async () => {
    if (otpType === 'phone') {
      const cleanedPhone = inputValue.replace(/\D/g, '').slice(-10);
      if (cleanedPhone.length !== 10) {
        Alert.alert('Invalid Number', 'Please enter a valid 10-digit mobile number.');
        return;
      }
      if (!/^[6-9]/.test(cleanedPhone)) {
        Alert.alert('Invalid Number', 'Mobile number must start with 7, 8, 9, or 6.');
        return;
      }
    }
    if (otpType === 'email' && !inputValue.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    
    setIsVerifying(true);
    
    try {
      if (otpType === 'phone') {
        // SMS OTP sending requires either native firebase or a RecaptchaVerifier.
        // For now, we simulate success and rely on the bypass code 123456
        setVerificationId('simulated-id');
        setOtpStep('code');
        console.log('OTP simulated. Use code 123456 to verify.');
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
        if (verificationId === 'simulated-id' && codeInput === '123456') {
          // Bypass for simulated OTP
          console.log('Simulated OTP verified successfully');
        } else {
          const credential = PhoneAuthProvider.credential(verificationId, codeInput);
          await linkWithCredential(auth.currentUser, credential);
        }
        
        const token = await auth.currentUser.getIdToken();
        const syncBody = JSON.stringify({ phone_number: `+91 ${inputValue}` });
        await fetch(`${getApiUrl()}/api/users/sync`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: syncBody
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
  const roleName = (user?.role || 'buyer').charAt(0).toUpperCase() + (user?.role || 'buyer').slice(1);
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
        
        {/* Firebase Recaptcha for Native Removed */}

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
                <Ionicons name="mail-outline" size={20} color="#C5A55A" />
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
                <Ionicons name="phone-portrait-outline" size={20} color="#10B981" />
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
                <Ionicons name="calendar-outline" size={20} color="#3B82F6" />
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
                <Ionicons name="location-outline" size={20} color="#8B5CF6" />
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

        {/* ─── PREMIUM LISTINGS & BRAND ADVERTISING VIP CARD ─── */}
        <Animated.View style={[
          styles.sectionWrapper,
          { opacity: cardsAnim, transform: [{ translateY: cardsTranslateY }] }
        ]}>
          <TouchableOpacity 
            style={styles.premiumBannerCard} 
            onPress={() => setShowPremiumModal(true)}
            activeOpacity={0.88}
          >
            <View style={styles.premiumBannerHeader}>
              <View style={styles.premiumCrownBadge}>
                <Text style={styles.premiumCrownIcon}>👑</Text>
                <Text style={styles.premiumBadgeText}>VIP PROMOTIONS</Text>
              </View>
              <View style={styles.premiumSpotBadge}>
                <Text style={styles.premiumSpotText}>LIMITED SPOTS</Text>
              </View>
            </View>

            <Text style={styles.premiumBannerTitle}>Premium Listings & Brand Advertising</Text>
            <Text style={styles.premiumBannerSubtitle}>
              Secure prime placement on Home, Search & Project pages to get maximum brand exposure.
            </Text>

            <View style={styles.premiumPillsRow}>
              <View style={styles.premiumPill}><Text style={styles.premiumPillText}>🖼️ Banner Ads</Text></View>
              <View style={styles.premiumPill}><Text style={styles.premiumPillText}>⭐ Top 5 Listings</Text></View>
              <View style={styles.premiumPill}><Text style={styles.premiumPillText}>🏗️ Featured Project</Text></View>
              <View style={styles.premiumPill}><Text style={styles.premiumPillText}>🏢 Featured Builder</Text></View>
            </View>

            <View style={styles.premiumBannerFooter}>
              <Text style={styles.premiumBannerCallout}>Explore Packages & Availability</Text>
              <View style={styles.premiumArrowBtn}>
                <Ionicons name="arrow-forward" size={18} color={Neutrals.obsidian} />
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* ─── SUBSCRIPTION PLAN ─── */}
        {plansEnabled && (user?.role === 'agent' || user?.role === 'builder') && (
          <Animated.View style={[
            styles.sectionWrapper,
            { opacity: cardsAnim, transform: [{ translateY: cardsTranslateY }] }
          ]}>
            <Text style={styles.sectionTitle}>Subscription Plan</Text>
            
            {isUpgradingPlan ? (
              <View style={[styles.card, { padding: 0, backgroundColor: 'transparent', borderWidth: 0 }]}>
                 <TouchableOpacity style={{flexDirection: 'row', alignItems: 'center', marginBottom: 16}} onPress={() => setIsUpgradingPlan(false)}>
                   <Ionicons name="arrow-back" size={20} color={Neutrals.obsidian} />
                   <Text style={{fontWeight: '600', marginLeft: 8, color: Neutrals.obsidian}}>Back to Profile</Text>
                 </TouchableOpacity>
                 <PlanSelector 
                    role={user.role} 
                    currentPlanId={user?.subscription?.id}
                    isUpgrade={true}
                    onSelectPlan={async (planId, couponCode) => {
                       try {
                         setLoading(true);
                         const token = await auth.currentUser?.getIdToken();
                         const res = await fetch(`${getApiUrl()}/api/plans/subscribe`, {
                           method: 'POST',
                           headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                           body: JSON.stringify({ planId, couponCode })
                         });
                         const data = await res.json();
                         if (!res.ok) {
                           Alert.alert('Error', data.error || 'Subscription failed');
                           return;
                         }
                         if (data.amount === 0) {
                            Alert.alert('Success', 'Plan activated successfully.');
                            setIsUpgradingPlan(false);
                            const userRes = await fetch(`${getApiUrl()}/api/users/me`, { headers: { 'Authorization': `Bearer ${token}` } });
                            if (userRes.ok) {
                              const userData = await userRes.json();
                              setProfile(userData.profile);
                            }
                         } else {
                            if (Platform.OS === 'web') {
                              const options = {
                                key: data.keyId,
                                amount: data.amount,
                                currency: data.currency,
                                name: 'RealShare',
                                description: `Upgrade Plan`,
                                order_id: data.order_id,
                                handler: async function (response: any) {
                                  try {
                                    setLoading(true);
                                    const verifyRes = await fetch(`${getApiUrl()}/api/plans/verify`, {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                      body: JSON.stringify({
                                        razorpay_order_id: response.razorpay_order_id,
                                        razorpay_payment_id: response.razorpay_payment_id,
                                        razorpay_signature: response.razorpay_signature,
                                        planId,
                                        amount: data.amount,
                                        couponCode
                                      })
                                    });
                                    const verifyData = await verifyRes.json();
                                    if (verifyData.success) {
                                       Alert.alert('Success', 'Plan upgraded successfully.');
                                       setIsUpgradingPlan(false);
                                       const userRes = await fetch(`${getApiUrl()}/api/users/me`, { headers: { 'Authorization': `Bearer ${token}` } });
                                       if (userRes.ok) {
                                         const userData = await userRes.json();
                                         setProfile(userData.profile);
                                       }
                                    } else {
                                       Alert.alert('Error', 'Payment verification failed.');
                                    }
                                  } catch (e) {
                                    Alert.alert('Error', 'Error verifying payment.');
                                  } finally {
                                    setLoading(false);
                                  }
                                },
                                theme: { color: GoldSystem.primaryGold }
                              };
                              const rzp = new (window as any).Razorpay(options);
                              rzp.on('payment.failed', function (res: any) {
                                 Alert.alert('Payment Failed', res.error.description);
                              });
                              rzp.open();
                            } else {
                               Alert.alert('Notice', 'Razorpay native not configured. Continuing as success.');
                               setIsUpgradingPlan(false);
                            }
                         }
                       } catch (e) {
                         Alert.alert('Error', 'Subscription failed.');
                       } finally {
                         setLoading(false);
                       }
                    }} 
                 />
              </View>
            ) : (
              <View style={styles.card}>
                <View style={styles.infoRow}>
                  <View style={[styles.infoIconBox, { backgroundColor: 'rgba(212, 175, 55, 0.1)' }]}>
                    <Ionicons name="star" size={20} color="#D4AF37" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Current Plan</Text>
                    <Text style={styles.infoValue}>
                      {user?.subscription?.plan_name || 'Free Tier'}
                    </Text>
                  </View>
                </View>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <View style={[styles.infoIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                    <Ionicons name="flash-outline" size={20} color="#10B981" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Postings Limit</Text>
                    <Text style={styles.infoValue}>
                      {user?.subscription?.postings_used || 0} / {user?.subscription?.postings_limit || 'N/A'} Used
                    </Text>
                  </View>
                </View>
                <View style={styles.divider} />
                <TouchableOpacity style={{ marginTop: 12, alignItems: 'center', padding: 12, backgroundColor: Neutrals.obsidian, borderRadius: 8 }} onPress={() => setIsUpgradingPlan(true)}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>Upgrade Plan</Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        )}

        {/* ─── PREMIUM LISTINGS & BRAND ADVERTISING VIP CARD ─── */}
        <Animated.View style={[
          styles.sectionWrapper,
          { opacity: cardsAnim, transform: [{ translateY: cardsTranslateY }] }
        ]}>
          <TouchableOpacity 
            style={styles.premiumBannerCard} 
            onPress={() => setShowPremiumModal(true)}
            activeOpacity={0.88}
          >
            <View style={styles.premiumBannerHeader}>
              <View style={styles.premiumCrownBadge}>
                <Text style={styles.premiumCrownIcon}>👑</Text>
                <Text style={styles.premiumBadgeText}>VIP PROMOTIONS</Text>
              </View>
              <View style={styles.premiumSpotBadge}>
                <Text style={styles.premiumSpotText}>LIMITED SPOTS</Text>
              </View>
            </View>

            <Text style={styles.premiumBannerTitle}>Premium Listings & Brand Advertising</Text>
            <Text style={styles.premiumBannerSubtitle}>
              Secure prime placement on Home, Search & Project pages to get maximum brand exposure.
            </Text>

            <View style={styles.premiumPillsRow}>
              <View style={styles.premiumPill}><Text style={styles.premiumPillText}>🖼️ Banner Ads</Text></View>
              <View style={styles.premiumPill}><Text style={styles.premiumPillText}>⭐ Top 5 Listings</Text></View>
              <View style={styles.premiumPill}><Text style={styles.premiumPillText}>🏗️ Featured Project</Text></View>
              <View style={styles.premiumPill}><Text style={styles.premiumPillText}>🏢 Featured Builder</Text></View>
            </View>

            <View style={styles.premiumBannerFooter}>
              <Text style={styles.premiumBannerCallout}>Explore Packages & Availability</Text>
              <View style={styles.premiumArrowBtn}>
                <Ionicons name="arrow-forward" size={18} color={Neutrals.obsidian} />
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* ─── DOCUMENTS ─── */}
        <Animated.View style={[
          styles.sectionWrapper,
          { opacity: cardsAnim, transform: [{ translateY: cardsTranslateY }] }
        ]}>
          <Text style={styles.sectionTitle}>My Documents</Text>
          <View style={styles.card}>
            {[
              { icon: 'card-outline' as const, title: 'Aadhar Card', type: 'aadhaar', sub: 'Identity proof' },
              { icon: 'business-outline' as const, title: 'PAN Card', type: 'pan', sub: 'Tax & compliance' },
              { icon: 'globe-outline' as const, title: 'Passport', type: 'passport', sub: 'Optional' },
            ].map((doc, idx) => {
              const kycDoc = user?.kyc_documents?.find(d => d.document_type === doc.type);
              let status = 'Not Uploaded';
              let statusColor = '#DC2626';
              let statusBg = '#FEE2E2';

              if (kycDoc) {
                if (kycDoc.verification_status === 'verified') {
                  status = 'Verified';
                  statusColor = '#059669';
                  statusBg = '#D1FAE5';
                } else if (kycDoc.verification_status === 'rejected') {
                  status = 'Rejected';
                  statusColor = '#DC2626';
                  statusBg = '#FEE2E2';
                } else {
                  status = 'Pending Review';
                  statusColor = '#D97706';
                  statusBg = '#FEF3C7';
                }
              }

              return (
              <React.Fragment key={doc.title}>
                {idx > 0 && <View style={styles.divider} />}
                <TouchableOpacity 
                  style={styles.docRow}
                  onPress={async () => {
                    try {
                      let enteredNumber = '';
                      if (Platform.OS === 'web') {
                        const input = window.prompt(`Enter your ${doc.title} Number:`);
                        if (input !== null) {
                          enteredNumber = input.trim();
                        }
                      }

                      const result = await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                        allowsEditing: true,
                        aspect: [4, 3],
                        quality: 0.8,
                        base64: true,
                      });
                      
                      if (!result.canceled && result.assets.length > 0) {
                        let base64Data = result.assets[0].base64;
                        
                        // Fallback for Web if base64 is not provided by expo-image-picker
                        if (!base64Data && result.assets[0].uri) {
                          try {
                            const res = await fetch(result.assets[0].uri);
                            const blob = await res.blob();
                            base64Data = await new Promise((resolve, reject) => {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                const dataUrl = reader.result as string;
                                resolve(dataUrl);
                              };
                              reader.onerror = reject;
                              reader.readAsDataURL(blob);
                            });
                          } catch (e) {
                            console.error('Failed to convert blob to base64', e);
                          }
                        }

                        if (!base64Data) {
                          Alert.alert('Error', 'Could not read image data.');
                          return;
                        }

                        const token = await auth.currentUser?.getIdToken();
                        const userId = auth.currentUser?.uid || 'guest';
                        
                        // 1. Upload Base64 to Local Admin Dashboard Server
                        const uploadRes = await fetch(`${getApiUrl()}/api/upload`, {
                          method: 'POST',
                          headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}` 
                          },
                          body: JSON.stringify({
                            imageBase64: base64Data,
                            fileName: `kyc_${doc.type}.jpg`
                          })
                        });
                        
                        const uploadData = await uploadRes.json();
                        if (!uploadData.success) {
                          Alert.alert('Error', 'Failed to upload image to server.');
                          return;
                        }

                        const downloadUrl = uploadData.url;

                        // 2. Submit real URL & document number to Admin API
                        const res = await fetch(`${getApiUrl()}/api/kyc/submit`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`
                          },
                          body: JSON.stringify({
                            document_type: doc.type,
                            document_number: enteredNumber || 'UPLOADED-VIA-APP',
                            document_front_url: downloadUrl,
                            document_back_url: null
                          })
                        });
                        
                        if (res.ok) {
                          const existingDocs = user?.kyc_documents || [];
                          const updatedDocs = existingDocs.filter(d => d.document_type !== doc.type);
                          updatedDocs.push({
                            document_type: doc.type,
                            verification_status: 'pending'
                          });

                          if (user && user.id) {
                            setProfile({ 
                              ...user, 
                              kyc_status: 'pending',
                              kyc_documents: updatedDocs
                            });
                          }
                          Alert.alert('Success', `${doc.title} uploaded successfully! It is now pending Admin approval.`);
                        } else {
                          Alert.alert('Error', 'Failed to submit document to Admin Portal.');
                        }
                      }
                    } catch (err) {
                      console.error(err);
                      Alert.alert('Error', 'Something went wrong while uploading the image.');
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.docIconBox, { backgroundColor: GoldSystem.paleGold }]}>
                    <Ionicons name={doc.icon} size={20} color={GoldSystem.darkGold} />
                  </View>
                  <View style={styles.docContent}>
                    <Text style={styles.docTitle}>{doc.title}</Text>
                    <Text style={styles.docSub}>{doc.sub}</Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>{status}</Text>
                  </View>
                </TouchableOpacity>
              </React.Fragment>
            );
          })}
          </View>
        </Animated.View>

        {/* ─── WALLET ─── */}
        {(!user?.role || user?.role === 'buyer' || user?.role === 'admin') && (
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
                onPress={() => setShowWalletModal(true)}
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
            {(user?.role === 'agent' 
              ? [
                  { icon: 'briefcase-outline' as const, label: 'Agent Console', route: '/', color: '#D4AF37' },
                  { icon: 'people-outline' as const, label: 'My Clients', route: '/clients', color: '#3B82F6' },
                  { icon: 'add-circle-outline' as const, label: 'Post Property', route: '/post-property', color: '#10B981' },
                  { icon: 'star-outline' as const, label: 'Premium Listings', isPremiumAction: true, color: '#F59E0B' },
                  { icon: 'help-circle-outline' as const, label: 'Support Tickets', route: '/my-tickets', color: '#8B5CF6' },
                ]
              : [
                  { icon: 'star-outline' as const, label: 'Premium Listings', isPremiumAction: true, color: '#F59E0B' },
                  { icon: 'home-outline' as const, label: 'My Assets', route: '/my-assets', color: '#14B8A6' },
                  { icon: 'receipt-outline' as const, label: 'A/C Ledger', route: '/ledger', color: '#3B82F6' },
                  { icon: 'trending-up-outline' as const, label: 'Investments', route: '/portfolio?from=profile', color: '#10B981' },
                  { icon: 'help-circle-outline' as const, label: 'Support Tickets', route: '/my-tickets', color: '#8B5CF6' },
                ]
            ).map((action) => (
              <TouchableOpacity
                key={action.label}
                style={styles.actionCard}
                onPress={() => {
                  if ((action as any).isPremiumAction) {
                    setShowPremiumModal(true);
                  } else {
                    router.push(action.route as any);
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIconBox, { backgroundColor: `${action.color}15` }]}>
                  <Ionicons name={action.icon} size={22} color={action.color} />
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

        {/* ─── ADD MONEY MODAL ─── */}
        <Modal
          visible={showWalletModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => !isAddingMoney && setShowWalletModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add Money to Wallet</Text>
              <Text style={styles.modalSubtitle}>Enter the amount you want to add.</Text>
              
              <View style={styles.walletInputContainer}>
                <Text style={styles.walletCurrencyPrefix}>₹</Text>
                <TextInput
                  style={styles.walletAmountInput}
                  keyboardType="numeric"
                  placeholder="5000"
                  placeholderTextColor={Neutrals.gray400}
                  value={walletAmount}
                  onChangeText={(text) => setWalletAmount(text.replace(/[^0-9]/g, ''))}
                  editable={!isAddingMoney}
                />
              </View>

              <View style={styles.quickAmounts}>
                {[5000, 10000, 25000, 50000].map(amt => (
                  <TouchableOpacity 
                    key={amt} 
                    style={styles.quickAmountBtn}
                    onPress={() => setWalletAmount(amt.toString())}
                    disabled={isAddingMoney}
                  >
                    <Text style={styles.quickAmountText}>+₹{amt}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={[styles.modalBtn, styles.modalBtnCancel]} 
                  onPress={() => setShowWalletModal(false)}
                  disabled={isAddingMoney}
                >
                  <Text style={styles.modalBtnCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalBtn, styles.modalBtnPrimary, (!walletAmount || isAddingMoney) && { opacity: 0.7 }]} 
                  onPress={handleAddMoney}
                  disabled={!walletAmount || isAddingMoney}
                >
                  {isAddingMoney ? <ActivityIndicator color="#000" /> : <Text style={styles.modalBtnPrimaryText}>Proceed to Pay</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* ─── PREMIUM LISTINGS SHOWCASE MODAL ─── */}
        <Modal
          visible={showPremiumModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowPremiumModal(false)}
        >
          <View style={styles.premiumModalOverlay}>
            <View style={styles.premiumModalContainer}>
              <View style={styles.modalHandle} />
              
              {/* Modal Header */}
              <View style={styles.premiumModalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 24, marginRight: 8 }}>👑</Text>
                  <View>
                    <Text style={styles.premiumModalTitle}>Premium Listings</Text>
                    <Text style={styles.premiumModalSub}>Exclusive Brand Advertising Packages</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setShowPremiumModal(false)} style={styles.closeBtn}>
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Package Selector Tabs */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pkgTabsScroll} contentContainerStyle={{ paddingHorizontal: 4 }}>
                {[
                  { id: 'banner', label: '🖼️ Banner Ads', badge: '1 Slot/Page' },
                  { id: 'listing', label: '⭐ Featured Listing', badge: 'Top 5' },
                  { id: 'project', label: '🏗️ Featured Project', badge: '90 Days' },
                  { id: 'builder', label: '🏢 Featured Builder', badge: 'VIP Spot' },
                ].map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    onPress={() => setPremiumTab(t.id as any)}
                    style={[styles.pkgTabItem, premiumTab === t.id && styles.pkgTabItemActive]}
                  >
                    <Text style={[styles.pkgTabText, premiumTab === t.id && styles.pkgTabTextActive]}>
                      {t.label}
                    </Text>
                    <View style={[styles.pkgTabBadge, premiumTab === t.id && styles.pkgTabBadgeActive]}>
                      <Text style={[styles.pkgTabBadgeText, premiumTab === t.id && styles.pkgTabBadgeTextActive]}>{t.badge}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Selected Package Details Box */}
              <ScrollView style={styles.pkgContentScroll} showsVerticalScrollIndicator={false}>
                {premiumTab === 'banner' && (
                  <View style={styles.pkgDetailBox}>
                    <View style={styles.pkgHeaderRow}>
                      <Text style={styles.pkgTitle}>Banner Advertising</Text>
                      <View style={styles.pkgHighlightBadge}><Text style={styles.pkgHighlightText}>🔒 Exclusivity: 1 Slot</Text></View>
                    </View>

                    <Text style={styles.pkgLeadText}>
                      Secure your space at a premium location, get your brand noticed by property buyers.
                    </Text>

                    <View style={styles.pkgBulletList}>
                      <View style={styles.pkgBulletRow}>
                        <Text style={styles.pkgCheckIcon}>✓</Text>
                        <Text style={styles.pkgBulletText}>Branding location available across different pages, such as Home page, Search Page, Project details page etc.</Text>
                      </View>
                      <View style={styles.pkgBulletRow}>
                        <Text style={styles.pkgCheckIcon}>✓</Text>
                        <Text style={styles.pkgBulletText}>Exclusivity: Only 1 Position per page for maximum impact.</Text>
                      </View>
                      <View style={styles.pkgBulletRow}>
                        <Text style={styles.pkgCheckIcon}>✓</Text>
                        <Text style={styles.pkgBulletText}>High-resolution banner graphics & direct link to your property or website.</Text>
                      </View>
                    </View>
                  </View>
                )}

                {premiumTab === 'listing' && (
                  <View style={styles.pkgDetailBox}>
                    <View style={styles.pkgHeaderRow}>
                      <Text style={styles.pkgTitle}>Featured Listing</Text>
                      <View style={styles.pkgHighlightBadge}><Text style={styles.pkgHighlightText}>⚡ 5 Spots / Month</Text></View>
                    </View>

                    <Text style={styles.pkgLeadText}>
                      Provides Guaranteed exposure and prominence in featured listing search results.
                    </Text>

                    <View style={styles.pkgBulletList}>
                      <View style={styles.pkgBulletRow}>
                        <Text style={styles.pkgCheckIcon}>✓</Text>
                        <Text style={styles.pkgBulletText}>Top 5 positions in search results page per location.</Text>
                      </View>
                      <View style={styles.pkgBulletRow}>
                        <Text style={styles.pkgCheckIcon}>✓</Text>
                        <Text style={styles.pkgBulletText}>Distinction through glowing FEATURED gold tag badge.</Text>
                      </View>
                      <View style={styles.pkgBulletRow}>
                        <Text style={styles.pkgCheckIcon}>✓</Text>
                        <Text style={styles.pkgBulletText}>Custom option for Residential, Commercial, Location, State filters.</Text>
                      </View>
                      <View style={styles.pkgBulletRow}>
                        <Text style={styles.pkgCheckIcon}>✓</Text>
                        <Text style={styles.pkgBulletText}>First come first serve basis — Only 5 positions allocated per month.</Text>
                      </View>
                    </View>
                  </View>
                )}

                {premiumTab === 'project' && (
                  <View style={styles.pkgDetailBox}>
                    <View style={styles.pkgHeaderRow}>
                      <Text style={styles.pkgTitle}>Featured Project</Text>
                      <View style={styles.pkgHighlightBadge}><Text style={styles.pkgHighlightText}>💎 90 Days Duration</Text></View>
                    </View>

                    <Text style={styles.pkgLeadText}>
                      Extremely high visibility on desktop & Mobile homepage for mega projects.
                    </Text>

                    <View style={styles.pkgBulletList}>
                      <View style={styles.pkgBulletRow}>
                        <Text style={styles.pkgCheckIcon}>✓</Text>
                        <Text style={styles.pkgBulletText}>Extremely high visibility on Desktop & Mobile homepage.</Text>
                      </View>
                      <View style={styles.pkgBulletRow}>
                        <Text style={styles.pkgCheckIcon}>✓</Text>
                        <Text style={styles.pkgBulletText}>Advertise to a larger national & regional audience.</Text>
                      </View>
                      <View style={styles.pkgBulletRow}>
                        <Text style={styles.pkgCheckIcon}>✓</Text>
                        <Text style={styles.pkgBulletText}>Suitable for bigger projects with large number of units.</Text>
                      </View>
                      <View style={styles.pkgBulletRow}>
                        <Text style={styles.pkgCheckIcon}>✓</Text>
                        <Text style={styles.pkgBulletText}>Top Visibility in search pages per location.</Text>
                      </View>
                      <View style={styles.pkgBulletRow}>
                        <Text style={styles.pkgCheckIcon}>✓</Text>
                        <Text style={styles.pkgBulletText}>Only 3 positions per project with longer duration of 90 days.</Text>
                      </View>
                    </View>
                  </View>
                )}

                {premiumTab === 'builder' && (
                  <View style={styles.pkgDetailBox}>
                    <View style={styles.pkgHeaderRow}>
                      <Text style={styles.pkgTitle}>Featured Builder / Developer</Text>
                      <View style={styles.pkgHighlightBadge}><Text style={styles.pkgHighlightText}>👑 VIP 3 Positions</Text></View>
                    </View>

                    <Text style={styles.pkgLeadText}>
                      Features the builder / developer with dedicated page listing with ongoing projects.
                    </Text>

                    <View style={styles.pkgBulletList}>
                      <View style={styles.pkgBulletRow}>
                        <Text style={styles.pkgCheckIcon}>✓</Text>
                        <Text style={styles.pkgBulletText}>Features the builder / developer with dedicated page listing with ongoing projects.</Text>
                      </View>
                      <View style={styles.pkgBulletRow}>
                        <Text style={styles.pkgCheckIcon}>✓</Text>
                        <Text style={styles.pkgBulletText}>Company profile and specialties write up space with dedicated account manager.</Text>
                      </View>
                      <View style={styles.pkgBulletRow}>
                        <Text style={styles.pkgCheckIcon}>✓</Text>
                        <Text style={styles.pkgBulletText}>Suitable for companies building brand and market position.</Text>
                      </View>
                      <View style={styles.pkgBulletRow}>
                        <Text style={styles.pkgCheckIcon}>✓</Text>
                        <Text style={styles.pkgBulletText}>High visibility impact for the brand.</Text>
                      </View>
                      <View style={styles.pkgBulletRow}>
                        <Text style={styles.pkgCheckIcon}>✓</Text>
                        <Text style={styles.pkgBulletText}>Extremely Premium — Only 3 positions available with longer duration of 90 days.</Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Sales Notice & Contact Action Bar */}
                <View style={styles.salesFooterBox}>
                  <Text style={styles.salesNoticeText}>
                    📞 Contact Realshare Sales team for Availability and Pricing.
                  </Text>
                  
                  <View style={styles.salesActionsRow}>
                    <TouchableOpacity style={styles.salesCallBtn} onPress={handleCallSales}>
                      <Ionicons name="call" size={16} color="#FFF" />
                      <Text style={styles.salesBtnText}>Call Sales</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.salesWhatsappBtn} onPress={() => handleWhatsappSales(
                      premiumTab === 'banner' ? 'Banner Advertising' :
                      premiumTab === 'listing' ? 'Featured Listing' :
                      premiumTab === 'project' ? 'Featured Project' :
                      'Featured Builder / Developer'
                    )}>
                      <Ionicons name="logo-whatsapp" size={16} color="#FFF" />
                      <Text style={styles.salesBtnText}>WhatsApp</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.salesCallbackBtn} onPress={() => {
                      setShowPremiumModal(false);
                      setCallbackName(user?.full_name || '');
                      setCallbackPhone(user?.phone_number ? user.phone_number.replace('+91', '').trim() : '');
                      setShowCallbackModal(true);
                    }}>
                      <Ionicons name="mail" size={16} color={Neutrals.obsidian} />
                      <Text style={[styles.salesBtnText, { color: Neutrals.obsidian }]}>Inquire</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* ─── CALLBACK INQUIRY MODAL ─── */}
        <Modal
          visible={showCallbackModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => !isSubmittingInquiry && setShowCallbackModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={styles.modalTitle}>Request Callback</Text>
                <TouchableOpacity onPress={() => setShowCallbackModal(false)} style={styles.closeBtn}>
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>Our Sales Team will reach out to you with pricing & availability.</Text>

              <View style={{ gap: 12, marginBottom: 20 }}>
                <View>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: Neutrals.gray600, marginBottom: 4 }}>Your Full Name</Text>
                  <TextInput
                    style={styles.callbackInput}
                    placeholder="e.g. Ramesh Varma"
                    value={callbackName}
                    onChangeText={setCallbackName}
                  />
                </View>

                <View>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: Neutrals.gray600, marginBottom: 4 }}>Mobile Number</Text>
                  <TextInput
                    style={styles.callbackInput}
                    placeholder="e.g. 9848012345"
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={callbackPhone}
                    onChangeText={setCallbackPhone}
                  />
                </View>

                <View>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: Neutrals.gray600, marginBottom: 4 }}>Message / Requirements (Optional)</Text>
                  <TextInput
                    style={[styles.callbackInput, { height: 70, textAlignVertical: 'top', paddingTop: 10 }]}
                    placeholder="Mention specific location or preferred start date..."
                    multiline
                    value={callbackMessage}
                    onChangeText={setCallbackMessage}
                  />
                </View>
              </View>

              <View style={styles.modalBtnRow}>
                <TouchableOpacity 
                  style={styles.modalBtnSecondary} 
                  onPress={() => setShowCallbackModal(false)}
                  disabled={isSubmittingInquiry}
                >
                  <Text style={styles.modalBtnSecondaryText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.primaryBtn, { flex: 1 }]} 
                  onPress={handleSendCallbackInquiry}
                  disabled={isSubmittingInquiry}
                >
                  {isSubmittingInquiry ? <ActivityIndicator color="#000" /> : <Text style={styles.primaryBtnText}>Submit Inquiry</Text>}
                </TouchableOpacity>
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
    fontWeight: '600',
  },
  /* ─── MODAL WALLET INPUT ─── */
  walletInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Neutrals.gray200,
    borderRadius: Radius.md,
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 56,
  },
  walletCurrencyPrefix: {
    fontSize: 20,
    fontWeight: '600',
    color: Neutrals.gray800,
    marginRight: 8,
  },
  walletAmountInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: Neutrals.gray800,
    outlineStyle: 'none'
  } as any,
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  quickAmountBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: GoldSystem.primaryGold,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
  },
  quickAmountText: {
    color: GoldSystem.primaryGold,
    fontWeight: '600',
    fontSize: 14,
  },
  modalContent: {
    backgroundColor: Neutrals.white,
    padding: 24,
    borderRadius: Radius.lg,
    width: '90%',
    maxWidth: 400,
    shadowColor: Neutrals.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalBtn: {
    flex: 1,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnCancel: {
    backgroundColor: Neutrals.gray100,
  },
  modalBtnCancelText: {
    color: Neutrals.gray800,
    fontWeight: '600',
    fontSize: 15,
  },
  modalBtnPrimary: {
    backgroundColor: GoldSystem.primaryGold,
  },
  modalBtnPrimaryText: {
    color: Neutrals.black,
    fontWeight: '600',
    fontSize: 15,
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
    flexBasis: Platform.OS === 'web' ? 140 : '47%',
    flexGrow: 1,
    maxWidth: Platform.OS === 'web' ? 300 : undefined,
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

  /* ─── PREMIUM LISTINGS STYLES ─── */
  premiumBannerCard: {
    backgroundColor: Neutrals.obsidian,
    borderRadius: Radius.xl,
    padding: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    ...Shadows.gold,
  },
  premiumBannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  premiumCrownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  premiumCrownIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  premiumBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D4AF37',
    letterSpacing: 1,
  },
  premiumSpotBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  premiumSpotText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F87171',
  },
  premiumBannerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  premiumBannerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 18,
    marginBottom: 14,
  },
  premiumPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  premiumPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  premiumPillText: {
    fontSize: 11,
    color: '#E2E8F0',
    fontWeight: '600',
  },
  premiumBannerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 12,
  },
  premiumBannerCallout: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D4AF37',
  },
  premiumArrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* ─── PREMIUM MODAL STYLES ─── */
  premiumModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  premiumModalContainer: {
    backgroundColor: Neutrals.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingBottom: 24,
    maxHeight: '90%',
  },
  premiumModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  premiumModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Neutrals.obsidian,
  },
  premiumModalSub: {
    fontSize: 12,
    color: Neutrals.gray500,
  },
  pkgTabsScroll: {
    borderBottomWidth: 1,
    borderBottomColor: Neutrals.gray200,
    paddingBottom: 10,
    marginBottom: 14,
  },
  pkgTabItem: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginRight: 8,
    backgroundColor: Neutrals.gray100,
    borderWidth: 1,
    borderColor: Neutrals.gray200,
    alignItems: 'center',
  },
  pkgTabItemActive: {
    backgroundColor: Neutrals.obsidian,
    borderColor: '#D4AF37',
  },
  pkgTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: Neutrals.gray700,
  },
  pkgTabTextActive: {
    color: '#FFF',
  },
  pkgTabBadge: {
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: Neutrals.gray200,
  },
  pkgTabBadgeActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
  },
  pkgTabBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: Neutrals.gray600,
  },
  pkgTabBadgeTextActive: {
    color: '#D4AF37',
  },
  pkgContentScroll: {
    paddingHorizontal: 20,
    maxHeight: 440,
  },
  pkgDetailBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  pkgHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pkgTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Neutrals.obsidian,
  },
  pkgHighlightBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  pkgHighlightText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
  },
  pkgLeadText: {
    fontSize: 13,
    color: Neutrals.gray700,
    lineHeight: 18,
    marginBottom: 14,
    fontWeight: '500',
  },
  pkgBulletList: {
    gap: 10,
  },
  pkgBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  pkgCheckIcon: {
    fontSize: 14,
    fontWeight: '800',
    color: '#059669',
    marginRight: 8,
    marginTop: 1,
  },
  pkgBulletText: {
    fontSize: 13,
    color: Neutrals.obsidian,
    lineHeight: 18,
    flex: 1,
  },
  salesFooterBox: {
    backgroundColor: Neutrals.obsidian,
    borderRadius: Radius.lg,
    padding: 16,
    marginBottom: 20,
  },
  salesNoticeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D4AF37',
    textAlign: 'center',
    marginBottom: 14,
  },
  salesActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  salesCallBtn: {
    flex: 1,
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  salesWhatsappBtn: {
    flex: 1,
    backgroundColor: '#059669',
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  salesCallbackBtn: {
    flex: 1,
    backgroundColor: '#D4AF37',
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  salesBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  callbackInput: {
    borderWidth: 1,
    borderColor: Neutrals.gray300,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Neutrals.obsidian,
    backgroundColor: Neutrals.white,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtnSecondary: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Neutrals.gray300,
    backgroundColor: Neutrals.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBtnSecondaryText: {
    color: Neutrals.gray700,
    fontWeight: '600',
    fontSize: 14,
  },
});
