import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';
import { TabAnimationWrapper } from '@/components/ui/TabAnimationWrapper';
import { useUser } from '@/contexts/UserContext';

export function InvestorDashboard() {
  const router = useRouter();
  const { profile } = useUser();
  const [activeTab, setActiveTab] = useState<'Assets' | 'Ledger' | 'Investments' | 'Support'>('Assets');

  const handleAddAsset = () => {
    // Navigate to add asset flow (to be built)
    router.push('/my-assets/new' as any);
  };

  const handleVIPConcierge = () => {
    Alert.alert('VIP Concierge', 'Connecting you to your dedicated Wealth Manager...');
  };

  return (
    <TabAnimationWrapper>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Investor Hub</Text>
          <TouchableOpacity onPress={handleAddAsset} style={styles.addAssetBtn}>
            <Ionicons name="add" size={20} color={Neutrals.obsidian} />
            <Text style={styles.addAssetText}>Add Asset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Quick Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>My Assets</Text>
              <Text style={styles.statValue}>4</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Investments</Text>
              <Text style={styles.statValue}>₹ 12.5 Cr</Text>
            </View>
          </View>

          {/* VIP Concierge Banner */}
          <TouchableOpacity style={styles.vipBanner} onPress={handleVIPConcierge}>
            <View style={styles.vipIconBox}>
              <Ionicons name="diamond" size={24} color={GoldSystem.primaryGold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.vipTitle}>VIP Concierge</Text>
              <Text style={styles.vipDesc}>Services of Wealth Manager on regular follow up</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Neutrals.gray400} />
          </TouchableOpacity>

          {/* Custom Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer}>
            {['Assets', 'Ledger', 'Investments', 'Support'].map((tab) => (
              <TouchableOpacity 
                key={tab} 
                style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
                onPress={() => setActiveTab(tab as any)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Tab Content */}
          <View style={styles.tabContent}>
            {activeTab === 'Assets' && (
              <View>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>My Assets</Text>
                </View>
                {/* Mock Asset Card */}
                <View style={styles.assetCard}>
                  <View style={styles.assetCardHeader}>
                    <Text style={styles.assetTypeBadge}>RENTAL</Text>
                    <Text style={styles.assetPrice}>₹ 4.5 Cr</Text>
                  </View>
                  <Text style={styles.assetTitle}>The Zenith Tower, Office 402</Text>
                  <Text style={styles.assetAddress}>Bandra Kurla Complex, Mumbai</Text>
                  <View style={styles.divider} />
                  <View style={styles.leaseDetails}>
                    <Text style={styles.leaseText}><Text style={styles.leaseLabel}>Lease Name:</Text> TechCorp India Pvt Ltd</Text>
                    <Text style={styles.leaseText}><Text style={styles.leaseLabel}>Period:</Text> 36 Months</Text>
                    <Text style={styles.leaseText}><Text style={styles.leaseLabel}>Monthly Rental:</Text> ₹ 2.5 Lakhs</Text>
                    <Text style={styles.leaseText}><Text style={styles.leaseLabel}>Managed By:</Text> Company</Text>
                  </View>
                </View>

                {/* Mock Asset Card */}
                <View style={styles.assetCard}>
                  <View style={styles.assetCardHeader}>
                    <Text style={styles.assetTypeBadge}>OWN</Text>
                    <Text style={styles.assetPrice}>₹ 8.0 Cr</Text>
                  </View>
                  <Text style={styles.assetTitle}>Luxury Villa #12</Text>
                  <Text style={styles.assetAddress}>Palm Jumeirah, Dubai</Text>
                </View>
              </View>
            )}

            {activeTab === 'Ledger' && (
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={48} color={Neutrals.gray300} />
                <Text style={styles.emptyStateTitle}>A/C Ledger</Text>
                <Text style={styles.emptyStateDesc}>Your account ledger and transaction history will appear here.</Text>
              </View>
            )}

            {activeTab === 'Investments' && (
              <View style={styles.emptyState}>
                <Ionicons name="pie-chart-outline" size={48} color={Neutrals.gray300} />
                <Text style={styles.emptyStateTitle}>Investments</Text>
                <Text style={styles.emptyStateDesc}>Track your ongoing investment portfolios here.</Text>
              </View>
            )}

            {activeTab === 'Support' && (
              <View style={styles.emptyState}>
                <Ionicons name="headset-outline" size={48} color={Neutrals.gray300} />
                <Text style={styles.emptyStateTitle}>Support Tickets</Text>
                <Text style={styles.emptyStateDesc}>Raise and track your support queries.</Text>
                <TouchableOpacity style={styles.primaryBtn} onPress={() => Alert.alert('Support', 'Ticket system coming soon.')}>
                  <Text style={styles.primaryBtnText}>Raise a Ticket</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </TabAnimationWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Neutrals.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'web' ? 24 : 60,
    paddingBottom: 16,
    backgroundColor: Neutrals.surface,
    borderBottomWidth: 1,
    borderBottomColor: Neutrals.border,
  },
  headerTitle: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
  },
  addAssetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GoldSystem.primaryGold,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
    gap: 4,
  },
  addAssetText: {
    ...Typography.labelMedium,
    color: Neutrals.obsidian,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Neutrals.obsidian,
    padding: 16,
    borderRadius: Radius.lg,
    ...Shadows.medium,
  },
  statLabel: {
    ...Typography.caption,
    color: GoldSystem.paleGold,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  statValue: {
    ...Typography.headlineMedium,
    color: Neutrals.white,
  },
  vipBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Neutrals.surface,
    padding: 16,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: GoldSystem.primaryGold,
    marginBottom: 24,
    ...Shadows.soft,
  },
  vipIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  vipTitle: {
    ...Typography.labelLarge,
    color: Neutrals.obsidian,
    marginBottom: 4,
  },
  vipDesc: {
    ...Typography.caption,
    color: Neutrals.gray500,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: Radius.full,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Neutrals.border,
    backgroundColor: Neutrals.surface,
  },
  tabButtonActive: {
    backgroundColor: Neutrals.obsidian,
    borderColor: Neutrals.obsidian,
  },
  tabText: {
    ...Typography.labelMedium,
    color: Neutrals.gray500,
  },
  tabTextActive: {
    color: Neutrals.white,
  },
  tabContent: {
    minHeight: 300,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
  },
  assetCard: {
    backgroundColor: Neutrals.surface,
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Neutrals.border,
    marginBottom: 16,
    ...Shadows.soft,
  },
  assetCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  assetTypeBadge: {
    ...Typography.caption,
    fontWeight: 'bold',
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    color: GoldSystem.darkGold,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  assetPrice: {
    ...Typography.labelLarge,
    color: Neutrals.obsidian,
  },
  assetTitle: {
    ...Typography.headlineSmall,
    color: Neutrals.obsidian,
    marginBottom: 4,
  },
  assetAddress: {
    ...Typography.bodyMedium,
    color: Neutrals.gray500,
  },
  divider: {
    height: 1,
    backgroundColor: Neutrals.border,
    marginVertical: 12,
  },
  leaseDetails: {
    gap: 6,
  },
  leaseText: {
    ...Typography.bodyMedium,
    color: Neutrals.obsidian,
  },
  leaseLabel: {
    fontWeight: '600',
    color: Neutrals.gray500,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: Neutrals.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Neutrals.border,
    borderStyle: 'dashed',
  },
  emptyStateTitle: {
    ...Typography.headlineSmall,
    color: Neutrals.obsidian,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDesc: {
    ...Typography.bodyMedium,
    color: Neutrals.gray500,
    textAlign: 'center',
    marginBottom: 20,
  },
  primaryBtn: {
    backgroundColor: GoldSystem.primaryGold,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: Radius.md,
  },
  primaryBtnText: {
    ...Typography.labelLarge,
    color: Neutrals.obsidian,
  }
});
