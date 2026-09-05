import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';

export default function EmiCalculatorScreen() {
  const router = useRouter();
  
  // Basic state
  const [loanAmount, setLoanAmount] = useState('5000000');
  const [interestRate, setInterestRate] = useState('8.5');
  const [tenureYears, setTenureYears] = useState('20');

  // Calculation
  const P = parseFloat(loanAmount) || 0;
  const R = (parseFloat(interestRate) || 0) / 12 / 100;
  const N = (parseFloat(tenureYears) || 0) * 12;
  
  let emi = 0;
  if (P > 0 && R > 0 && N > 0) {
    emi = P * R * (Math.pow(1 + R, N) / (Math.pow(1 + R, N) - 1));
  }
  
  const totalPayment = emi * N;
  const totalInterest = totalPayment - P;

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
        <Text style={styles.headerTitle}>EMI Calculator</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Results Card */}
        <View style={styles.resultCard}>
          <Text style={styles.resultLabel}>Monthly EMI</Text>
          <Text style={styles.resultValue}>{formatCurrency(emi)}</Text>
          
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownBox}>
              <View style={[styles.dot, { backgroundColor: Neutrals.obsidian }]} />
              <Text style={styles.breakdownLabel}>Principal</Text>
              <Text style={styles.breakdownValue}>{formatCurrency(P)}</Text>
            </View>
            <View style={styles.breakdownBox}>
              <View style={[styles.dot, { backgroundColor: GoldSystem.primaryGold }]} />
              <Text style={styles.breakdownLabel}>Interest</Text>
              <Text style={styles.breakdownValue}>{formatCurrency(totalInterest)}</Text>
            </View>
          </View>

          {/* Simple progress bar mimicking a pie chart representation */}
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(P / totalPayment) * 100}%`, backgroundColor: Neutrals.obsidian }]} />
            <View style={[styles.progressFill, { width: `${(totalInterest / totalPayment) * 100}%`, backgroundColor: GoldSystem.primaryGold }]} />
          </View>
          <Text style={styles.totalPayment}>Total Payment: {formatCurrency(totalPayment)}</Text>
        </View>

        {/* Inputs */}
        <View style={styles.inputSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Loan Amount (₹)</Text>
            <TextInput 
              style={styles.input}
              value={loanAmount}
              onChangeText={setLoanAmount}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Interest Rate (% p.a)</Text>
            <TextInput 
              style={styles.input}
              value={interestRate}
              onChangeText={setInterestRate}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tenure (Years)</Text>
            <TextInput 
              style={styles.input}
              value={tenureYears}
              onChangeText={setTenureYears}
              keyboardType="numeric"
            />
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
  resultCard: {
    backgroundColor: Neutrals.surface,
    borderRadius: Radius.lg,
    padding: 24,
    alignItems: 'center',
    ...Shadows.medium,
    marginBottom: 24,
  },
  resultLabel: {
    ...Typography.labelMedium,
    color: Neutrals.gray500,
    marginBottom: 8,
  },
  resultValue: {
    ...Typography.displayLarge,
    color: GoldSystem.primaryGold,
    marginBottom: 24,
  },
  breakdownRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  breakdownBox: {
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  breakdownLabel: {
    ...Typography.caption,
    color: Neutrals.gray500,
    marginBottom: 4,
  },
  breakdownValue: {
    ...Typography.labelLarge,
    color: Neutrals.obsidian,
  },
  progressBar: {
    flexDirection: 'row',
    height: 8,
    width: '100%',
    backgroundColor: Neutrals.gray200,
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
  },
  totalPayment: {
    ...Typography.caption,
    color: Neutrals.obsidian,
    fontWeight: '700',
  },
  inputSection: {
    backgroundColor: Neutrals.surface,
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Neutrals.border,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    ...Typography.labelMedium,
    color: Neutrals.obsidian,
    marginBottom: 8,
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
});
