import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';
import { LinearGradient } from 'expo-linear-gradient';

const TREND_DATA = [
  { year: '2020', price: 6500 },
  { year: '2021', price: 7200 },
  { year: '2022', price: 8100 },
  { year: '2023', price: 9500 },
  { year: '2024', price: 11200 },
];

export default function MarketInsightsScreen() {
  const router = useRouter();
  const [selectedLocality, setSelectedLocality] = useState('Gachibowli');
  const [metricType, setMetricType] = useState('Sale');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Market Insights</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Filters */}
        <View style={styles.filterRow}>
          <TouchableOpacity style={styles.dropdownBtn}>
            <Text style={styles.dropdownText}>{selectedLocality}</Text>
            <Text style={styles.dropdownIcon}>▼</Text>
          </TouchableOpacity>

          <View style={styles.toggleGroup}>
            <TouchableOpacity 
              style={[styles.toggleBtn, metricType === 'Sale' && styles.toggleBtnActive]}
              onPress={() => setMetricType('Sale')}
            >
              <Text style={[styles.toggleText, metricType === 'Sale' && styles.toggleTextActive]}>Buy</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toggleBtn, metricType === 'Rent' && styles.toggleBtnActive]}
              onPress={() => setMetricType('Rent')}
            >
              <Text style={[styles.toggleText, metricType === 'Rent' && styles.toggleTextActive]}>Rent</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Summary */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Avg Price</Text>
            <Text style={styles.summaryValue}>₹11,200<Text style={styles.summarySub}>/sq.ft</Text></Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>YoY Growth</Text>
            <Text style={[styles.summaryValue, { color: '#059669' }]}>+17.8%</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Rental Yield</Text>
            <Text style={styles.summaryValue}>4.2%</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Demand</Text>
            <Text style={[styles.summaryValue, { color: GoldSystem.primaryGold }]}>Very High</Text>
          </View>
        </View>

        {/* Chart Area */}
        <View style={styles.chartCard}>
          <Text style={styles.sectionTitle}>Price Trend (5 Years)</Text>
          <View style={styles.chartContainer}>
            {/* Simple CSS Chart Representation */}
            {TREND_DATA.map((data, idx) => {
              const heightPercentage = (data.price / 12000) * 100;
              return (
                <View key={idx} style={styles.barContainer}>
                  <Text style={styles.barValue}>₹{data.price}</Text>
                  <LinearGradient 
                    colors={GoldSystem.goldGradient}
                    style={[styles.bar, { height: `${heightPercentage}%` }]}
                  />
                  <Text style={styles.barLabel}>{data.year}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Market Sentiment */}
        <View style={styles.sentimentCard}>
          <Text style={styles.sectionTitle}>Market Sentiment</Text>
          <View style={styles.meterContainer}>
            <View style={styles.meterLabels}>
              <Text style={styles.meterLabelText}>Buyer's Market</Text>
              <Text style={styles.meterLabelText}>Seller's Market</Text>
            </View>
            <View style={styles.meterTrack}>
              <View style={[styles.meterFill, { width: '85%' }]} />
            </View>
            <Text style={styles.sentimentDesc}>
              Strong seller's market driven by IT corridor expansion and infrastructure upgrades.
            </Text>
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
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Neutrals.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Neutrals.border,
    ...Shadows.soft,
  },
  dropdownText: {
    ...Typography.labelLarge,
    color: Neutrals.obsidian,
    marginRight: 8,
  },
  dropdownIcon: {
    fontSize: 12,
    color: Neutrals.gray500,
  },
  toggleGroup: {
    flexDirection: 'row',
    backgroundColor: Neutrals.gray100,
    borderRadius: Radius.md,
    padding: 4,
  },
  toggleBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.sm,
  },
  toggleBtnActive: {
    backgroundColor: Neutrals.surface,
    ...Shadows.soft,
  },
  toggleText: {
    ...Typography.labelMedium,
    color: Neutrals.gray500,
  },
  toggleTextActive: {
    color: Neutrals.obsidian,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    width: '48%',
    backgroundColor: Neutrals.surface,
    padding: 16,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Neutrals.border,
    ...Shadows.soft,
  },
  summaryLabel: {
    ...Typography.caption,
    color: Neutrals.gray500,
    marginBottom: 8,
  },
  summaryValue: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
  },
  summarySub: {
    ...Typography.caption,
    color: Neutrals.gray500,
  },
  chartCard: {
    backgroundColor: Neutrals.surface,
    padding: 20,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Neutrals.border,
    marginBottom: 24,
    ...Shadows.soft,
  },
  sectionTitle: {
    ...Typography.labelLarge,
    color: Neutrals.obsidian,
    marginBottom: 24,
  },
  chartContainer: {
    height: 200,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 20,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  barValue: {
    ...Typography.caption,
    fontSize: 10,
    color: Neutrals.gray500,
    marginBottom: 8,
  },
  bar: {
    width: 32,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  barLabel: {
    ...Typography.caption,
    color: Neutrals.obsidian,
    marginTop: 8,
  },
  sentimentCard: {
    backgroundColor: Neutrals.surface,
    padding: 20,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Neutrals.border,
    ...Shadows.soft,
  },
  meterContainer: {
    marginTop: 8,
  },
  meterLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  meterLabelText: {
    ...Typography.caption,
    color: Neutrals.gray500,
  },
  meterTrack: {
    height: 12,
    backgroundColor: Neutrals.gray200,
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginBottom: 16,
  },
  meterFill: {
    height: '100%',
    backgroundColor: '#EF4444',
  },
  sentimentDesc: {
    ...Typography.bodyMedium,
    color: Neutrals.gray600,
  },
});
