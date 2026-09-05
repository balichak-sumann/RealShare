import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Neutrals, GoldSystem, Typography, Radius } from '@/constants/design';
import { auth } from '@/lib/firebase';

export default function SellScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    property_type: 'Residential',
    listing_type: 'outright',
    price: '',
    total_fractions: '100',
    available_fractions: '100',
    state: '',
    district: '',
    locality: '',
    image_url: '',
  });

  const propertyTypes = ['Residential', 'Commercial', 'Fractional', 'Holiday', 'Investor'];
  const listingTypes = [
    { label: 'Outright Sale', value: 'outright' },
    { label: 'Fractional Sale', value: 'fractional' },
    { label: 'Rental', value: 'rental' },
    { label: 'Resale', value: 'resale' }
  ];

  const handleSave = async () => {
    if (!formData.title || !formData.price || !formData.state || !formData.district || !formData.locality) {
      Alert.alert('Missing Fields', 'Please fill in all the required details (Title, Price, and Location).');
      return;
    }

    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Authentication Required', 'Please sign in to list a property.');
        return;
      }

      const token = await user.getIdToken();
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com'}/api/properties`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          property_type: formData.property_type,
          listing_type: formData.listing_type,
          price_per_fraction: Number(formData.price),
          total_fractions: formData.listing_type === 'fractional' ? Number(formData.total_fractions) : 1,
          available_fractions: formData.listing_type === 'fractional' ? Number(formData.available_fractions) : 1,
          state: formData.state,
          district: formData.district,
          locality: formData.locality,
          image_url: formData.image_url || undefined,
        })
      });

      if (res.ok) {
        Alert.alert(
          'Property Submitted!', 
          'Your property has been successfully submitted and is pending admin approval.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        const err = await res.json();
        Alert.alert('Submission Error', err.error || 'Failed to submit property.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Network error. Please try again.');
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
        <Text style={styles.headerTitle}>Sell Property</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Details</Text>
          
          <Text style={styles.label}>Property Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Luxury 3BHK in Gachibowli"
            value={formData.title}
            onChangeText={(val) => setFormData({ ...formData, title: val })}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            placeholder="Describe the property..."
            multiline
            numberOfLines={3}
            value={formData.description}
            onChangeText={(val) => setFormData({ ...formData, description: val })}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Listing & Pricing</Text>

          <Text style={styles.label}>Listing Type *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
            {listingTypes.map((type) => (
              <TouchableOpacity 
                key={type.value}
                style={[styles.typePill, formData.listing_type === type.value && styles.typePillActive]}
                onPress={() => setFormData({ ...formData, listing_type: type.value })}
              >
                <Text style={[styles.typePillText, formData.listing_type === type.value && styles.typePillTextActive]}>{type.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Property Category *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
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

          <Text style={styles.label}>{formData.listing_type === 'fractional' ? 'Price per Fraction (₹) *' : 'Total Price (₹) *'}</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 15000000"
            keyboardType="numeric"
            value={formData.price}
            onChangeText={(val) => setFormData({ ...formData, price: val })}
          />

          {formData.listing_type === 'fractional' && (
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Total Fractions</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={formData.total_fractions}
                  onChangeText={(val) => setFormData({ ...formData, total_fractions: val })}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Available Fractions</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={formData.available_fractions}
                  onChangeText={(val) => setFormData({ ...formData, available_fractions: val })}
                />
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          
          <Text style={styles.label}>State *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Telangana"
            value={formData.state}
            onChangeText={(val) => setFormData({ ...formData, state: val })}
          />

          <Text style={styles.label}>District *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Hyderabad"
            value={formData.district}
            onChangeText={(val) => setFormData({ ...formData, district: val })}
          />

          <Text style={styles.label}>Locality / Area *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Jubilee Hills"
            value={formData.locality}
            onChangeText={(val) => setFormData({ ...formData, locality: val })}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Media</Text>
          <Text style={styles.label}>Main Image URL (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="https://example.com/image.jpg"
            value={formData.image_url}
            onChangeText={(val) => setFormData({ ...formData, image_url: val })}
          />
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={Neutrals.obsidian} />
          ) : (
            <Text style={styles.saveBtnText}>Submit Property for Approval</Text>
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
  section: {
    marginBottom: 24,
    backgroundColor: Neutrals.surface,
    padding: 16,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Neutrals.border,
  },
  sectionTitle: {
    ...Typography.titleLarge,
    color: Neutrals.obsidian,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Neutrals.border,
    paddingBottom: 8,
  },
  label: { ...Typography.labelMedium, color: Neutrals.obsidian, marginBottom: 8 },
  input: {
    backgroundColor: Neutrals.background,
    borderWidth: 1, borderColor: Neutrals.border,
    borderRadius: Radius.md,
    padding: 12,
    ...Typography.bodyMedium,
    color: Neutrals.obsidian,
    marginBottom: 16,
  },
  pillScroll: {
    marginBottom: 16,
  },
  typePill: {
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: Radius.full,
    borderWidth: 1, borderColor: Neutrals.border,
    marginRight: 8,
    backgroundColor: Neutrals.background,
  },
  typePillActive: {
    backgroundColor: Neutrals.obsidian,
    borderColor: Neutrals.obsidian,
  },
  typePillText: {
    ...Typography.labelMedium, color: Neutrals.gray600,
  },
  typePillTextActive: {
    color: GoldSystem.primaryGold,
  },
  saveBtn: {
    backgroundColor: GoldSystem.primaryGold,
    padding: 16,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginVertical: 10,
  },
  saveBtnText: {
    ...Typography.labelLarge, color: Neutrals.obsidian, fontWeight: '700'
  }
});
