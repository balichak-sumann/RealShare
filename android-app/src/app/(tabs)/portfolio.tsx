import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { auth } from '@/lib/firebase';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';
import { GuestView } from '@/components/ui/GuestView';
import { TabAnimationWrapper } from '@/components/ui/TabAnimationWrapper';
import { useUser } from '@/contexts/UserContext';
import { AgentClientsScreen } from '@/components/agent/AgentClientsScreen';

export default function PortfolioScreen() {
  const { profile } = useUser();
  if (profile?.role === 'agent') {
    return <AgentClientsScreen />;
  }

  const router = useRouter();
  const params = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState('All');
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const user = auth.currentUser;
        if (!user) { setLoading(false); return; }
        const token = await user.getIdToken();
        const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com'}/api/portfolio`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        // Real investments only — an investor with none genuinely has an
        // empty portfolio, and the UI below has a proper empty state for that.
        setPortfolio(Array.isArray(data.investments) ? data.investments : []);
        setUser(data.user || null);
      } catch (err) {
        console.warn('Failed to fetch portfolio:', err);
        setPortfolio([]);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchPortfolio();
  }, []);

  const handleBack = () => {
    if (params?.from === 'profile') {
      router.push('/profile' as any);
    } else {
      router.back();
    }
  };

  const filteredPortfolio = portfolio.filter(item => {
    if (activeTab === 'All') return true;
    return item.status.toLowerCase() === activeTab.toLowerCase();
  });

  const totalInvestment = portfolio.reduce((acc, curr) => acc + Number(curr.total_amount || 0), 0);
  const walletBalance = Number(user?.wallet_balance || 0);
  const totalNetWorth = totalInvestment + walletBalance;
  
  // Calculate ROI and Earnings from property data
  const totalEstimatedROI = portfolio.reduce((acc, curr) => {
    const yield_pct = Number(curr.property?.assured_yield || 12);
    return acc + (Number(curr.total_amount || 0) * yield_pct / 100);
  }, 0);

  const avgROI = portfolio.length > 0
    ? portfolio.reduce((acc, curr) => acc + Number(curr.property?.assured_yield || 12), 0) / portfolio.length
    : 0;

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={GoldSystem.primaryGold} />
      </View>
    );
  }

  if (!auth.currentUser) {
    return (
      <GuestView 
        title="Wealth Dashboard" 
        description="Sign in to track your net worth, view your passive income yields, and manage your fractional assets." 
        icon="🏦"
      />
    );
  }

  return (
    <TabAnimationWrapper>
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        {params?.from === 'profile' && (
          <TouchableOpacity style={styles.headerIconBtn} onPress={handleBack}>
            <Text style={styles.headerIconText}>←</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Wealth Dashboard</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Net Worth Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View>
                <Text style={styles.heroSubtitle}>Total Net Worth</Text>
                <Text style={styles.heroTitle}>₹ {totalNetWorth.toLocaleString('en-IN')}</Text>
              </View>

            </View>
            
            <View style={styles.heroSplit}>
              <View style={styles.heroSplitItem}>
                <Text style={styles.heroSplitLabel}>Invested Assets</Text>
                <Text style={styles.heroSplitValue}>₹ {totalInvestment.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.heroSplitDivider} />
              <View style={styles.heroSplitItem}>
                <Text style={styles.heroSplitLabel}>Wallet Liquidity</Text>
                <Text style={styles.heroSplitValue}>₹ {walletBalance.toLocaleString('en-IN')}</Text>
              </View>
            </View>

            <View style={styles.heroActions}>
              <TouchableOpacity style={styles.heroBtnOutline} onPress={() => Alert.alert('Action', 'Withdraw flow coming soon.')}>
                <Text style={styles.heroBtnOutlineText}>Withdraw</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.heroBtnSolid} onPress={() => Alert.alert('Action', 'Add Funds flow coming soon.')}>
                <Text style={styles.heroBtnSolidText}>+ Add Funds</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Passive Income Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Passive Income</Text>
          <View style={styles.incomeCard}>
            <View style={styles.incomeMain}>
              <Text style={styles.incomeLabel}>Estimated Annual Yield</Text>
              <Text style={styles.incomeValue}>₹ {totalEstimatedROI.toLocaleString('en-IN')}</Text>
              <Text style={styles.incomeBadge}>+ {avgROI.toFixed(1)}% Avg ROI</Text>
            </View>
            <View style={styles.incomeDivider} />
            <View style={styles.incomeSecondary}>
              <View style={styles.incomeRow}>
                <Text style={styles.incomeSubLabel}>Monthly Payout (Est)</Text>
                <Text style={styles.incomeSubValue}>₹ {Math.round(totalEstimatedROI / 12).toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.incomeRow}>
                <Text style={styles.incomeSubLabel}>Properties Generating Yield</Text>
                <Text style={styles.incomeSubValue}>{portfolio.filter(i => i.status === 'completed' || i.status === 'active').length}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Upcoming Payouts */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Upcoming Payouts</Text>
            <TouchableOpacity onPress={() => Alert.alert('Calendar', 'Full dividend calendar coming soon.')}>
              <Text style={styles.sectionLink}>View Calendar</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.payoutCard}>
            <View style={styles.payoutDateBox}>
              <Text style={styles.payoutDateMonth}>OCT</Text>
              <Text style={styles.payoutDateDay}>01</Text>
            </View>
            <View style={styles.payoutContent}>
              <Text style={styles.payoutTitle}>Quarterly Rental Yield</Text>
              <Text style={styles.payoutSub}>The Obsidian Tower, Mumbai</Text>
            </View>
            <Text style={styles.payoutAmount}>+₹ 42,500</Text>
          </View>
        </View>

        {/* Asset Allocation */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Asset Allocation</Text>
          <View style={styles.allocationCard}>
            <View style={styles.allocationBar}>
              <View style={[styles.allocationSegment, { flex: 6, backgroundColor: GoldSystem.primaryGold }]} />
              <View style={[styles.allocationSegment, { flex: 3, backgroundColor: Neutrals.obsidian }]} />
              <View style={[styles.allocationSegment, { flex: 1, backgroundColor: Neutrals.gray400 }]} />
            </View>
            <View style={styles.allocationLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: GoldSystem.primaryGold }]} />
                <Text style={styles.legendText}>Commercial (60%)</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Neutrals.obsidian }]} />
                <Text style={styles.legendText}>Residential (30%)</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Neutrals.gray400 }]} />
                <Text style={styles.legendText}>Land (10%)</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsRow}>
          {['All Assets', 'Active', 'Completed'].map((tab) => {
            const val = tab === 'All Assets' ? 'All' : tab;
            return (
              <TouchableOpacity 
                key={tab} 
                style={[styles.tabBtn, activeTab === val && styles.tabBtnActive]}
                onPress={() => setActiveTab(val)}
              >
                <Text style={[styles.tabText, activeTab === val && styles.tabTextActive]}>{tab}</Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Fractional Portfolio List */}
        <View style={styles.listContainer}>
          {filteredPortfolio.length === 0 && (
            <Text style={{ textAlign: 'center', marginTop: 40, color: Neutrals.gray500, width: '100%' }}>No assets found in your portfolio.</Text>
          )}
          {filteredPortfolio.map((item) => {
            const propertyROI = Number(item.property?.assured_yield || 12);
            const currentValuation = Number(item.total_amount) * 1.05; // 5% mock appreciation

            return (
              <View key={item.id} style={styles.assetCard}>
                <TouchableOpacity style={styles.assetClickArea} onPress={() => router.push(`/property/${item.property?.id}` as any)}>
                  <Image source={{ uri: item.property?.images?.[0]?.image_url || 'https://via.placeholder.com/200' }} style={styles.assetImage} />
                  <View style={styles.assetContent}>
                    <View style={styles.assetHeader}>
                      <Text style={styles.assetTitle} numberOfLines={1}>{item.property?.title}</Text>
                      <View style={styles.assetBadge}>
                        <Text style={styles.assetBadgeText}>{Number(item.ownership_percentage).toFixed(2)}% OWNED</Text>
                      </View>
                    </View>
                    
                    <Text style={styles.assetLocation}>{item.property?.locality || item.property?.district}</Text>
                    
                    <View style={styles.assetMetrics}>
                      <View style={styles.metricBox}>
                        <Text style={styles.metricLabel}>Current Valuation</Text>
                        <Text style={styles.metricValue}>₹ {currentValuation.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
                      </View>
                      <View style={styles.metricBox}>
                        <Text style={styles.metricLabel}>Yield (ROI)</Text>
                        <Text style={[styles.metricValue, { color: '#059669' }]}>{propertyROI}%</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
                <View style={styles.assetActions}>
                  <TouchableOpacity style={styles.assetActionBtnOutline} onPress={() => Alert.alert('Payment Schedule', 'Payment schedules are coming soon.')}>
                    <Text style={styles.assetActionBtnOutlineText}>Payments</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.assetActionBtnOutline} onPress={() => Alert.alert('Secondary Market', 'Listing process initiated. Our wealth managers will contact you.')}>
                    <Text style={styles.assetActionBtnOutlineText}>List for Sale</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.assetActionBtnSolid} onPress={() => Alert.alert('Documents', 'Downloading ownership certificates...')}>
                    <Text style={styles.assetActionBtnSolidText}>Get Documents</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        {/* Recent Activity */}
        <View style={styles.sectionContainer}>
          <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={() => Alert.alert('Activity', 'Full activity log coming soon.')}>
              <Text style={styles.sectionLink}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.activityCard}>
            <View style={styles.activityItem}>
              <View style={[styles.activityIconBox, { backgroundColor: 'rgba(5, 150, 105, 0.1)' }]}>
                <Text style={styles.activityIcon}>💸</Text>
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Rental Yield Received</Text>
                <Text style={styles.activityDate}>Sep 01, 2026</Text>
              </View>
              <Text style={[styles.activityAmount, { color: '#059669' }]}>+₹ 38,000</Text>
            </View>
            <View style={styles.activityDivider} />
            <View style={styles.activityItem}>
              <View style={[styles.activityIconBox, { backgroundColor: 'rgba(212, 175, 55, 0.1)' }]}>
                <Text style={styles.activityIcon}>🏢</Text>
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Fraction Purchased</Text>
                <Text style={styles.activityDate}>Aug 15, 2026</Text>
              </View>
              <Text style={styles.activityAmount}>-₹ 25,00,000</Text>
            </View>
          </View>
        </View>

        {/* Document Vault */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Document Vault</Text>
          <View style={styles.vaultContainer}>
            <TouchableOpacity style={styles.vaultItem} onPress={() => Alert.alert('Download', 'Downloading FY25 Tax Report...')}>
              <View style={styles.vaultIconBox}><Text style={styles.vaultIcon}>📄</Text></View>
              <Text style={styles.vaultTitle}>FY25 Tax Report</Text>
              <Text style={styles.vaultAction}>Download</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.vaultItem} onPress={() => Alert.alert('Download', 'Downloading Yield Certificate...')}>
              <View style={styles.vaultIconBox}><Text style={styles.vaultIcon}>📜</Text></View>
              <Text style={styles.vaultTitle}>Yield Certificate</Text>
              <Text style={styles.vaultAction}>Download</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Earnings Reports */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Earnings Reports</Text>
          <View style={styles.earningsCard}>
            <View style={styles.earningsHeader}>
              <Text style={styles.earningsHeaderTitle}>Recent Yields</Text>
              <TouchableOpacity onPress={() => Alert.alert('Download', 'Downloading Full Earnings Report...')}>
                <Text style={styles.earningsDownloadText}>↓ Full Report</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.earningsRow}>
              <Text style={styles.earningsCell}>Q3 2026</Text>
              <Text style={styles.earningsCell}>The Obsidian Tower</Text>
              <Text style={[styles.earningsCell, { color: '#059669', textAlign: 'right' }]}>+₹42,500</Text>
            </View>
            <View style={styles.earningsDivider} />
            <View style={styles.earningsRow}>
              <Text style={styles.earningsCell}>Q2 2026</Text>
              <Text style={styles.earningsCell}>Aura IT Park</Text>
              <Text style={[styles.earningsCell, { color: '#059669', textAlign: 'right' }]}>+₹28,750</Text>
            </View>
          </View>
        </View>

        {/* VIP Concierge */}
        <View style={styles.conciergeContainer}>
          <View style={styles.conciergeCard}>
            <View style={styles.conciergeIconBox}>
              <Text style={styles.conciergeIcon}>👔</Text>
            </View>
            <View style={styles.conciergeText}>
              <Text style={styles.conciergeTitle}>VIP Concierge</Text>
              <Text style={styles.conciergeDesc}>Schedule a site visit or chat with your wealth advisor.</Text>
            </View>
            <TouchableOpacity style={styles.conciergeBtn} onPress={() => Alert.alert('Concierge', 'Connecting to your advisor...')}>
              <Text style={styles.conciergeBtnText}>Connect</Text>
            </TouchableOpacity>
          </View>
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
    paddingBottom: 15,
    backgroundColor: Neutrals.surface,
  },
  headerIconBtn: {
    padding: 5,
  },
  headerIconText: {
    fontSize: 24,
    color: Neutrals.obsidian,
  },
  headerTitle: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
  },
  heroSection: {
    padding: 20,
    paddingTop: 10,
  },
  heroCard: {
    backgroundColor: Neutrals.obsidian,
    borderRadius: Radius.xl,
    padding: 24,
    ...Shadows.strong,
  },
  heroSubtitle: {
    ...Typography.labelMedium,
    color: GoldSystem.paleGold,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroTitle: {
    ...Typography.displayLarge,
    color: Neutrals.white,
    marginBottom: 24,
  },
  growthBadge: {
    backgroundColor: 'rgba(5, 150, 105, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.4)',
  },
  growthBadgeText: {
    color: '#34D399',
    ...Typography.labelMedium,
    fontWeight: 'bold',
  },
  heroSplit: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: Radius.lg,
    padding: 16,
    marginBottom: 24,
  },
  heroSplitItem: {
    flex: 1,
  },
  heroSplitDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 16,
  },
  heroSplitLabel: {
    ...Typography.caption,
    color: Neutrals.gray400,
    marginBottom: 4,
  },
  heroSplitValue: {
    ...Typography.headlineMedium,
    color: Neutrals.white,
  },
  heroActions: {
    flexDirection: 'row',
    gap: 12,
  },
  heroBtnOutline: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  heroBtnOutlineText: {
    ...Typography.labelLarge,
    color: Neutrals.white,
  },
  heroBtnSolid: {
    flex: 1,
    backgroundColor: GoldSystem.primaryGold,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  heroBtnSolidText: {
    ...Typography.labelLarge,
    color: Neutrals.obsidian,
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
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
    color: Neutrals.gray500,
    marginBottom: 8,
  },
  incomeValue: {
    ...Typography.displayMedium,
    color: '#059669', // Success Green
    marginBottom: 12,
  },
  incomeBadge: {
    backgroundColor: '#D1FAE5',
    color: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.full,
    ...Typography.caption,
    fontWeight: 'bold',
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
    color: Neutrals.gray500,
    marginBottom: 4,
  },
  incomeSubValue: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
  },
  allocationCard: {
    backgroundColor: Neutrals.surface,
    borderRadius: Radius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: Neutrals.border,
    ...Shadows.soft,
  },
  allocationBar: {
    height: 12,
    flexDirection: 'row',
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginBottom: 20,
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
    marginRight: 8,
  },
  legendText: {
    ...Typography.caption,
    color: Neutrals.gray600,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Neutrals.border,
    marginBottom: 16,
  },
  tabBtn: {
    paddingVertical: 12,
    marginRight: 24,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: GoldSystem.primaryGold,
  },
  tabText: {
    ...Typography.labelMedium,
    color: Neutrals.gray500,
  },
  tabTextActive: {
    color: GoldSystem.primaryGold,
  },
  listContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  assetCard: {
    backgroundColor: Neutrals.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Neutrals.border,
    padding: 12,
    flexDirection: 'column',
    ...Shadows.soft,
  },
  assetImage: {
    width: 90,
    height: 90,
    borderRadius: Radius.md,
    marginRight: 16,
  },
  assetContent: {
    flex: 1,
  },
  assetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  assetTitle: {
    ...Typography.labelLarge,
    color: Neutrals.obsidian,
    flex: 1,
    marginRight: 8,
  },
  assetBadge: {
    backgroundColor: GoldSystem.paleGold,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  assetBadgeText: {
    ...Typography.caption,
    color: GoldSystem.darkGold,
    fontSize: 10,
    fontWeight: 'bold',
  },
  assetLocation: {
    ...Typography.bodyMedium,
    color: Neutrals.gray500,
    marginBottom: 12,
  },
  assetMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricBox: {
    flex: 1,
  },
  metricLabel: {
    ...Typography.caption,
    color: Neutrals.gray500,
    marginBottom: 2,
  },
  metricValue: {
    ...Typography.labelLarge,
    color: Neutrals.obsidian,
  },
  conciergeContainer: {
    padding: 20,
    marginTop: 16,
  },
  conciergeCard: {
    backgroundColor: Neutrals.obsidian,
    borderRadius: Radius.lg,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadows.medium,
  },
  conciergeIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  conciergeIcon: {
    fontSize: 24,
  },
  conciergeText: {
    flex: 1,
    marginRight: 16,
  },
  conciergeTitle: {
    ...Typography.labelLarge,
    color: Neutrals.white,
    marginBottom: 4,
  },
  conciergeDesc: {
    ...Typography.caption,
    color: Neutrals.gray400,
  },
  conciergeBtn: {
    backgroundColor: GoldSystem.primaryGold,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  conciergeBtnText: {
    ...Typography.labelMedium,
    color: Neutrals.obsidian,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  sectionLink: {
    ...Typography.labelMedium,
    color: GoldSystem.primaryGold,
  },
  payoutCard: {
    backgroundColor: Neutrals.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Neutrals.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadows.soft,
  },
  payoutDateBox: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderRadius: Radius.md,
    padding: 10,
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  payoutDateMonth: {
    ...Typography.caption,
    color: GoldSystem.primaryGold,
    fontWeight: 'bold',
  },
  payoutDateDay: {
    ...Typography.labelLarge,
    color: Neutrals.obsidian,
    fontSize: 18,
  },
  payoutContent: {
    flex: 1,
  },
  payoutTitle: {
    ...Typography.labelLarge,
    color: Neutrals.obsidian,
    marginBottom: 2,
  },
  payoutSub: {
    ...Typography.caption,
    color: Neutrals.gray500,
  },
  payoutAmount: {
    ...Typography.headlineMedium,
    color: '#059669',
  },
  assetClickArea: {
    flexDirection: 'row',
  },
  assetActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Neutrals.border,
    marginTop: 12,
    paddingTop: 12,
    gap: 8,
    width: '100%',
  },
  assetActionBtnOutline: {
    flex: 1,
    borderWidth: 1,
    borderColor: Neutrals.border,
    borderRadius: Radius.sm,
    paddingVertical: 10,
    alignItems: 'center',
  },
  assetActionBtnOutlineText: {
    ...Typography.labelMedium,
    color: Neutrals.obsidian,
  },
  assetActionBtnSolid: {
    flex: 1,
    backgroundColor: Neutrals.obsidian,
    borderRadius: Radius.sm,
    paddingVertical: 10,
    alignItems: 'center',
  },
  assetActionBtnSolidText: {
    ...Typography.labelMedium,
    color: Neutrals.white,
  },
  activityCard: {
    backgroundColor: Neutrals.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Neutrals.border,
    ...Shadows.soft,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  activityDivider: {
    height: 1,
    backgroundColor: Neutrals.border,
    marginLeft: 64, // Align with content, bypassing icon
  },
  activityIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  activityIcon: {
    fontSize: 18,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    ...Typography.labelLarge,
    color: Neutrals.obsidian,
    marginBottom: 2,
  },
  activityDate: {
    ...Typography.caption,
    color: Neutrals.gray500,
  },
  activityAmount: {
    ...Typography.labelLarge,
    color: Neutrals.obsidian,
  },
  vaultContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  vaultItem: {
    flex: 1,
    backgroundColor: Neutrals.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Neutrals.border,
    padding: 16,
    alignItems: 'center',
    ...Shadows.soft,
  },
  vaultIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Neutrals.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  vaultIcon: {
    fontSize: 24,
  },
  vaultTitle: {
    ...Typography.labelMedium,
    color: Neutrals.obsidian,
    textAlign: 'center',
    marginBottom: 8,
  },
  vaultAction: {
    ...Typography.labelMedium,
    color: GoldSystem.primaryGold,
  },
  earningsCard: {
    backgroundColor: Neutrals.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Neutrals.border,
    padding: 16,
    ...Shadows.soft,
  },
  earningsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  earningsHeaderTitle: {
    ...Typography.labelMedium,
    color: Neutrals.obsidian,
  },
  earningsDownloadText: {
    ...Typography.labelMedium,
    color: GoldSystem.primaryGold,
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  earningsCell: {
    ...Typography.caption,
    color: Neutrals.obsidian,
    flex: 1,
  },
  earningsDivider: {
    height: 1,
    backgroundColor: Neutrals.border,
    marginVertical: 4,
  }
});
