import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, KeyboardAvoidingView, ScrollView, Image, Modal, ImageBackground, Linking } from 'react-native';
import { createUserWithEmailAndPassword, sendEmailVerification, signOut, signInWithCustomToken } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'expo-router';
import { AuthSplitLayout } from '@/components/layout/AuthSplitLayout';
import { Neutrals, GoldSystem, Radius, Typography, Shadows } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '@/hooks/useResponsive';
import * as ImagePicker from 'expo-image-picker';

import { useUser } from '@/contexts/UserContext';
import { getApiUrl } from '@/lib/api';

// Email regex — must have valid format (user@domain.tld)
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const MIN_PASSWORD_LENGTH = 8;
export default function SignUpScreen() {
  const router = useRouter();
  const { setProfile } = useUser();
  const { isDesktop } = useResponsive();
  const isDesktopWeb = isDesktop && Platform.OS === 'web';

  const [identifier, setIdentifier] = useState('');
  
  // Buyer & Builder & Agent specific fields
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  
  // Agent specific fields
  const [aboutAgent, setAboutAgent] = useState('');
  const [aadhaarDoc, setAadhaarDoc] = useState<any>(null);
  const [panDoc, setPanDoc] = useState<any>(null);
  const [passportDoc, setPassportDoc] = useState<any>(null);

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [role, setRole] = useState<'buyer' | 'investor' | 'agent' | 'builder'>('buyer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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
        body.phone_number = `+91 ${mobileNumber.replace(/\D/g, '').slice(-10)}`;
        body.full_address = fullAddress.trim();
      } else {
        body.full_name = fullName || '';
        body.phone_number = isEmail ? '' : identifier.trim();
      }
      
      if (role === 'agent') {
        body.bio = aboutAgent.trim();
      }
      
      if (role === 'builder') {
         body.developer_data = {
           company_name: fullName.trim(), // We use fullName as company name for builder
           office_address: fullAddress.trim(),
           company_pan: panDoc?.fileName ? 'uploaded' : null,
         };
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
      if (role === 'buyer' || role === 'builder' || role === 'agent' || role === 'investor') {
        if (!fullName.trim() || !mobileNumber.trim() || !email.trim() || !fullAddress.trim() || !password) {
          setError('Please fill in all required fields.');
          setLoading(false); return;
        }
        if (!EMAIL_REGEX.test(email.trim())) {
          setError('Please enter a valid email address (e.g. john@gmail.com).');
          setLoading(false); return;
        }
        const cleanedPhone = mobileNumber.replace(/\\D/g, '').slice(-10);
        if (cleanedPhone.length !== 10 || !/^[6-9]/.test(cleanedPhone)) {
          setError('Please enter a valid 10-digit mobile number.');
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

        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await syncUserToBackend(userCredential.user);
        
        if (role === 'agent' || role === 'investor' || role === 'builder') {
           const token = await userCredential.user.getIdToken();
           // Use local admin server for uploads when developing locally on web
           const uploadBaseUrl = (Platform.OS === 'web' && window.location.hostname === 'localhost')
             ? 'http://localhost:3000'
             : getApiUrl();
           
           const uploadDoc = async (docData: any, docType: string) => {
             if (!docData) return;
             try {
               let base64Data = docData.base64;
               if (!base64Data && docData.uri) {
                 try {
                   const res = await fetch(docData.uri);
                   const blob = await res.blob();
                   base64Data = await new Promise((resolve, reject) => {
                     const reader = new FileReader();
                     reader.onloadend = () => resolve(reader.result as string);
                     reader.onerror = reject;
                     reader.readAsDataURL(blob);
                   });
                 } catch (e) { console.error(e); }
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
                 body: JSON.stringify({
                   document_type: docType,
                   document_number: 'UPLOADED-VIA-APP',
                   document_front_url: uploadData.url,
                   document_back_url: null
                 })
               });
             } catch (e) { console.error('KYC Upload failed', e); }
           };
           
           await uploadDoc(aadhaarDoc, 'aadhaar');
           await uploadDoc(panDoc, 'pan');
           await uploadDoc(passportDoc, 'passport');
        }

        // No email verification needed anymore
        // try { await sendEmailVerification(userCredential.user); } catch (e) {}

        await signOut(auth).catch(() => {});
        setProfile(null);
        setShowSuccessModal(true);
      } else {
        // Agent or Builder logic
        if (!identifier) {
          setError('Please enter your Email or Mobile Number.');
          setLoading(false); return;
        }

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
          
          await signOut(auth);
          setProfile(null);
          setShowSuccessModal(true);
        } else {
          const cleanedPhone = identifier.replace(/\\D/g, '').slice(-10);
          if (cleanedPhone.length !== 10) {
            setError('Please enter a valid 10-digit mobile number.');
            setLoading(false); return;
          }
          if (!/^[6-9]/.test(cleanedPhone)) {
            setError('Mobile number must start with 7, 8, 9, or 6.');
            setLoading(false); return;
          }
          
          try {
            const res = await fetch(`${getApiUrl()}/api/otp/send`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ phone: cleanedPhone }),
            });
            const data = await res.json();
            if (data.success) {
              setPendingVerification(true);
            } else {
              setError(data.error || 'Failed to send OTP.');
            }
          } catch (e: any) {
            setError('Failed to connect to the server.');
          }
          setLoading(false);
        }
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
      const cleanedPhone = identifier.replace(/\D/g, '').slice(-10);
      const res = await fetch(`${getApiUrl()}/api/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanedPhone, otp: code }),
      });
      const data = await res.json();
      
      if (data.success && data.firebaseToken) {
        const userCredential = await signInWithCustomToken(auth, data.firebaseToken);
        await syncUserToBackend(userCredential.user);
        
        await signOut(auth);
        setProfile(null);
        setShowSuccessModal(true);
      } else {
        setError(data.error || 'Invalid OTP.');
      }
    } catch (err: any) {
      setError('Failed to verify OTP. Please try again.');
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
              <Text style={isDesktopWeb ? styles.desktopLabel : styles.mobileLabel}>{role === 'builder' ? 'Company / Builder Name' : 'Full Name'}</Text>
              {isDesktopWeb ? (
                <View style={styles.desktopInputWrapper}>
                  <Ionicons name="person-outline" size={20} color={Neutrals.gray500} style={styles.desktopInputIcon} />
                  <TextInput value={fullName} placeholder="Jane Doe" placeholderTextColor={Neutrals.gray400} onChangeText={setFullName} style={styles.desktopInput} />
                </View>
              ) : (
                <TextInput value={fullName} placeholder="Jane Doe" placeholderTextColor="#94A3B8" onChangeText={setFullName} style={styles.mobileInput} />
              )}

              <Text style={isDesktopWeb ? styles.desktopLabel : styles.mobileLabel}>Mobile Number</Text>
              {isDesktopWeb ? (
                <View style={styles.desktopInputWrapper}>
                  <Ionicons name="call-outline" size={20} color={Neutrals.gray500} style={styles.desktopInputIcon} />
                  <TextInput keyboardType="phone-pad" value={mobileNumber} placeholder="9988776655" placeholderTextColor={Neutrals.gray400} onChangeText={setMobileNumber} style={styles.desktopInput} />
                </View>
              ) : (
                <TextInput keyboardType="phone-pad" value={mobileNumber} placeholder="9988776655" placeholderTextColor="#94A3B8" onChangeText={setMobileNumber} style={styles.mobileInput} />
              )}

              <Text style={isDesktopWeb ? styles.desktopLabel : styles.mobileLabel}>Email Address</Text>
              {isDesktopWeb ? (
                <View style={styles.desktopInputWrapper}>
                  <Ionicons name="mail-outline" size={20} color={Neutrals.gray500} style={styles.desktopInputIcon} />
                  <TextInput autoCapitalize="none" keyboardType="email-address" value={email} placeholder="jane@example.com" placeholderTextColor={Neutrals.gray400} onChangeText={setEmail} style={styles.desktopInput} />
                </View>
              ) : (
                <TextInput autoCapitalize="none" keyboardType="email-address" value={email} placeholder="jane@example.com" placeholderTextColor="#94A3B8" onChangeText={setEmail} style={styles.mobileInput} />
              )}

              <Text style={isDesktopWeb ? styles.desktopLabel : styles.mobileLabel}>Full Address</Text>
              {isDesktopWeb ? (
                <View style={styles.desktopInputWrapper}>
                  <Ionicons name="location-outline" size={20} color={Neutrals.gray500} style={styles.desktopInputIcon} />
                  <TextInput value={fullAddress} placeholder="Apt 123, Jubilee Hills, Hyderabad" placeholderTextColor={Neutrals.gray400} onChangeText={setFullAddress} style={styles.desktopInput} />
                </View>
              ) : (
                <TextInput value={fullAddress} placeholder="Apt 123, Jubilee Hills, Hyderabad" placeholderTextColor="#94A3B8" onChangeText={setFullAddress} style={styles.mobileInput} />
              )}

              <Text style={isDesktopWeb ? styles.desktopLabel : styles.mobileLabel}>Password</Text>
              {isDesktopWeb ? (
                <View style={styles.desktopInputWrapper}>
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ paddingRight: 4 }}>
                    <Ionicons name={showPassword ? "lock-open-outline" : "lock-closed-outline"} size={20} color={showPassword ? GoldSystem.primaryGold : Neutrals.gray500} style={styles.desktopInputIcon} />
                  </TouchableOpacity>
                  <TextInput value={password} placeholder="••••••••" placeholderTextColor={Neutrals.gray400} secureTextEntry={!showPassword} onChangeText={setPassword} style={styles.desktopInput} />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4, cursor: 'pointer' }}>
                    <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color={showPassword ? GoldSystem.primaryGold : Neutrals.gray500} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={[styles.mobileInput, { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }]}>
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? "lock-open-outline" : "lock-closed-outline"} size={20} color={showPassword ? '#D4AF37' : '#94A3B8'} style={{ marginRight: 10 }} />
                  </TouchableOpacity>
                  <TextInput value={password} placeholder="••••••••" placeholderTextColor="#94A3B8" secureTextEntry={!showPassword} onChangeText={setPassword} style={{ flex: 1, color: '#FFFFFF', fontSize: 16, paddingVertical: 0 }} />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color={showPassword ? '#D4AF37' : '#94A3B8'} />
                  </TouchableOpacity>
                </View>
              )}

              {role === 'agent' && (
                <>
                  <Text style={isDesktopWeb ? styles.desktopLabel : styles.mobileLabel}>About Agent Partner</Text>
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
              
              {(role === 'agent' || role === 'investor' || role === 'builder') && (
                <>
                  <Text style={isDesktopWeb ? styles.desktopLabel : styles.mobileLabel}>KYC Documents Upload</Text>
                  <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                    {[
                      { label: 'Aadhaar', state: aadhaarDoc, setter: setAadhaarDoc },
                      { label: 'PAN Card', state: panDoc, setter: setPanDoc },
                      { label: 'Passport', state: passportDoc, setter: setPassportDoc }
                    ].map((doc) => (
                      <TouchableOpacity key={doc.label} style={{ flex: 1, minWidth: 100, alignItems: 'center', backgroundColor: isDesktopWeb ? Neutrals.white : 'rgba(0,0,0,0.3)', borderWidth: 1, borderColor: isDesktopWeb ? Neutrals.gray200 : 'rgba(255,255,255,0.1)', borderRadius: Radius.md, padding: 12, ...(isDesktopWeb && Platform.OS === 'web' ? { boxShadow: '0 2px 4px rgba(0,0,0,0.02)' } as any : {}) }} onPress={() => handlePickDocument(doc.setter)}>
                        {doc.state?.uri ? (
                          <Image source={{ uri: doc.state.uri }} style={{ width: 40, height: 40, borderRadius: 4, marginBottom: 8 }} />
                        ) : (
                          <Ionicons name="cloud-upload-outline" size={24} color={isDesktopWeb ? Neutrals.gray500 : '#94A3B8'} style={{ marginBottom: 8 }} />
                        )}
                        <Text style={{ fontSize: 12, fontWeight: '600', color: isDesktopWeb ? Neutrals.obsidian : '#FFFFFF', textAlign: 'center' }}>
                          {doc.state?.uri ? `${doc.label} (Done)` : `Upload ${doc.label}`}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </>
          ) : (
            <>
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
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ paddingRight: 4 }}>
                        <Ionicons name={showPassword ? "lock-open-outline" : "lock-closed-outline"} size={20} color={showPassword ? GoldSystem.primaryGold : Neutrals.gray500} style={styles.desktopInputIcon} />
                      </TouchableOpacity>
                      <TextInput
                        value={password} placeholder="••••••••" placeholderTextColor={Neutrals.gray400}
                        secureTextEntry={!showPassword} onChangeText={setPassword} style={styles.desktopInput}
                      />
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4, cursor: 'pointer' }}>
                        <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color={showPassword ? GoldSystem.primaryGold : Neutrals.gray500} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={[styles.mobileInput, { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }]}>
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        <Ionicons name={showPassword ? "lock-open-outline" : "lock-closed-outline"} size={20} color={showPassword ? '#D4AF37' : '#94A3B8'} style={{ marginRight: 10 }} />
                      </TouchableOpacity>
                      <TextInput
                        value={password} placeholder="••••••••" placeholderTextColor="#94A3B8"
                        secureTextEntry={!showPassword} onChangeText={setPassword} style={{ flex: 1, color: '#FFFFFF', fontSize: 16, paddingVertical: 0 }}
                      />
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color={showPassword ? '#D4AF37' : '#94A3B8'} />
                      </TouchableOpacity>
                    </View>
                  )}
                </>
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
                {role === 'buyer' || role === 'builder' || role === 'agent' || role === 'investor' || isEmail ? 'Create Account' : 'Send OTP'}
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
            We've sent a 6-digit code to +91 {identifier}
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
