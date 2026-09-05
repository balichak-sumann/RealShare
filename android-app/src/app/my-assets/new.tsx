import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Neutrals, GoldSystem, Typography, Radius } from '@/constants/design';
import { auth } from '@/lib/firebase';

export default function AddAssetScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    property_type: 'Residential',
    address: '',
    purchase_price: '',
  });

  const propertyTypes = ['Commercial', 'Residential', 'Holiday', 'Investor', 'Fractional'];

  const handleSave = async () => {
    if (!formData.title || !formData.address) {
      Alert.alert('Missing Fields', 'Please fill in the title and address.');
      return;
    }

    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'Please sign in first.');
        return;
      }

      const token = await user.getIdToken();
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com'}/api/assets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          purchase_price: formData.purchase_price ? Number(formData.purchase_price) : null,
        })
      });

      if (res.ok) {
        Alert.alert('Success', 'Asset added successfully.');
        router.back();
      } else {
        const err = await res.json();
        Alert.alert('Error', err.error || 'Failed to save asset.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Asset</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.label}>Property Title</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. My Apartment in Cyber City"
          value={formData.title}
          onChangeText={(val) => setFormData({ ...formData, title: val })}
        />

        <Text style={styles.label}>Property Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {propertyTypes.map((pt) => (
            <TouchableOpacity 
              key={pt}
              style={[styles.typePill, formData.property_type === pt && styles.typePillActive]}
              onPress={() => setFormData({ ...formData, property_type: pt })}
            >
              <Text style={[styles.typePillText, formData.property_type === pt && styles.typePillTextActive]}>{pt}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>Full Address</Text>
        <TextInput
          style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
          placeholder="Enter complete property address"
          multiline
          numberOfLines={3}
          value={formData.address}
          onChangeText={(val) => setFormData({ ...formData, address: val })}
        />

        <Text style={styles.label}>Purchase Price (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 15000000"
          keyboardType="numeric"
          value={formData.purchase_price}
          onChangeText={(val) => setFormData({ ...formData, purchase_price: val })}
        />

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={Neutrals.obsidian} />
          ) : (
            <Text style={styles.saveBtnText}>Save Asset</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Neutrals.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, paddingTop: Platform.OS === 'web' ? 18 : 50, backgroundColor: Neutrals.surface,
    borderBottomWidth: 1, borderBottomColor: Neutrals.border,
  },
  backBtn: { padding: 8, marginLeft: -8 },
  backIcon: { fontSize: 24, color: Neutrals.obsidian },
  headerTitle: { ...Typography.headlineMedium, color: Neutrals.obsidian },
  content: { flex: 1 },
  label: { ...Typography.labelMedium, color: Neutrals.obsidian, marginBottom: 8 },
  input: {
    backgroundColor: Neutrals.surface,
    borderWidth: 1, borderColor: Neutrals.border,
    borderRadius: Radius.md,
    padding: 12,
    ...Typography.bodyMedium,
    color: Neutrals.obsidian,
    marginBottom: 16,
  },
  typePill: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1, borderColor: Neutrals.border,
    marginRight: 8,
    backgroundColor: Neutrals.surface,
  },
  typePillActive: {
    backgroundColor: Neutrals.obsidian,
    borderColor: Neutrals.obsidian,
  },
  typePillText: {
    ...Typography.labelMedium, color: Neutrals.gray600,
  },
  typePillTextActive: {
    color: Neutrals.surface,
  },
  saveBtn: {
    backgroundColor: GoldSystem.primaryGold,
    padding: 16,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: 20,
  },
  saveBtnText: {
    ...Typography.labelLarge, color: Neutrals.obsidian, fontWeight: '700'
  }
});
