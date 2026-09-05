import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';

export default function StampDutyScreen() {
  const router = useRouter();
  
  const [propertyValue, setPropertyValue] = useState('10000000');
  
  // Hardcoded for demo: 5.5% stamp duty, 0.5% registration
  const value = parseFloat(propertyValue) || 0;
  const stampDuty = value * 0.055;
  const registration = value * 0.005;
  const totalCost = stampDuty + registration;

  const formatCurrency = (val: number) => {
    if (isNaN(val)) return '₹0';
    return '₹' + Math.round(val).toLocaleString('en-IN');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Stamp Duty Calculator</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>State</Text>
          <View style={styles.selector}>
            <Text style={styles.selectorText}>Telangana</Text>
            <Text style={styles.arrowIcon}>▼</Text>
          </View>
          
          <Text style={[styles.inputLabel, { marginTop: 16 }]}>Property Value (₹)</Text>
          <TextInput 
            style={styles.input}
            value={propertyValue}
            onChangeText={setPropertyValue}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.resultCard}>
          <Text style={styles.resultLabel}>Total Additional Cost</Text>
          <Text style={styles.resultValue}>{formatCurrency(totalCost)}</Text>
          
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>Stamp Duty (5.5%)</Text>
            <Text style={styles.breakdownValue}>{formatCurrency(stampDuty)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>Registration Fee (0.5%)</Text>
            <Text style={styles.breakdownValue}>{formatCurrency(registration)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.breakdownItem}>
            <Text style={[styles.breakdownLabel, { color: Neutrals.obsidian, fontWeight: '700' }]}>Effective Property Cost</Text>
            <Text style={[styles.breakdownValue, { color: GoldSystem.primaryGold }]}>{formatCurrency(value + totalCost)}</Text>
          </View>
        </View>

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
    paddingTop: Platform.OS === 'web' ? 18 : 50,
    backgroundColor: Neutrals.surface,
    borderBottomWidth: 1,
    borderBottomColor: Neutrals.border,
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
  content: {
    flex: 1,
    padding: 16,
  },
  inputSection: {
    backgroundColor: Neutrals.surface,
    padding: 20,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Neutrals.border,
    marginBottom: 24,
  },
  inputLabel: {
    ...Typography.labelMedium,
    color: Neutrals.obsidian,
    marginBottom: 8,
  },
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderColor: Neutrals.border,
    borderRadius: Radius.md,
    paddingHorizontal: 16,
    backgroundColor: Neutrals.background,
  },
  selectorText: {
    ...Typography.bodyLarge,
    color: Neutrals.obsidian,
  },
  arrowIcon: {
    color: Neutrals.gray400,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: Neutrals.border,
    borderRadius: Radius.md,
    paddingHorizontal: 16,
    ...Typography.bodyLarge,
    color: Neutrals.obsidian,
    backgroundColor: Neutrals.background,
  },
  resultCard: {
    backgroundColor: Neutrals.surface,
    padding: 24,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Neutrals.border,
    ...Shadows.medium,
  },
  resultLabel: {
    ...Typography.labelMedium,
    color: Neutrals.gray500,
    marginBottom: 8,
    textAlign: 'center',
  },
  resultValue: {
    ...Typography.displayLarge,
    color: GoldSystem.primaryGold,
    marginBottom: 24,
    textAlign: 'center',
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  breakdownLabel: {
    ...Typography.bodyMedium,
    color: Neutrals.gray600,
  },
  breakdownValue: {
    ...Typography.labelLarge,
    color: Neutrals.obsidian,
  },
  divider: {
    height: 1,
    backgroundColor: Neutrals.border,
  },
});
