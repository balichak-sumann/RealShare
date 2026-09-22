import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, KeyboardAvoidingView, ScrollView, Image, Modal, ImageBackground, Linking } from 'react-native';
import { signOut, signInWithCustomToken } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'expo-router';
import { AuthSplitLayout } from '@/components/layout/AuthSplitLayout';
import { Neutrals, GoldSystem, Radius, Typography, Shadows } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '@/hooks/useResponsive';
import * as ImagePicker from 'expo-image-picker';

import { useUser } from '@/contexts/UserContext';
import { getApiUrl } from '@/lib/api';
import PlanSelector from '@/components/plans/PlanSelector';

// Email regex — must have valid format (user@domain.tld)
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const AADHAAR_REGEX = /^\d{12}$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
export default function SignUpScreen() {
  const router = useRouter();
  const { setProfile } = useUser();
  const { isDesktop } = useResponsive();
  const isDesktopWeb = isDesktop && Platform.OS === 'web';

  const [identifier, setIdentifier] = useState('');
  
  // Buyer & Builder & Agent specific fields
  const [fullName, setFullName] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  
  // Agent specific fields
  const [aboutAgent, setAboutAgent] = useState('');
  const [aadhaarDoc, setAadhaarDoc] = useState<any>(null);
  const [panDoc, setPanDoc] = useState<any>(null);
  const [passportDoc, setPassportDoc] = useState<any>(null);
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [passportNumber, setPassportNumber] = useState('');

  // Builder specific fields
  const [companyName, setCompanyName] = useState('');
  const [officeAddress, setOfficeAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [reraNumber, setReraNumber] = useState('');
  const [credaiMember, setCredaiMember] = useState<boolean | null>(null);
  const [companyPan, setCompanyPan] = useState('');
  const [companyGst, setCompanyGst] = useState('');
  // Builder KYC (Owner/Director documents)
  const [builderAadhaarDoc, setBuilderAadhaarDoc] = useState<any>(null);
  const [builderPanDoc, setBuilderPanDoc] = useState<any>(null);
  const [builderPassportDoc, setBuilderPassportDoc] = useState<any>(null);
  const [builderAadhaarNumber, setBuilderAadhaarNumber] = useState('');
  const [builderPanNumber, setBuilderPanNumber] = useState('');
  const [builderPassportNumber, setBuilderPassportNumber] = useState('');

  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [role, setRole] = useState<'buyer' | 'investor' | 'agent' | 'builder'>('buyer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [requireKycOnSignup, setRequireKycOnSignup] = useState(true);
  
  // Subscription flow states
  const [plansEnabled, setPlansEnabled] = useState(false);
  const [showPlanSelector, setShowPlanSelector] = useState(false);
  const [createdUserToken, setCreatedUserToken] = useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${getApiUrl()}/api/config`);
        if (res.ok) {
          const data = await res.json();
          if (typeof data.requireKycOnSignup === 'boolean') {
            setRequireKycOnSignup(data.requireKycOnSignup);
          }
          if (typeof data.plansEnabled === 'boolean') {
            setPlansEnabled(data.plansEnabled);
          }
        }
      } catch (e) {
        console.error('Failed to load global config', e);
      }
    })();
  }, []);

  const isEmail = identifier.includes('@');

  const syncUserToBackend = async (user: any): Promise<boolean> => {
    try {
      if (!user) return false;
      const token = await user.getIdToken();
      const apiUrl = getApiUrl();
      const url = `${apiUrl}/api/users/sync`;
      const body: any = { role };
      
      if (role === 'buyer' || role === 'builder' || role === 'agent' || role === 'investor') {
        body.full_name = fullName.trim();
        body.phone_number = isEmail ? '' : `+91 ${identifier.replace(/\D/g, '').slice(-10)}`;
        if (role !== 'buyer') {
          body.full_address = fullAddress.trim();
        }
      } else {
        body.full_name = fullName || '';
        body.phone_number = isEmail ? '' : identifier.trim();
      }
      
      if (role === 'agent') {
        body.bio = aboutAgent.trim();
      }
      if (role === 'builder') {
        body.company_name = companyName.trim();
        body.office_address = officeAddress.trim();
        body.website = website.trim();
        body.rera_number = reraNumber.trim();
        body.credai_member = credaiMember === true;
        body.company_pan = companyPan.trim();
        body.company_gst = companyGst.trim();
      }
      if (referralCode) {
        body.referred_by_code = referralCode;
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        return data.success === true;
      }
      return false;
    } catch (e: any) {
      console.error("Failed to sync role/referral", e?.message);
      return false;
    }
  };

  const onSignUpPress = async () => {
    setLoading(true);
    setError('');

    try {
      if (!fullName.trim() || !identifier.trim()) {
        setError('Please fill in all required fields.');
        setLoading(false); return;
      }
      
      if (role !== 'buyer') {
        if (!fullAddress.trim()) {
          setError('Please fill in all required fields.');
          setLoading(false); return;
        }
      }

      if (role === 'agent' && requireKycOnSignup) {
        if (!aadhaarNumber.trim() || !panNumber.trim() || !aadhaarDoc || !panDoc) {
          setError('Please provide all mandatory KYC documents and numbers (Aadhaar, PAN).');
          setLoading(false); return;
        }
        if (!AADHAAR_REGEX.test(aadhaarNumber.trim())) {
          setError('Please enter a valid 12-digit Aadhaar Number.');
          setLoading(false); return;
        }
        if (!PAN_REGEX.test(panNumber.trim().toUpperCase())) {
          setError('Please enter a valid 10-character PAN Number (e.g. ABCDE1234F).');
          setLoading(false); return;
        }
      }

      if (role === 'builder') {
        if (!companyName.trim() || !officeAddress.trim() || !reraNumber.trim() || credaiMember === null || !companyPan.trim() || !companyGst.trim()) {
          setError('Please fill in all mandatory Company Details.');
          setLoading(false); return;
        }
        if (!PAN_REGEX.test(companyPan.trim().toUpperCase())) {
          setError('Please enter a valid 10-character Company PAN Number (e.g. ABCDE1234F).');
          setLoading(false); return;
        }
        if (!GST_REGEX.test(companyGst.trim().toUpperCase())) {
          setError('Please enter a valid 15-character Company GST Number.');
          setLoading(false); return;
        }
        
        if (requireKycOnSignup) {
          if (!builderAadhaarNumber.trim() || !builderPanNumber.trim() || !builderAadhaarDoc || !builderPanDoc) {
            setError('Please provide all mandatory Owner/Director KYC documents and numbers (Aadhaar, PAN).');
            setLoading(false); return;
          }
          if (!AADHAAR_REGEX.test(builderAadhaarNumber.trim())) {
            setError('Please enter a valid 12-digit Owner/Director Aadhaar Number.');
            setLoading(false); return;
          }
          if (!PAN_REGEX.test(builderPanNumber.trim().toUpperCase())) {
            setError('Please enter a valid 10-character Owner/Director PAN Number (e.g. ABCDE1234F).');
            setLoading(false); return;
          }
        }
      }
      if (isEmail) {
        if (!EMAIL_REGEX.test(identifier.trim())) {
          setError('Please enter a valid email address (e.g. john@gmail.com).');
          setLoading(false); return;
        }
      } else {
        const cleanedPhone = identifier.replace(/\D/g, '');
        if (!/^[6-9]\d{9}$/.test(cleanedPhone)) {
          setError('Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.');
          setLoading(false); return;
        }
      }

      // Call APIs to send OTPs
      if (isEmail) {
        const emailRes = await fetch(`${getApiUrl()}/api/otp/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: identifier.trim() }),
        });
        const emailData = await emailRes.json();
        if (emailData.success) {
          setPendingVerification(true);
        } else {
          setError(emailData.error || 'Failed to send Email OTP.');
        }
      } else {
        const cleanedPhone = identifier.replace(/\D/g, '').slice(-10);
        const phoneRes = await fetch(`${getApiUrl()}/api/otp/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: cleanedPhone }),
        });
        const phoneData = await phoneRes.json();
        if (phoneData.success) {
          setPendingVerification(true);
        } else {
          setError(phoneData.error || 'Failed to send Phone OTP.');
        }
      }
    } catch (err: any) {
      setError('Failed to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  const handlePickDocument = async (setter: any) => {
    try {
      if (Platform.OS === 'web') {
        // On web, use a native file input for reliable base64 capture
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (event: any) => {
          const file = event.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = reader.result as string;
            setter({
              uri: URL.createObjectURL(file),
              base64: base64String,
              fileName: file.name,
            });
          };
          reader.readAsDataURL(file);
        };
        input.click();
      } else {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
          base64: true,
        });
        if (!result.canceled && result.assets.length > 0) {
          setter(result.assets[0]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const onVerifyOtpPress = async () => {
    if (!code || code.length !== 6) {
      setError('Please enter a valid 6-digit OTP.');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const payloadId = isEmail ? identifier.trim() : identifier.replace(/\D/g, '').slice(-10);
      const res = await fetch(`${getApiUrl()}/api/auth/signup-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          identifier: payloadId,
          otp: code,
          fullName: fullName.trim(),
          role: role
        }),
      });
      const data = await res.json();
      
      if (data.success && data.firebaseToken) {
        const userCredential = await signInWithCustomToken(auth, data.firebaseToken);
        
        // Sync to backend first to create Profile
        await syncUserToBackend(userCredential.user);
        
        // Upload KYC Docs
        if (role === 'agent' || role === 'builder' || role === 'investor') {
          const token = await userCredential.user.getIdToken();
          const uploadBaseUrl = (Platform.OS === 'web' && window.location.hostname === 'localhost') ? 'http://localhost:3000' : getApiUrl();
          
          const uploadDoc = async (docData: any, docType: string, docNumber: string) => {
            if (!docData) return;
            try {
              let base64Data = docData.base64;
              if (!base64Data && docData.uri) {
                try {
                  const docRes = await fetch(docData.uri);
                  const blob = await docRes.blob();
                  base64Data = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                  });
                } catch (e) {}
              }
              if (!base64Data) return;
              const uploadRes = await fetch(`${uploadBaseUrl}/api/upload`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ imageBase64: base64Data, fileName: `kyc_${docType}.jpg` })
              });
              const uploadData = await uploadRes.json();
              if (!uploadData.success) return;
              await fetch(`${uploadBaseUrl}/api/kyc/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ document_type: docType, document_number: docNumber ? docNumber.trim() : 'UPLOADED', document_front_url: uploadData.url })
              });
            } catch (e) { console.error('KYC Upload failed', e); }
          };
          
          if (role === 'agent') {
            await uploadDoc(aadhaarDoc, 'aadhaar', aadhaarNumber);
            await uploadDoc(panDoc, 'pan', panNumber);
            await uploadDoc(passportDoc, 'passport', passportNumber);
          } else if (role === 'builder') {
            await uploadDoc(builderAadhaarDoc, 'aadhaar', builderAadhaarNumber);
            await uploadDoc(builderPanDoc, 'pan', builderPanNumber);
            await uploadDoc(builderPassportDoc, 'passport', builderPassportNumber);
          }
        }

        if (role === 'buyer') {
          router.replace('/');
        } else {
          if (plansEnabled) {
            const token = await userCredential.user.getIdToken();
            setCreatedUserToken(token);
            setPendingVerification(false);
            setShowPlanSelector(true);
          } else {
            await finishSignup();
          }
        }
      } else {
        setError(data.error || 'Failed to verify OTPs.');
      }
    } catch (err: any) {
      setError('Failed to verify OTPs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const finishSignup = async () => {
    await signOut(auth).catch(() => {});
    setProfile(null);
    setShowPlanSelector(false);
    setShowSuccessModal(true);
  };

  const handleSelectPlan = async (planId: string, couponCode: string | null) => {
    if (!createdUserToken) return;
    try {
      setLoading(true);
      const res = await fetch(`${getApiUrl()}/api/plans/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${createdUserToken}` },
        body: JSON.stringify({ planId, couponCode })
      });
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Failed to process subscription.');
        return;
      }
      
      if (data.amount === 0) {
        // Free plan
        await finishSignup();
      } else {
        if (Platform.OS === 'web') {
           const options = {
             key: data.keyId,
             amount: data.amount,
             currency: data.currency,
             name: 'RealShare',
             description: `Plan Subscription`,
             order_id: data.order_id,
             handler: async function (response: any) {
               try {
                 setLoading(true);
                 const verifyRes = await fetch(`${getApiUrl()}/api/plans/verify`, {
                   method: 'POST',
                   headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${createdUserToken}` },
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
                    await finishSignup();
                 } else {
                    setError('Payment verification failed.');
                 }
               } catch (e) {
                 setError('Error verifying payment.');
               } finally {
                 setLoading(false);
               }
             },
             theme: { color: GoldSystem.primaryGold }
           };
           const rzp = new (window as any).Razorpay(options);
           rzp.on('payment.failed', function (res: any) {
              setError(res.error.description);
           });
           rzp.open();
        } else {
           alert("Razorpay native not configured. Continuing as success.");
           await finishSignup();
        }
      }
    } catch (e) {
      setError('Failed to process subscription.');
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
          {"Join the Premium Real Estate Platform"}
        </Text>
      </View>

      {error ? <Text style={isDesktopWeb ? styles.desktopErrorText : styles.mobileErrorText}>{error}</Text> : null}

      {!pendingVerification && !showPlanSelector && (
        <View style={styles.form}>
          <Text style={isDesktopWeb ? styles.desktopLabel : styles.mobileLabel}>I want to join as a:</Text>
          <View style={styles.roleRow}>
            {['buyer', 'investor', 'agent', 'builder'].map((r) => {
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

          {role === 'buyer' || role === 'builder' || role === 'agent' || role === 'investor' ? (
            <>
              <Text style={isDesktopWeb ? styles.desktopLabel : styles.mobileLabel}>Full Name <Text style={{color: '#EF4444'}}>*</Text></Text>
              {isDesktopWeb ? (
                <View style={styles.desktopInputWrapper}>
                  <Ionicons name="person-outline" size={20} color={Neutrals.gray500} style={styles.desktopInputIcon} />
                  <TextInput value={fullName} placeholder="Jane Doe" placeholderTextColor={Neutrals.gray400} onChangeText={setFullName} style={styles.desktopInput} />
                </View>
              ) : (
                <TextInput value={fullName} placeholder="Jane Doe" placeholderTextColor="#94A3B8" onChangeText={setFullName} style={styles.mobileInput} />
              )}

              <Text style={isDesktopWeb ? styles.desktopLabel : styles.mobileLabel}>Email or Mobile Number <Text style={{color: '#EF4444'}}>*</Text></Text>
              {isDesktopWeb ? (
                <View style={styles.desktopInputWrapper}>
                  <Ionicons name="mail-outline" size={20} color={Neutrals.gray500} style={styles.desktopInputIcon} />
                  <TextInput autoCapitalize="none" keyboardType="email-address" value={identifier} placeholder="jane@example.com or 9988776655" placeholderTextColor={Neutrals.gray400} onChangeText={setIdentifier} style={styles.desktopInput} />
                </View>
              ) : (
                <TextInput autoCapitalize="none" keyboardType="email-address" value={identifier} placeholder="jane@example.com or 9988776655" placeholderTextColor="#94A3B8" onChangeText={setIdentifier} style={styles.mobileInput} />
              )}

              {role !== 'buyer' && (
                <>
                  <Text style={isDesktopWeb ? styles.desktopLabel : styles.mobileLabel}>Full Address <Text style={{color: '#EF4444'}}>*</Text></Text>
                  {isDesktopWeb ? (
                    <View style={styles.desktopInputWrapper}>
                      <Ionicons name="location-outline" size={20} color={Neutrals.gray500} style={styles.desktopInputIcon} />
                      <TextInput value={fullAddress} placeholder="Apt 123, Jubilee Hills, Hyderabad" placeholderTextColor={Neutrals.gray400} onChangeText={setFullAddress} style={styles.desktopInput} />
                    </View>
                  ) : (
                    <TextInput value={fullAddress} placeholder="Apt 123, Jubilee Hills, Hyderabad" placeholderTextColor="#94A3B8" onChangeText={setFullAddress} style={styles.mobileInput} />
                  )}
                </>
              )}



              {role === 'agent' && (
                <>
                  <Text style={isDesktopWeb ? styles.desktopLabel : styles.mobileLabel}>About Agent Partner <Text style={{fontSize: 11, fontWeight: 'normal', color: Neutrals.gray500}}>(Optional)</Text></Text>
                  {isDesktopWeb ? (
                    <View style={[styles.desktopInputWrapper, { height: 100, alignItems: 'flex-start', paddingTop: 12 }]}>
                      <Ionicons name="document-text-outline" size={20} color={Neutrals.gray500} style={styles.desktopInputIcon} />
                      <TextInput multiline value={aboutAgent} placeholder="Write something about your experience..." placeholderTextColor={Neutrals.gray400} onChangeText={setAboutAgent} style={[styles.desktopInput, { paddingVertical: 0, height: 80, textAlignVertical: 'top' }]} />
                    </View>
                  ) : (
                    <TextInput multiline value={aboutAgent} placeholder="Write something about your experience..." placeholderTextColor="#94A3B8" onChangeText={setAboutAgent} style={[styles.mobileInput, { height: 100, textAlignVertical: 'top' }]} />
                  )}
                </>
              )}
              
              {(role === 'agent' || role === 'investor') && requireKycOnSignup && (
                <>
                  <Text style={isDesktopWeb ? styles.desktopLabel : styles.mobileLabel}>KYC Documents & Verification</Text>
                  <View style={{ gap: 16, marginBottom: 24 }}>
                    {[
                      { label: 'Aadhaar', required: true, numberVal: aadhaarNumber, setNumberVal: setAadhaarNumber, placeholder: 'Enter 12-digit Aadhaar Number', docState: aadhaarDoc, docSetter: setAadhaarDoc },
                      { label: 'PAN Card', required: true, numberVal: panNumber, setNumberVal: setPanNumber, placeholder: 'Enter 10-character PAN Number', docState: panDoc, docSetter: setPanDoc },
                      { label: 'Passport', required: false, numberVal: passportNumber, setNumberVal: setPassportNumber, placeholder: 'Enter Passport Number (Optional)', docState: passportDoc, docSetter: setPassportDoc }
                    ].map((doc) => (
                      <View key={doc.label} style={{ gap: 6 }}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: isDesktopWeb ? Neutrals.obsidian : '#E2E8F0' }}>
                          {doc.label} Number & Document {doc.required ? <Text style={{color: '#EF4444'}}>*</Text> : <Text style={{fontSize: 11, fontWeight: 'normal', color: Neutrals.gray500}}>(Optional)</Text>}
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                          {isDesktopWeb ? (
                            <View style={[styles.desktopInputWrapper, { flex: 1, marginBottom: 0 }]}>
                              <Ionicons name="card-outline" size={18} color={Neutrals.gray500} style={styles.desktopInputIcon} />
                              <TextInput
                                value={doc.numberVal}
                                placeholder={doc.placeholder}
                                placeholderTextColor={Neutrals.gray400}
                                onChangeText={doc.setNumberVal}
                                style={styles.desktopInput}
                                autoCapitalize={doc.label === 'PAN Card' ? 'characters' : 'none'}
                              />
                            </View>
                          ) : (
                            <TextInput
                              value={doc.numberVal}
                              placeholder={doc.placeholder}
                              placeholderTextColor="#94A3B8"
                              onChangeText={doc.setNumberVal}
                              style={[styles.mobileInput, { flex: 1, marginBottom: 0 }]}
                              autoCapitalize={doc.label === 'PAN Card' ? 'characters' : 'none'}
                            />
                          )}

                          <TouchableOpacity
                            style={{
                              paddingHorizontal: 16,
                              paddingVertical: isDesktopWeb ? 13 : 13,
                              backgroundColor: doc.docState?.uri ? 'rgba(16, 185, 129, 0.15)' : (isDesktopWeb ? Neutrals.white : 'rgba(0,0,0,0.3)'),
                              borderWidth: 1,
                              borderColor: doc.docState?.uri ? '#10B981' : (isDesktopWeb ? Neutrals.gray200 : 'rgba(255,255,255,0.1)'),
                              borderRadius: Radius.md,
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 6,
                            }}
                            onPress={() => handlePickDocument(doc.docSetter)}
                          >
                            {doc.docState?.uri ? (
                              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                            ) : (
                              <Ionicons name="cloud-upload-outline" size={18} color={isDesktopWeb ? Neutrals.gray500 : '#94A3B8'} />
                            )}
                            <Text style={{ fontSize: 13, fontWeight: '600', color: doc.docState?.uri ? '#10B981' : (isDesktopWeb ? Neutrals.obsidian : '#FFFFFF') }}>
                              {doc.docState?.uri ? 'Uploaded' : 'Upload Image'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                </>
              )}

              {role === 'builder' && (
                <>
                  {/* --- Company Details Section --- */}
                  <Text style={[isDesktopWeb ? styles.desktopLabel : styles.mobileLabel, { marginTop: 4, marginBottom: 12, fontSize: 15, color: isDesktopWeb ? GoldSystem.primaryGold : '#D4AF37' }]}>Company Details</Text>

                  <Text style={isDesktopWeb ? styles.desktopLabel : styles.mobileLabel}>Company Name <Text style={{color: '#EF4444'}}>*</Text></Text>
                  {isDesktopWeb ? (
                    <View style={styles.desktopInputWrapper}>
                      <Ionicons name="business-outline" size={20} color={Neutrals.gray500} style={styles.desktopInputIcon} />
                      <TextInput value={companyName} placeholder="e.g. ABC Constructions Pvt Ltd" placeholderTextColor={Neutrals.gray400} onChangeText={setCompanyName} style={styles.desktopInput} />
                    </View>
                  ) : (
                    <TextInput value={companyName} placeholder="e.g. ABC Constructions Pvt Ltd" placeholderTextColor="#94A3B8" onChangeText={setCompanyName} style={styles.mobileInput} />
                  )}

                  <Text style={isDesktopWeb ? styles.desktopLabel : styles.mobileLabel}>Office Address <Text style={{color: '#EF4444'}}>*</Text></Text>
                  {isDesktopWeb ? (
                    <View style={[styles.desktopInputWrapper, { height: 80, alignItems: 'flex-start', paddingTop: 12 }]}>
                      <Ionicons name="location-outline" size={20} color={Neutrals.gray500} style={styles.desktopInputIcon} />
                      <TextInput multiline value={officeAddress} placeholder="Office / Registered address" placeholderTextColor={Neutrals.gray400} onChangeText={setOfficeAddress} style={[styles.desktopInput, { paddingVertical: 0, height: 60, textAlignVertical: 'top' }]} />
                    </View>
                  ) : (
                    <TextInput multiline value={officeAddress} placeholder="Office / Registered address" placeholderTextColor="#94A3B8" onChangeText={setOfficeAddress} style={[styles.mobileInput, { height: 80, textAlignVertical: 'top' }]} />
                  )}

                  <Text style={isDesktopWeb ? styles.desktopLabel : styles.mobileLabel}>Website <Text style={{fontSize: 11, fontWeight: 'normal', color: Neutrals.gray500}}>(Optional)</Text></Text>
                  {isDesktopWeb ? (
                    <View style={styles.desktopInputWrapper}>
                      <Ionicons name="globe-outline" size={20} color={Neutrals.gray500} style={styles.desktopInputIcon} />
                      <TextInput autoCapitalize="none" value={website} placeholder="https://www.example.com" placeholderTextColor={Neutrals.gray400} onChangeText={setWebsite} style={styles.desktopInput} />
                    </View>
                  ) : (
                    <TextInput autoCapitalize="none" value={website} placeholder="https://www.example.com" placeholderTextColor="#94A3B8" onChangeText={setWebsite} style={styles.mobileInput} />
                  )}

                  <Text style={isDesktopWeb ? styles.desktopLabel : styles.mobileLabel}>RERA Registration Number <Text style={{color: '#EF4444'}}>*</Text></Text>
                  {isDesktopWeb ? (
                    <View style={styles.desktopInputWrapper}>
                      <Ionicons name="shield-checkmark-outline" size={20} color={Neutrals.gray500} style={styles.desktopInputIcon} />
                      <TextInput autoCapitalize="characters" value={reraNumber} placeholder="e.g. P02400003214" placeholderTextColor={Neutrals.gray400} onChangeText={setReraNumber} style={styles.desktopInput} />
                    </View>
                  ) : (
                    <TextInput autoCapitalize="characters" value={reraNumber} placeholder="e.g. P02400003214" placeholderTextColor="#94A3B8" onChangeText={setReraNumber} style={styles.mobileInput} />
                  )}

                  <Text style={isDesktopWeb ? styles.desktopLabel : styles.mobileLabel}>CREDAI Member <Text style={{color: '#EF4444'}}>*</Text></Text>
                  <View style={[styles.roleRow, { marginBottom: 20 }]}>
                    {[{ label: 'Yes', value: true }, { label: 'No', value: false }].map((opt) => {
                      const isActive = credaiMember === opt.value;
                      let pillStyle, textStyle;
                      if (isDesktopWeb) {
                        pillStyle = [styles.desktopRolePill, isActive && styles.desktopRolePillActive, { flex: 0, paddingHorizontal: 32 }];
                        textStyle = [styles.desktopRoleText, isActive && styles.desktopRoleTextActive];
                      } else {
                        pillStyle = [styles.mobileRolePill, isActive && styles.mobileRolePillActive, { flex: 0, paddingHorizontal: 32 }];
                        textStyle = [styles.mobileRoleText, isActive && styles.mobileRoleTextActive];
                      }
                      return (
                        <TouchableOpacity key={opt.label} style={pillStyle} onPress={() => setCredaiMember(opt.value)}>
                          <Text style={textStyle}>{opt.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <Text style={isDesktopWeb ? styles.desktopLabel : styles.mobileLabel}>Company PAN <Text style={{color: '#EF4444'}}>*</Text></Text>
                  {isDesktopWeb ? (
                    <View style={styles.desktopInputWrapper}>
                      <Ionicons name="card-outline" size={20} color={Neutrals.gray500} style={styles.desktopInputIcon} />
                      <TextInput autoCapitalize="characters" value={companyPan} placeholder="e.g. ABCDE1234F" placeholderTextColor={Neutrals.gray400} onChangeText={setCompanyPan} style={styles.desktopInput} />
                    </View>
                  ) : (
                    <TextInput autoCapitalize="characters" value={companyPan} placeholder="e.g. ABCDE1234F" placeholderTextColor="#94A3B8" onChangeText={setCompanyPan} style={styles.mobileInput} />
                  )}

                  <Text style={isDesktopWeb ? styles.desktopLabel : styles.mobileLabel}>Company GST <Text style={{color: '#EF4444'}}>*</Text></Text>
                  {isDesktopWeb ? (
                    <View style={styles.desktopInputWrapper}>
                      <Ionicons name="receipt-outline" size={20} color={Neutrals.gray500} style={styles.desktopInputIcon} />
                      <TextInput autoCapitalize="characters" value={companyGst} placeholder="e.g. 36ABCDE1234F1Z5" placeholderTextColor={Neutrals.gray400} onChangeText={setCompanyGst} style={styles.desktopInput} />
                    </View>
                  ) : (
                    <TextInput autoCapitalize="characters" value={companyGst} placeholder="e.g. 36ABCDE1234F1Z5" placeholderTextColor="#94A3B8" onChangeText={setCompanyGst} style={styles.mobileInput} />
                  )}

                  {/* --- Owner / Director KYC Section --- */}
                  {requireKycOnSignup && (
                    <>
                      <Text style={[isDesktopWeb ? styles.desktopLabel : styles.mobileLabel, { marginTop: 8, marginBottom: 12, fontSize: 15, color: isDesktopWeb ? GoldSystem.primaryGold : '#D4AF37' }]}>Owner / Director KYC</Text>
                  <View style={{ gap: 16, marginBottom: 24 }}>
                    {[
                      { label: 'Aadhaar', required: true, numberVal: builderAadhaarNumber, setNumberVal: setBuilderAadhaarNumber, placeholder: 'Enter 12-digit Aadhaar Number', docState: builderAadhaarDoc, docSetter: setBuilderAadhaarDoc },
                      { label: 'PAN Card', required: true, numberVal: builderPanNumber, setNumberVal: setBuilderPanNumber, placeholder: 'Enter 10-character PAN Number', docState: builderPanDoc, docSetter: setBuilderPanDoc },
                      { label: 'Passport', required: false, numberVal: builderPassportNumber, setNumberVal: setBuilderPassportNumber, placeholder: 'Enter Passport Number (Optional)', docState: builderPassportDoc, docSetter: setBuilderPassportDoc }
                    ].map((doc) => (
                      <View key={doc.label} style={{ gap: 6 }}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: isDesktopWeb ? Neutrals.obsidian : '#E2E8F0' }}>
                          {doc.label} Number & Document {doc.required ? <Text style={{color: '#EF4444'}}>*</Text> : <Text style={{fontSize: 11, fontWeight: 'normal', color: Neutrals.gray500}}>(Optional)</Text>}
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                          {isDesktopWeb ? (
                            <View style={[styles.desktopInputWrapper, { flex: 1, marginBottom: 0 }]}>
                              <Ionicons name="card-outline" size={18} color={Neutrals.gray500} style={styles.desktopInputIcon} />
                              <TextInput
                                value={doc.numberVal}
                                placeholder={doc.placeholder}
                                placeholderTextColor={Neutrals.gray400}
                                onChangeText={doc.setNumberVal}
                                style={styles.desktopInput}
                                autoCapitalize={doc.label === 'PAN Card' ? 'characters' : 'none'}
                              />
                            </View>
                          ) : (
                            <TextInput
                              value={doc.numberVal}
                              placeholder={doc.placeholder}
                              placeholderTextColor="#94A3B8"
                              onChangeText={doc.setNumberVal}
                              style={[styles.mobileInput, { flex: 1, marginBottom: 0 }]}
                              autoCapitalize={doc.label === 'PAN Card' ? 'characters' : 'none'}
                            />
                          )}

                          <TouchableOpacity
                            style={{
                              paddingHorizontal: 16,
                              paddingVertical: isDesktopWeb ? 13 : 13,
                              backgroundColor: doc.docState?.uri ? 'rgba(16, 185, 129, 0.15)' : (isDesktopWeb ? Neutrals.white : 'rgba(0,0,0,0.3)'),
                              borderWidth: 1,
                              borderColor: doc.docState?.uri ? '#10B981' : (isDesktopWeb ? Neutrals.gray200 : 'rgba(255,255,255,0.1)'),
                              borderRadius: Radius.md,
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 6,
                            }}
                            onPress={() => handlePickDocument(doc.docSetter)}
                          >
                            {doc.docState?.uri ? (
                              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                            ) : (
                              <Ionicons name="cloud-upload-outline" size={18} color={isDesktopWeb ? Neutrals.gray500 : '#94A3B8'} />
                            )}
                            <Text style={{ fontSize: 13, fontWeight: '600', color: doc.docState?.uri ? '#10B981' : (isDesktopWeb ? Neutrals.obsidian : '#FFFFFF') }}>
                              {doc.docState?.uri ? 'Uploaded' : 'Upload Image'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                  </>
                  )}
                </>
              )}
            </>
          ) : (
            <>
              <Text style={isDesktopWeb ? styles.desktopLabel : styles.mobileLabel}>Email or Mobile Number <Text style={{color: '#EF4444'}}>*</Text></Text>
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
              <Text style={isDesktopWeb ? styles.desktopPrimaryButtonText : styles.mobilePrimaryButtonText}>
                {'Send Verification OTPs'}
              </Text>
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
      )}

      {pendingVerification && (
        <View style={styles.form}>
          <Text style={isDesktopWeb ? styles.desktopLabel : styles.mobileLabel}>Verification Code</Text>
          <Text style={{ color: isDesktopWeb ? Neutrals.gray500 : '#94A3B8', marginBottom: 16 }}>
            We've sent a 6-digit code to {isEmail ? identifier : `+91 ${identifier.replace(/\D/g, '')}`}
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
            <Text style={styles.linkText}>Change Details</Text>
          </TouchableOpacity>
        </View>
      )}

      {showPlanSelector && (
        <View style={styles.form}>
           <PlanSelector role={role as any} onSelectPlan={handleSelectPlan} />
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
      )}

      {/* Account Created Success Dialog */}
      <Modal visible={showSuccessModal} transparent={true} animationType="fade" onRequestClose={() => { setShowSuccessModal(false); router.replace('/(auth)/sign-in'); }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconContainer}><Text style={styles.modalIconText}>✓</Text></View>
            <Text style={styles.modalTitle}>Account Created Successfully</Text>
            <Text style={styles.modalMessage}>
              Your {role.charAt(0).toUpperCase() + role.slice(1)} account has been created, but it requires Admin approval. Please wait for our team to review and approve your request before you can log in.
            </Text>
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

  // --- Desktop Styles ---
  desktopScrollContainer: { flexGrow: 1, paddingVertical: 24 },
  roleRow: { flexDirection: 'row', gap: 12, marginBottom: 24, flexWrap: 'wrap' },
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
  mobileBackButton: {
    position: 'absolute', top: Platform.OS === 'ios' ? 60 : 40, left: 24, zIndex: 10,
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
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
