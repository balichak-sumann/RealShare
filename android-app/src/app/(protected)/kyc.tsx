import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, TextInput, ActivityIndicator, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { auth, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRouter } from 'expo-router';

export default function KYCScreen() {
  const router = useRouter();
  const [docType, setDocType] = useState('Aadhaar Card');
  const [docNumber, setDocNumber] = useState('');
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const docTypes = ['Aadhaar Card', 'PAN Card', 'Passport'];

  const pickImage = async (side: 'front' | 'back') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        if (side === 'front') setFrontImage(result.assets[0].uri);
        if (side === 'back') setBackImage(result.assets[0].uri);
      }
    } catch (err) {
      console.log('ImagePicker error:', err);
    }
  };

  const uploadImageAsync = async (uri: string, side: string) => {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not logged in');

    const response = await fetch(uri);
    const blob = await response.blob();
    const timestamp = Date.now();
    const storageRef = ref(storage, `kyc-documents/${userId}/${timestamp}_${side}.jpg`);
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  };

  const handleSubmit = async () => {
    if (!docNumber) return setError('Please enter document number');
    if (!frontImage) return setError('Please upload the front of the document');
    
    setLoading(true);
    setError('');

    try {
      const token = await auth.currentUser?.getIdToken();
      
      const frontUrl = await uploadImageAsync(frontImage, 'front');
      const backUrl = backImage ? await uploadImageAsync(backImage, 'back') : null;

      const res = await fetch('http://localhost:3000/api/kyc/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          document_type: docType,
          document_number: docNumber,
          document_front_url: frontUrl,
          document_back_url: backUrl
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit KYC');

      setSuccess(true);
      setTimeout(() => {
        router.replace('/');
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'An error occurred during submission');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <View style={styles.successIcon}>
          <Text style={{ color: '#fff', fontSize: 32 }}>✓</Text>
        </View>
        <Text style={styles.successTitle}>KYC Verified!</Text>
        <Text style={styles.successText}>Your identity has been securely verified. You can now start investing!</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
      <Text style={styles.title}>Complete Your KYC</Text>
      <Text style={styles.subtitle}>Please upload your identity documents to verify your account for investing.</Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Text style={styles.sectionLabel}>Select Document Type</Text>
      <View style={styles.typeSelector}>
        {docTypes.map(type => (
          <TouchableOpacity 
            key={type} 
            style={[styles.typeButton, docType === type && styles.typeButtonActive]}
            onPress={() => setDocType(type)}
          >
            <Text style={[styles.typeButtonText, docType === type && styles.typeButtonTextActive]}>{type}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Document Number</Text>
      <TextInput
        style={styles.input}
        placeholder={`Enter ${docType} Number`}
        value={docNumber}
        onChangeText={setDocNumber}
      />

      <Text style={styles.sectionLabel}>Upload Photos</Text>
      <View style={styles.uploadRow}>
        <TouchableOpacity style={styles.uploadBox} onPress={() => pickImage('front')}>
          {frontImage ? (
            <Image source={{ uri: frontImage }} style={styles.previewImage} />
          ) : (
            <>
              <Text style={styles.uploadIcon}>📷</Text>
              <Text style={styles.uploadText}>Front Side (Required)</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.uploadBox} onPress={() => pickImage('back')}>
          {backImage ? (
            <Image source={{ uri: backImage }} style={styles.previewImage} />
          ) : (
            <>
              <Text style={styles.uploadIcon}>📷</Text>
              <Text style={styles.uploadText}>Back Side (Optional)</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Submit for Verification</Text>}
      </TouchableOpacity>
      <Text style={styles.disclaimer}>By submitting, you agree to our Terms of Service and authorize us to verify your identity.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 32,
    lineHeight: 22,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  typeButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  typeButtonActive: {
    borderColor: '#1A56DB',
    backgroundColor: '#EFF6FF',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  typeButtonTextActive: {
    color: '#1A56DB',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
    marginBottom: 24,
  },
  uploadRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  uploadBox: {
    flex: 1,
    height: 120,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  uploadIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  uploadText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  submitButton: {
    backgroundColor: '#1A56DB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#1A56DB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  disclaimer: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
  },
  errorText: {
    color: '#DC2626',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    overflow: 'hidden',
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },
  successText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 24,
  }
});
