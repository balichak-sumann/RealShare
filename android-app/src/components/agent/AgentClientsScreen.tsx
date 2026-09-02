import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert
} from 'react-native';
import { TabAnimationWrapper } from '@/components/ui/TabAnimationWrapper';
import { auth } from '@/lib/firebase';
import { ActivityIndicator } from 'react-native';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';

export function AgentClientsScreen() {
  const [activeTab, setActiveTab] = useState('All');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com'}/api/agents/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      }
    } catch (err) {
      console.error('Failed to fetch earnings', err);
    } finally {
      setLoading(false);
    }
  };

  const clientLeads = dashboardData?.clientLeads || [];
  
  const filteredClients = clientLeads.filter((client: any) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Active') return client.status === 'Commission Paid';
    if (activeTab === 'Pending') return client.status === 'Pending Payout' || client.status === 'Under Review';
    return true;
  });

  const totalCommissionEarned = dashboardData?.totalEarned || 0;
  const pendingCommission = dashboardData?.pendingPayout || 0;
  const totalCommission = totalCommissionEarned + pendingCommission;

  return (
    <TabAnimationWrapper>
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Commission Earnings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Net Worth Hero Section - Repurposed for Commissions */}
        <View style={styles.heroSection}>
          <View style={styles.heroCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View>
                <Text style={styles.heroSubtitle}>Total Commission</Text>
                <Text style={styles.heroTitle}>₹ {totalCommission.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.growthBadge}>
                <Text style={styles.growthBadgeText}>↑ +12.4%</Text>
              </View>
            </View>
            
            <View style={styles.heroSplit}>
              <View style={styles.heroSplitItem}>
                <Text style={styles.heroSplitLabel}>Paid Out</Text>
                <Text style={styles.heroSplitValue}>₹ {typeof totalCommissionEarned === 'number' ? totalCommissionEarned.toLocaleString('en-IN') : totalCommissionEarned.replace('₹', '')}</Text>
              </View>
              <View style={styles.heroSplitDivider} />
              <View style={styles.heroSplitItem}>
                <Text style={styles.heroSplitLabel}>Pending</Text>
                <Text style={styles.heroSplitValue}>₹ {typeof pendingCommission === 'number' ? pendingCommission.toLocaleString('en-IN') : pendingCommission.replace('₹', '')}</Text>
              </View>
            </View>

            <View style={styles.heroActions}>
              <TouchableOpacity style={styles.heroBtnOutline} onPress={() => Alert.alert('Payouts', 'View detailed payout history.')}>
                <Text style={styles.heroBtnOutlineText}>Payouts</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.heroBtnSolid} onPress={() => Alert.alert('Action', 'Generate Client Lead link.')}>
                <Text style={styles.heroBtnSolidText}>+ Add Lead</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Sales Trends Over Time (Bar Chart) */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Sales Trends Over Time</Text>
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartSubtitle}>Monthly Commission Earned</Text>
              <Text style={styles.chartHighlight}>+24% vs Last 6M</Text>
            </View>
            <View style={styles.chartArea}>
              {/* Bars */}
              {[
                { month: 'MAY', height: 40, value: '₹12k' },
                { month: 'JUN', height: 60, value: '₹18k' },
                { month: 'JUL', height: 45, value: '₹14k' },
                { month: 'AUG', height: 80, value: '₹24k' },
                { month: 'SEP', height: 100, value: '₹30k', active: true },
                { month: 'OCT', height: 75, value: '₹22k' },
              ].map((data, index) => (
                <View key={index} style={styles.barColumn}>
                  <Text style={[styles.barValue, data.active && styles.barValueActive]}>{data.value}</Text>
                  <View style={styles.barTrack}>
                    <View style={[
                      styles.barFill, 
                      { height: `${data.height}%` },
                      data.active && { backgroundColor: GoldSystem.primaryGold }
                    ]} />
                  </View>
                  <Text style={[styles.barLabel, data.active && styles.barLabelActive]}>{data.month}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Passive Income Section - Repurposed for Client Metrics */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Client Performance</Text>
          <View style={styles.incomeCard}>
            <View style={styles.incomeMain}>
              <Text style={styles.incomeLabel}>Total Client Investments</Text>
              <Text style={styles.incomeValue}>₹ 85,00,000</Text>
              <Text style={styles.incomeBadge}>Top 10% Agent</Text>
            </View>
            <View style={styles.incomeDivider} />
            <View style={styles.incomeSecondary}>
              <View style={styles.incomeStatBlock}>
                <Text style={styles.incomeSubLabel}>Completed Deals</Text>
                <Text style={styles.incomeSubValue}>{clientLeads.filter((c: any) => c.status === 'Commission Paid').length}</Text>
              </View>
              <View style={styles.incomeStatBlock}>
                <Text style={styles.incomeSubLabel}>Pending Deals</Text>
                <Text style={styles.incomeSubValue}>{clientLeads.filter((c: any) => c.status !== 'Commission Paid').length}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Upcoming Payouts */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Upcoming Payouts</Text>
            <TouchableOpacity onPress={() => Alert.alert('Calendar', 'Full payout calendar coming soon.')}>
              <Text style={styles.sectionLink}>View Calendar</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.payoutCard}>
            <View style={styles.payoutDateBox}>
              <Text style={styles.payoutDateMonth}>NOV</Text>
              <Text style={styles.payoutDateDay}>01</Text>
            </View>
            <View style={styles.payoutContent}>
              <Text style={styles.payoutTitle}>Referral Commission</Text>
              <Text style={styles.payoutSub}>Anjali Desai - Aura IT Park</Text>
            </View>
            <Text style={styles.payoutAmount}>+₹ 37,500</Text>
          </View>
        </View>

        {/* Asset Allocation - Repurposed for Client Pipeline */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Client Pipeline</Text>
          <View style={styles.allocationCard}>
            <View style={styles.allocationBar}>
              <View style={[styles.allocationSegment, { flex: 1, backgroundColor: GoldSystem.primaryGold }]} />
              <View style={[styles.allocationSegment, { flex: 2, backgroundColor: Neutrals.obsidian }]} />
              <View style={[styles.allocationSegment, { flex: 7, backgroundColor: Neutrals.gray400 }]} />
            </View>
            <View style={styles.allocationLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: GoldSystem.primaryGold }]} />
                <Text style={styles.legendText}>Active (10%)</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Neutrals.obsidian }]} />
                <Text style={styles.legendText}>Pending (20%)</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Neutrals.gray400 }]} />
                <Text style={styles.legendText}>Leads (70%)</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tabs for Client List */}
        <View style={styles.tabsRow}>
          {['All', 'Active', 'Pending'].map((tab) => (
            <TouchableOpacity 
              key={tab} 
              style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Client List */}
        <View style={styles.assetList}>
          {loading ? (
            <ActivityIndicator size="large" color="#D4AF37" style={{ marginTop: 40 }} />
          ) : filteredClients.length === 0 ? (
            <View style={{ padding: 20, alignItems: 'center', marginTop: 40 }}>
              <Text style={{ fontSize: 16, color: '#6B7280' }}>No deals found.</Text>
            </View>
          ) : (
            filteredClients.map((client: any) => (
              <View key={client.id} style={styles.assetCard}>
                <View style={styles.assetHeader}>
                  <View style={styles.assetImagePlaceholder}>
                    <Text style={styles.avatarText}>{client.name.charAt(0)}</Text>
                  </View>
                  <View style={styles.assetInfo}>
                    <Text style={styles.assetTitle}>{client.name}</Text>
                    <Text style={styles.assetLoc}>{client.property}</Text>
                    <View style={styles.assetMetaRow}>
                      <Text style={styles.assetMetaText}>Fractions: {client.fractions}</Text>
                      <View style={styles.assetDot} />
                      <Text style={[
                        styles.assetMetaText, 
                        { color: client.status === 'Commission Paid' ? '#059669' : '#D97706', fontWeight: '700' }
                      ]}>
                        {client.status}
                      </Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.assetDivider} />
                
                <View style={styles.assetFinancials}>
                  <View style={styles.assetFinBox}>
                    <Text style={styles.assetFinLabel}>Status</Text>
                    <Text style={styles.assetFinValue}>{client.status}</Text>
                  </View>
                  <View style={styles.assetFinBox}>
                    <Text style={styles.assetFinLabel}>Earned</Text>
                    <Text style={[styles.assetFinValue, { color: '#059669' }]}>{client.commission}</Text>
                  </View>
                </View>
              </View>
            ))
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: Neutrals.surface,
  },
  headerTitle: {
    ...Typography.displayMedium,
    color: Neutrals.obsidian,
  },
  heroSection: {
    backgroundColor: Neutrals.surface,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: Neutrals.border,
  },
  heroCard: {
    backgroundColor: Neutrals.obsidian,
    borderRadius: Radius.xl,
    padding: 24,
    ...Shadows.strong,
  },
  heroSubtitle: {
    ...Typography.labelMedium,
    color: Neutrals.gray400,
    marginBottom: 4,
  },
  heroTitle: {
    ...Typography.displayLarge,
    color: Neutrals.surface,
    fontSize: 32,
  },
  growthBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  growthBadgeText: {
    ...Typography.caption,
    color: '#10B981',
    fontWeight: '700',
  },
  heroSplit: {
    flexDirection: 'row',
    marginTop: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: Radius.lg,
    padding: 16,
  },
  heroSplitItem: {
    flex: 1,
  },
  heroSplitDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 16,
  },
  heroSplitLabel: {
    ...Typography.caption,
    color: Neutrals.gray400,
    marginBottom: 4,
  },
  heroSplitValue: {
    ...Typography.headlineMedium,
    color: Neutrals.surface,
  },
  heroActions: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  heroBtnOutline: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  heroBtnOutlineText: {
    ...Typography.labelMedium,
    color: Neutrals.surface,
  },
  heroBtnSolid: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Radius.md,
    backgroundColor: GoldSystem.primaryGold,
    alignItems: 'center',
  },
  heroBtnSolidText: {
    ...Typography.labelMedium,
    color: Neutrals.obsidian,
  },
  sectionContainer: {
    padding: 20,
    paddingBottom: 0,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  sectionTitle: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
    marginBottom: 16,
  },
  chartCard: {
    backgroundColor: Neutrals.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Neutrals.border,
    padding: 20,
    ...Shadows.soft,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  chartSubtitle: {
    ...Typography.labelMedium,
    color: Neutrals.gray600,
  },
  chartHighlight: {
    ...Typography.caption,
    color: '#059669',
    fontWeight: '700',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  chartArea: {
    height: 180,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  barColumn: {
    alignItems: 'center',
    width: 40,
  },
  barValue: {
    ...Typography.caption,
    fontSize: 10,
    color: Neutrals.gray400,
    marginBottom: 8,
  },
  barValueActive: {
    color: GoldSystem.primaryGold,
    fontWeight: '800',
  },
  barTrack: {
    width: 24,
    height: 120,
    backgroundColor: Neutrals.gray100,
    borderRadius: Radius.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: Neutrals.obsidian,
    borderRadius: Radius.sm,
  },
  barLabel: {
    ...Typography.caption,
    color: Neutrals.gray600,
    marginTop: 8,
  },
  barLabelActive: {
    color: Neutrals.obsidian,
    fontWeight: '800',
  },
  sectionLink: {
    ...Typography.labelMedium,
    color: GoldSystem.primaryGold,
    marginBottom: 16,
  },
  incomeCard: {
    backgroundColor: Neutrals.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Neutrals.border,
    ...Shadows.soft,
  },
  incomeMain: {
    padding: 20,
    alignItems: 'center',
  },
  incomeLabel: {
    ...Typography.labelMedium,
    color: Neutrals.gray600,
    marginBottom: 4,
  },
  incomeValue: {
    ...Typography.displayMedium,
    color: Neutrals.obsidian,
    marginBottom: 8,
  },
  incomeBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    color: GoldSystem.primaryGold,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.full,
    ...Typography.caption,
    fontWeight: '700',
  },
  incomeDivider: {
    height: 1,
    backgroundColor: Neutrals.border,
  },
  incomeSecondary: {
    flexDirection: 'row',
    padding: 16,
  },
  incomeRow: {
    flex: 1,
    alignItems: 'center',
  },
  incomeSubLabel: {
    ...Typography.caption,
    color: Neutrals.gray600,
    marginBottom: 4,
  },
  incomeSubValue: {
    ...Typography.headlineSmall,
    color: Neutrals.obsidian,
  },
  payoutCard: {
    flexDirection: 'row',
    backgroundColor: Neutrals.surface,
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Neutrals.border,
    alignItems: 'center',
    ...Shadows.soft,
  },
  payoutDateBox: {
    backgroundColor: Neutrals.gray100,
    borderRadius: Radius.md,
    padding: 8,
    alignItems: 'center',
    width: 56,
  },
  payoutDateMonth: {
    ...Typography.caption,
    color: Neutrals.gray600,
    textTransform: 'uppercase',
  },
  payoutDateDay: {
    ...Typography.headlineSmall,
    color: Neutrals.obsidian,
  },
  payoutContent: {
    flex: 1,
    marginLeft: 16,
  },
  payoutTitle: {
    ...Typography.labelMedium,
    color: Neutrals.obsidian,
  },
  payoutSub: {
    ...Typography.caption,
    color: Neutrals.gray600,
    marginTop: 2,
  },
  payoutAmount: {
    ...Typography.labelMedium,
    color: '#059669',
  },
  allocationCard: {
    backgroundColor: Neutrals.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Neutrals.border,
    padding: 16,
    ...Shadows.soft,
  },
  allocationBar: {
    height: 12,
    flexDirection: 'row',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 16,
  },
  allocationSegment: {
    height: '100%',
  },
  allocationLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    ...Typography.caption,
    color: Neutrals.obsidian,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 32,
    marginBottom: 16,
  },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Neutrals.gray100,
    marginRight: 8,
  },
  tabBtnActive: {
    backgroundColor: Neutrals.obsidian,
  },
  tabText: {
    ...Typography.labelMedium,
    color: Neutrals.gray600,
  },
  tabTextActive: {
    color: Neutrals.surface,
  },
  assetList: {
    paddingHorizontal: 20,
  },
  assetCard: {
    backgroundColor: Neutrals.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Neutrals.border,
    marginBottom: 16,
    padding: 16,
    ...Shadows.soft,
  },
  assetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assetImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: Radius.md,
    backgroundColor: Neutrals.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: Neutrals.obsidian,
  },
  assetInfo: {
    flex: 1,
  },
  assetTitle: {
    ...Typography.labelLarge,
    color: Neutrals.obsidian,
    marginBottom: 4,
  },
  assetLoc: {
    ...Typography.caption,
    color: Neutrals.gray600,
    marginBottom: 4,
  },
  assetMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assetMetaText: {
    ...Typography.caption,
    color: Neutrals.gray600,
  },
  assetDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Neutrals.gray400,
    marginHorizontal: 8,
  },
  assetDivider: {
    height: 1,
    backgroundColor: Neutrals.border,
    marginVertical: 16,
  },
  assetFinancials: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  assetFinBox: {
    flex: 1,
  },
  assetFinLabel: {
    ...Typography.caption,
    color: Neutrals.gray600,
    marginBottom: 4,
  },
  assetFinValue: {
    ...Typography.labelMedium,
    color: Neutrals.obsidian,
  },
});
