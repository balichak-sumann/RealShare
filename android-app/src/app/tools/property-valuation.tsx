import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';
import { GoldButton } from '@/components/ui/GoldButton';
import { InvestmentScore } from '@/components/ui/InvestmentScore';

export default function PropertyValuationScreen() {
  const router = useRouter();
  const [isValuated, setIsValuated] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Valuation</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {!isValuated ? (
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Enter Property Details</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Locality / Area</Text>
              <TextInput style={styles.input} placeholder="e.g. Jubilee Hills, Hyderabad" />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Property Type</Text>
              <TextInput style={styles.input} placeholder="e.g. Apartment, Villa" />
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
            
            <GoldButton 
              title="Generate Valuation" 
              onPress={() => setIsValuated(true)}
              style={{ marginTop: 24 }}
            />
          </View>
        ) : (
          <View style={styles.resultContainer}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultLabel}>Estimated Market Value</Text>
              <Text style={styles.resultPrice}>₹2.45 Cr - ₹2.60 Cr</Text>
              <Text style={styles.resultPerSqft}>₹16,500 / sq.ft avg</Text>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Confidence</Text>
                <Text style={[styles.statValue, { color: '#10B981' }]}>High (94%)</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Rental Est.</Text>
                <Text style={styles.statValue}>₹45K/mo</Text>
              </View>
            </View>

            <View style={styles.scoreSection}>
              <Text style={styles.scoreTitle}>Investment Potential</Text>
              <View style={{ alignItems: 'center', marginTop: 16 }}>
                <InvestmentScore score={88} size={100} showLabel={false} strokeWidth={8} />
                <Text style={styles.scoreDesc}>This property is highly liquid and expected to appreciate 6-8% in the next 12 months based on upcoming metro expansion.</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.recalculateBtn}
              onPress={() => setIsValuated(false)}
            >
              <Text style={styles.recalculateText}>Recalculate</Text>
            </TouchableOpacity>
          </View>
        )}

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
  formContainer: {
    backgroundColor: Neutrals.surface,
    padding: 20,
    borderRadius: Radius.lg,
    ...Shadows.soft,
    borderWidth: 1,
    borderColor: Neutrals.border,
  },
  formTitle: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
    marginBottom: 24,
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
  row: {
    flexDirection: 'row',
  },
  resultContainer: {
    gap: 16,
  },
  resultHeader: {
    backgroundColor: Neutrals.obsidian,
    padding: 24,
    borderRadius: Radius.lg,
    alignItems: 'center',
    ...Shadows.strong,
  },
  resultLabel: {
    ...Typography.labelMedium,
    color: Neutrals.gray300,
    marginBottom: 8,
  },
  resultPrice: {
    ...Typography.displayLarge,
    color: GoldSystem.primaryGold,
    marginBottom: 8,
  },
  resultPerSqft: {
    ...Typography.bodyMedium,
    color: Neutrals.surface,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Neutrals.surface,
    padding: 16,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Neutrals.border,
    ...Shadows.soft,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    ...Typography.caption,
    color: Neutrals.gray500,
    marginBottom: 4,
  },
  statValue: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
  },
  divider: {
    width: 1,
    backgroundColor: Neutrals.border,
    marginHorizontal: 16,
  },
  scoreSection: {
    backgroundColor: Neutrals.surface,
    padding: 20,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Neutrals.border,
    ...Shadows.soft,
  },
  scoreTitle: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
  },
  scoreDesc: {
    ...Typography.bodyMedium,
    color: Neutrals.textSecondary,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 22,
  },
  recalculateBtn: {
    alignItems: 'center',
    padding: 16,
    marginTop: 16,
  },
  recalculateText: {
    ...Typography.labelLarge,
    color: GoldSystem.primaryGold,
  },
});
