import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { auth } from '@/lib/firebase';
import { LinearGradient } from 'expo-linear-gradient';

export default function BankDetailsScreen() {
  const router = useRouter();
  const [bankSaved, setBankSaved] = useState(false);
  const [accName, setAccName] = useState('');
  const [accNumber, setAccNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [savingBank, setSavingBank] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBankDetails();
  }, []);

  const fetchBankDetails = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com'}/api/agents/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.bankDetails) {
          setAccName(data.bankDetails.accountName || '');
          setAccNumber(data.bankDetails.accountNumber || '');
          setIfsc(data.bankDetails.ifsc || '');
          if (data.bankDetails.accountNumber) {
            setBankSaved(true);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBankDetails = async () => {
    setSavingBank(true);
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com'}/api/agents/bank`, {
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
        setBankSaved(true);
        Alert.alert('Success', 'Bank details saved successfully!');
        router.back();
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

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={['#111827', '#1E293B']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bank Details</Text>
        <View style={{ width: 60 }} />
      </LinearGradient>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#D4AF37" />
        </View>
      ) : (
        <View style={styles.content}>
          <Text style={styles.subtitle}>Link your bank account for secure commission payouts.</Text>
          
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
        </View>
      )}
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
  content: { padding: 24 },
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
  },
  saveBankText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
  },
});
