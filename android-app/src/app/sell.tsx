import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';
import { GoldButton } from '@/components/ui/GoldButton';
import { auth } from '@/lib/firebase';

export default function SellScreen() {
  const router = useRouter();
  
  useEffect(() => {
    if (!auth.currentUser) {
      router.replace('/(auth)/sign-in');
    }
  }, []);

  const [step, setStep] = useState(1);
  const [listingType, setListingType] = useState('sell'); // sell, rent
  const [propertyType, setPropertyType] = useState('');

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>What do you want to do?</Text>
      
      <View style={styles.row}>
        <TouchableOpacity 
          style={[styles.typeCard, listingType === 'sell' && styles.typeCardActive]}
          onPress={() => setListingType('sell')}
        >
          <Text style={[styles.typeIcon, listingType === 'sell' && styles.typeIconActive]}>💰</Text>
          <Text style={[styles.typeTitle, listingType === 'sell' && styles.typeTextActive]}>Sell</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.typeCard, listingType === 'rent' && styles.typeCardActive]}
          onPress={() => setListingType('rent')}
        >
          <Text style={[styles.typeIcon, listingType === 'rent' && styles.typeIconActive]}>🔑</Text>
          <Text style={[styles.typeTitle, listingType === 'rent' && styles.typeTextActive]}>Rent</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.stepTitle, { marginTop: 32 }]}>Property Type</Text>
      <View style={styles.pillContainer}>
        {['Apartment', 'Villa', 'Plot', 'Commercial'].map(type => (
          <TouchableOpacity 
            key={type}
            style={[styles.pill, propertyType === type && styles.pillActive]}
            onPress={() => setPropertyType(type)}
          >
            <Text style={[styles.pillText, propertyType === type && styles.pillTextActive]}>{type}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <GoldButton 
        title="Next Step" 
        onPress={() => setStep(2)}
        style={{ marginTop: 40 }}
        disabled={!propertyType}
      />
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Property Details</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Locality / Area</Text>
        <TextInput style={styles.input} placeholder="e.g. Jubilee Hills, Hyderabad" />
      </View>
      
      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.inputLabel}>Area (sq.ft)</Text>
          <TextInput style={styles.input} placeholder="e.g. 1500" keyboardType="numeric" />
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.inputLabel}>BHK</Text>
          <TextInput style={styles.input} placeholder="e.g. 3" keyboardType="numeric" />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Expected Total Valuation (₹)</Text>
        <TextInput style={styles.input} placeholder="e.g. 15000000" keyboardType="numeric" />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.inputLabel}>Total Shares to Issue</Text>
          <TextInput style={styles.input} placeholder="e.g. 100" keyboardType="numeric" />
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.inputLabel}>Price per Share (₹)</Text>
          <TextInput style={styles.input} placeholder="e.g. 150000" keyboardType="numeric" />
        </View>
      </View>

      <GoldButton 
        title="Post Listing" 
        onPress={() => {
          // Mock submission
          alert('Listing posted successfully! Admin will verify the posting & approve for listing.');
          router.replace('/builder-portal' as any);
        }}
        style={{ marginTop: 24 }}
      />
      <TouchableOpacity onPress={() => setStep(1)} style={styles.backLink}>
        <Text style={styles.backLinkText}>← Back</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post Property</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: step === 1 ? '50%' : '100%' }]} />
      </View>

      <ScrollView style={styles.content}>
        {step === 1 ? renderStep1() : renderStep2()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Neutrals.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 50,
    backgroundColor: Neutrals.surface,
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  backIcon: {
    fontSize: 24,
    color: Neutrals.obsidian,
  },
  headerTitle: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
  },
  progressContainer: {
    height: 4,
    backgroundColor: Neutrals.gray200,
    width: '100%',
  },
  progressBar: {
    height: '100%',
    backgroundColor: GoldSystem.primaryGold,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
  },
  typeCard: {
    flex: 1,
    backgroundColor: Neutrals.surface,
    borderWidth: 1,
    borderColor: Neutrals.border,
    borderRadius: Radius.lg,
    padding: 24,
    alignItems: 'center',
    marginHorizontal: 8,
    ...Shadows.soft,
  },
  typeCardActive: {
    borderColor: GoldSystem.primaryGold,
    backgroundColor: GoldSystem.paleGold,
  },
  typeIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  typeIconActive: {
    // any icon active state styles
  },
  typeTitle: {
    ...Typography.labelLarge,
    color: Neutrals.obsidian,
  },
  typeTextActive: {
    color: GoldSystem.darkGold,
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  pill: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Neutrals.border,
    backgroundColor: Neutrals.surface,
  },
  pillActive: {
    backgroundColor: Neutrals.obsidian,
    borderColor: Neutrals.obsidian,
  },
  pillText: {
    ...Typography.bodyMedium,
    color: Neutrals.obsidian,
  },
  pillTextActive: {
    color: Neutrals.surface,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    ...Typography.labelMedium,
    color: Neutrals.obsidian,
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: Neutrals.border,
    borderRadius: Radius.md,
    paddingHorizontal: 16,
    ...Typography.bodyLarge,
    color: Neutrals.obsidian,
    backgroundColor: Neutrals.background,
  },
  backLink: {
    marginTop: 24,
    alignItems: 'center',
    padding: 12,
  },
  backLinkText: {
    ...Typography.labelLarge,
    color: Neutrals.gray500,
  },
});
