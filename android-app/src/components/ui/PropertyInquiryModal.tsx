import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Pressable, Platform, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';
import { getApiUrl } from '@/lib/api';

interface PropertyInquiryModalProps {
  visible: boolean;
  onClose: () => void;
  propertyTitle: string;
}

export function PropertyInquiryModal({ visible, onClose, propertyTitle }: PropertyInquiryModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || (!phone.trim() && !email.trim())) {
      Alert.alert('Missing Fields', 'Please provide your name and at least a phone number or email.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_name: name,
          phone,
          email,
          service_type: 'Property Purchase Inquiry',
          property_reference: propertyTitle,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to submit inquiry');
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setName('');
        setPhone('');
        setEmail('');
        onClose();
      }, 2000);
    } catch (error) {
      console.error(error);
      Alert.alert('Submission Error', 'Failed to submit your request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Request Details</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={Neutrals.gray600} />
            </TouchableOpacity>
          </View>

          {success ? (
            <View style={styles.successContainer}>
              <Ionicons name="checkmark-circle" size={64} color={GoldSystem.primaryGold} />
              <Text style={styles.successTitle}>Request Sent!</Text>
              <Text style={styles.successDesc}>Our team will contact you shortly with details regarding {propertyTitle}.</Text>
            </View>
          ) : (
            <>
              <Text style={styles.headerSubtitle}>
                Please provide your contact details to request more information about <Text style={{fontWeight: '700', color: Neutrals.obsidian}}>{propertyTitle}</Text>.
              </Text>

              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Full Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your name"
                    value={name}
                    onChangeText={setName}
                    placeholderTextColor={Neutrals.gray400}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Phone Number</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your phone number"
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                    placeholderTextColor={Neutrals.gray400}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email Address</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                    placeholderTextColor={Neutrals.gray400}
                  />
                </View>

                <TouchableOpacity 
                  style={[styles.submitBtn, loading && styles.submitBtnDisabled]} 
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#000" />
                  ) : (
                    <Text style={styles.submitBtnText}>Submit Request</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 15, 26, 0.55)',
    justifyContent: Platform.OS === 'web' ? 'center' : 'flex-end',
    alignItems: Platform.OS === 'web' ? 'center' : 'stretch',
  },
  card: {
    backgroundColor: Neutrals.surface,
    borderTopLeftRadius: Platform.OS === 'web' ? Radius.lg : 24,
    borderTopRightRadius: Platform.OS === 'web' ? Radius.lg : 24,
    borderBottomLeftRadius: Platform.OS === 'web' ? Radius.lg : 0,
    borderBottomRightRadius: Platform.OS === 'web' ? Radius.lg : 0,
    padding: 24,
    width: Platform.OS === 'web' ? 420 : '100%',
    maxWidth: '100%',
    ...Shadows.strong,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  headerTitle: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Neutrals.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSubtitle: {
    ...Typography.bodyMedium,
    color: Neutrals.gray500,
    marginBottom: 24,
    lineHeight: 20,
  },
  form: {
    gap: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 0,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    ...Typography.labelMedium,
    color: Neutrals.gray600,
  },
  input: {
    backgroundColor: Neutrals.gray100,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: Radius.md,
    ...Typography.bodyLarge,
    color: Neutrals.obsidian,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  submitBtn: {
    backgroundColor: GoldSystem.primaryGold,
    paddingVertical: 16,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    ...Typography.bodyLarge,
    fontWeight: '700',
    color: '#000',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  successTitle: {
    ...Typography.headlineLarge,
    color: Neutrals.obsidian,
    marginTop: 16,
    marginBottom: 8,
  },
  successDesc: {
    ...Typography.bodyLarge,
    color: Neutrals.gray500,
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 22,
  },
});
