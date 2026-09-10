import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { auth } from '@/lib/firebase';
import { LinearGradient } from 'expo-linear-gradient';
import { getApiUrl } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';

type Mode = 'loading' | 'view' | 'otp' | 'edit';

export default function BankDetailsScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('loading');
  
  const [accName, setAccName] = useState('');
  const [accNumber, setAccNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [savingBank, setSavingBank] = useState(false);
  
  const [otpCode, setOtpCode] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  useEffect(() => {
    fetchBankDetails();
  }, []);

  const fetchBankDetails = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      const res = await fetch(`${getApiUrl()}/api/agents/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.bankDetails && data.bankDetails.accountNumber) {
          setAccName(data.bankDetails.accountName || '');
          setAccNumber(data.bankDetails.accountNumber || '');
          setIfsc(data.bankDetails.ifsc || '');
          setMode('view');
        } else {
          setMode('edit');
        }
      } else {
        setMode('edit');
      }
    } catch (err) {
      console.error(err);
      setMode('edit');
    }
  };

  const handleVerifyOtp = async () => {
    setVerifyingOtp(true);
    // Simulate OTP verification
    setTimeout(() => {
      setVerifyingOtp(false);
      if (otpCode === '123456') {
        setMode('edit');
        setOtpCode('');
      } else {
        Alert.alert('Invalid OTP', 'Please enter the correct verification code (123456).');
      }
    }, 1000);
  };

  const handleSaveBankDetails = async () => {
    if (!accName || !accNumber || !ifsc) {
      Alert.alert('Error', 'Please fill all details.');
      return;
    }
    setSavingBank(true);
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      
      const res = await fetch(`${getApiUrl()}/api/agents/bank`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bank_account_name: accName,
          bank_account_number: accNumber,
          bank_ifsc: ifsc
        })
      });
      if (res.ok) {
        Alert.alert('Success', 'Bank details saved successfully!');
        setMode('view');
      } else {
        Alert.alert('Error', 'Failed to save bank details.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setSavingBank(false);
    }
  };

  const renderContent = () => {
    if (mode === 'loading') {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#D4AF37" />
        </View>
      );
    }

    if (mode === 'view') {
      const maskedAccount = accNumber.length > 4 
        ? `•••• •••• ${accNumber.slice(-4)}` 
        : accNumber;

      return (
        <View style={styles.content}>
          <View style={styles.cardContainer}>
            <LinearGradient colors={['#1E293B', '#0F172A']} style={styles.bankCard}>
              <View style={styles.cardHeader}>
                <View style={styles.shieldIcon}>
                  <Ionicons name="shield-checkmark" size={24} color="#10B981" />
                </View>
                <Text style={styles.secureText}>Linked & Secure</Text>
              </View>
              
              <Text style={styles.cardHolderLabel}>ACCOUNT HOLDER</Text>
              <Text style={styles.cardHolderName}>{accName}</Text>
              
              <Text style={styles.cardNumberLabel}>ACCOUNT NUMBER</Text>
              <Text style={styles.cardNumber}>{maskedAccount}</Text>
              
              <View style={styles.cardFooter}>
                <View>
                  <Text style={styles.ifscLabel}>IFSC CODE</Text>
                  <Text style={styles.ifscCode}>{ifsc}</Text>
                </View>
                <Ionicons name="business" size={32} color="rgba(255,255,255,0.1)" />
              </View>
            </LinearGradient>
          </View>

          <TouchableOpacity style={styles.updateBtn} onPress={() => setMode('otp')}>
            <Ionicons name="create-outline" size={20} color="#D4AF37" style={{ marginRight: 8 }} />
            <Text style={styles.updateBtnText}>Update Details</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (mode === 'otp') {
      return (
        <View style={styles.content}>
          <View style={styles.otpIconContainer}>
            <Ionicons name="phone-portrait-outline" size={48} color="#D4AF37" />
          </View>
          <Text style={styles.otpTitle}>Security Verification</Text>
          <Text style={styles.otpSubtitle}>To protect your commissions, please enter the OTP sent to your registered mobile number.</Text>
          
          <TextInput 
            style={styles.otpInput} 
            placeholder="Enter 6-digit OTP (123456)" 
            value={otpCode} 
            onChangeText={setOtpCode} 
            keyboardType="number-pad"
            maxLength={6}
            placeholderTextColor="#9CA3AF" 
          />
          
          <TouchableOpacity style={styles.saveBankBtn} onPress={handleVerifyOtp} disabled={verifyingOtp || otpCode.length < 6}>
            {verifyingOtp ? <ActivityIndicator color="#111827" /> : <Text style={styles.saveBankText}>Verify & Proceed</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => setMode('view')}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Edit Mode
    return (
      <View style={styles.content}>
        <Text style={styles.subtitle}>Enter your exact bank details to ensure timely commission payouts without any delays.</Text>
        
        <Text style={styles.inputLabel}>Account Holder Name</Text>
        <TextInput 
          style={styles.input} 
          placeholder="As per bank records" 
          value={accName} 
          onChangeText={setAccName} 
          placeholderTextColor="#9CA3AF" 
        />

        <Text style={styles.inputLabel}>Account Number</Text>
        <TextInput 
          style={styles.input} 
          placeholder="e.g. 000012345678" 
          value={accNumber} 
          onChangeText={setAccNumber} 
          keyboardType="number-pad" 
          secureTextEntry={false} 
          placeholderTextColor="#9CA3AF" 
        />

        <Text style={styles.inputLabel}>IFSC Code</Text>
        <TextInput 
          style={styles.input} 
          placeholder="e.g. SBIN0001234" 
          value={ifsc} 
          onChangeText={setIfsc} 
          autoCapitalize="characters" 
          placeholderTextColor="#9CA3AF" 
        />

        <TouchableOpacity style={styles.saveBankBtn} onPress={handleSaveBankDetails} disabled={savingBank}>
          {savingBank ? <ActivityIndicator color="#111827" /> : <Text style={styles.saveBankText}>Securely Save Details</Text>}
        </TouchableOpacity>
        {accNumber !== '' && (
          <TouchableOpacity style={styles.cancelBtn} onPress={() => setMode('view')}>
            <Text style={styles.cancelBtnText}>Cancel Update</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={['#111827', '#1E293B']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bank Details</Text>
        <View style={{ width: 60 }} />
      </LinearGradient>
      
      {renderContent()}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingTop: Platform.OS === 'web' ? 20 : 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { padding: 8 },
  backBtnText: { color: '#D4AF37', fontSize: 16, fontWeight: '700' },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  content: { padding: 24, flex: 1 },
  subtitle: { fontSize: 14, color: '#4B5563', marginBottom: 24, lineHeight: 20 },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 14,
    fontSize: 15,
    color: '#111827',
    marginBottom: 20,
  },
  saveBankBtn: {
    backgroundColor: '#D4AF37',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBankText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelBtn: {
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelBtnText: {
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '600',
  },
  cardContainer: {
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
  },
  bankCard: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  shieldIcon: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  secureText: {
    color: '#10B981',
    fontWeight: '700',
    fontSize: 15,
  },
  cardHolderLabel: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 1,
  },
  cardHolderName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 24,
    textTransform: 'uppercase',
  },
  cardNumberLabel: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 1,
  },
  cardNumber: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '500',
    letterSpacing: 3,
    marginBottom: 24,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  ifscLabel: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 1,
  },
  ifscCode: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  updateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: '#D4AF37',
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  updateBtnText: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: '700',
  },
  otpIconContainer: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 20,
  },
  otpTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  otpSubtitle: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  otpInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#D4AF37',
    borderRadius: 8,
    padding: 16,
    fontSize: 20,
    color: '#111827',
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '600',
    letterSpacing: 4,
  },
});
