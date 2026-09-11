import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Platform,
  ActivityIndicator
} from 'react-native';
import { TabAnimationWrapper } from '@/components/ui/TabAnimationWrapper';
import { auth } from '@/lib/firebase';
import { getApiUrl } from '@/lib/api';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export function AgentClientsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('All');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPayouts, setShowPayouts] = useState(false);

  React.useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      const res = await fetch(`${getApiUrl()}/api/agents/dashboard`, {
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

  const parseCurrency = (val: any) => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') return Number(val.replace(/[^0-9.-]+/g, '')) || 0;
    return 0;
  };

  const totalCommissionEarned = parseCurrency(dashboardData?.totalEarned);
  const pendingCommission = parseCurrency(dashboardData?.pendingPayout);
  const totalCommission = totalCommissionEarned + pendingCommission;
  
  // Assuming 2.5% commission, total investment is commission * 40
  const totalClientInvestments = totalCommission > 0 ? totalCommission * 40 : 0;

  // Real monthly commission trend from the backend
  const monthlyTrends = dashboardData?.monthlyTrends || { labels: [], data: [] };
  const trendMax = Math.max(1, ...(monthlyTrends.data || [0]));
  const trendMonths = (monthlyTrends.labels || []).map((label: string, i: number) => ({
    month: label,
    amount: monthlyTrends.data?.[i] || 0,
    active: i === (monthlyTrends.labels?.length || 1) - 1,
  }));
  const lastMonthAmt = monthlyTrends.data?.[monthlyTrends.data.length - 1] || 0;
  const prevMonthAmt = monthlyTrends.data?.[monthlyTrends.data.length - 2] || 0;
  const growthPercent = prevMonthAmt > 0 ? Math.round(((lastMonthAmt - prevMonthAmt) / prevMonthAmt) * 100) : null;

  // Real client pipeline breakdown from actual lead statuses
  const pipelineTotal = clientLeads.length;
  const activeCount = clientLeads.filter((c: any) => c.status === 'Commission Paid').length;
  const pendingCount = clientLeads.filter((c: any) => c.status === 'Pending Payout').length;
  const leadsCount = pipelineTotal - activeCount - pendingCount;

  return (
    <TabAnimationWrapper>
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Agent Console</Text>
        <TouchableOpacity style={styles.notificationBtn}>
          <Ionicons name="notifications-outline" size={24} color={Neutrals.obsidian} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* ─── EARNINGS HERO CARD ─── */}
        <View style={styles.heroSection}>
          <View style={styles.heroCard}>
            {/* Decorative BG element */}
            <View style={styles.heroBgCircle} />
            
            <View style={styles.heroTopRow}>
              <View>
                <Text style={styles.heroSubtitle}>TOTAL COMMISSION EARNED</Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 4 }}>
                  <Text style={styles.currencySymbol}>₹</Text>
                  <Text style={styles.heroTitle}>{totalCommission.toLocaleString('en-IN')}</Text>
                </View>
              </View>
              {growthPercent !== null && (
                <View style={styles.growthBadge}>
                  <Ionicons name={growthPercent >= 0 ? "trending-up" : "trending-down"} size={14} color="#10B981" />
                  <Text style={styles.growthBadgeText}>{growthPercent}%</Text>
                </View>
              )}
            </View>
            
            <View style={styles.heroSplit}>
              <View style={styles.heroSplitItem}>
                <Text style={styles.heroSplitLabel}>Paid Out</Text>
                <Text style={styles.heroSplitValue}>₹ {totalCommissionEarned.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.heroSplitDivider} />
              <View style={styles.heroSplitItem}>
                <Text style={styles.heroSplitLabel}>Pending</Text>
                <Text style={[styles.heroSplitValue, { color: GoldSystem.primaryGold }]}>₹ {pendingCommission.toLocaleString('en-IN')}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.heroBtnSolid} onPress={() => setShowPayouts(true)} activeOpacity={0.8}>
              <Ionicons name="receipt-outline" size={18} color={Neutrals.obsidian} style={{ marginRight: 8 }} />
              <Text style={styles.heroBtnSolidText}>View Payout Ledger</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── QUICK METRICS ROW ─── */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <View style={[styles.metricIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
              <Ionicons name="people" size={20} color="#3B82F6" />
            </View>
            <Text style={styles.metricValue}>{pipelineTotal}</Text>
            <Text style={styles.metricLabel}>Total Clients</Text>
          </View>
          <View style={styles.metricCard}>
            <View style={[styles.metricIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            </View>
            <Text style={styles.metricValue}>{activeCount}</Text>
            <Text style={styles.metricLabel}>Closed Deals</Text>
          </View>
          <View style={styles.metricCard}>
            <View style={[styles.metricIconBox, { backgroundColor: 'rgba(217, 119, 6, 0.1)' }]}>
              <Ionicons name="time" size={20} color="#D97706" />
            </View>
            <Text style={styles.metricValue}>{pendingCount}</Text>
            <Text style={styles.metricLabel}>In Pipeline</Text>
          </View>
        </View>

        {/* ─── SALES TRENDS ─── */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Sales Trends</Text>
          </View>
          <View style={styles.chartCard}>
            <Text style={styles.chartSubtitle}>Monthly Commissions (Last 6 Mos)</Text>
            <View style={styles.chartArea}>
              {trendMonths.length === 0 ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: Neutrals.gray400, ...Typography.bodyMedium }}>No commission history yet.</Text>
                </View>
              ) : (
                trendMonths.map((data: any, index: number) => {
                  const barHeight = Math.max(10, Math.round((data.amount / trendMax) * 100));
                  return (
                    <View key={index} style={styles.barColumn}>
                      <Text style={[styles.barValue, data.active && styles.barValueActive]}>
                        {data.amount >= 1000 ? `₹${(data.amount / 1000).toFixed(1)}k` : `₹${data.amount}`}
                      </Text>
                      <View style={styles.barTrack}>
                        <View style={[
                          styles.barFill,
                          { height: `${barHeight}%` },
                          data.active && { backgroundColor: GoldSystem.primaryGold }
                        ]} />
                      </View>
                      <Text style={[styles.barLabel, data.active && styles.barLabelActive]}>{data.month}</Text>
                    </View>
                  );
                })
              )}
            </View>
          </View>
        </View>

        {/* ─── CLIENT CRM LIST ─── */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>My Clients</Text>
            <TouchableOpacity onPress={() => router.push('/clients' as any)}>
              <Text style={styles.sectionLink}>+ Add Lead</Text>
            </TouchableOpacity>
          </View>

          {/* CRM Tabs */}
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

          {/* List */}
          {loading ? (
            <ActivityIndicator size="large" color={GoldSystem.primaryGold} style={{ marginTop: 40 }} />
          ) : filteredClients.length === 0 ? (
            <View style={styles.emptyStateBox}>
              <Ionicons name="folder-open-outline" size={48} color={Neutrals.gray300} style={{ marginBottom: 16 }} />
              <Text style={styles.emptyStateTitle}>No clients found.</Text>
              <Text style={styles.emptyStateSub}>When you pitch properties to leads, they will appear here in your CRM.</Text>
            </View>
          ) : (
            filteredClients.map((client: any, idx: number) => {
              const isPaid = client.status === 'Commission Paid';
              const isPending = client.status === 'Pending Payout' || client.status === 'Under Review';
              const statusColor = isPaid ? '#10B981' : isPending ? '#D97706' : Neutrals.gray500;
              const statusBg = isPaid ? 'rgba(16, 185, 129, 0.1)' : isPending ? 'rgba(217, 119, 6, 0.1)' : Neutrals.gray100;

              return (
                <View key={client.id || idx} style={styles.crmCard}>
                  <View style={styles.crmHeader}>
                    <View style={styles.crmAvatar}>
                      <Text style={styles.crmAvatarText}>{client.name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={styles.crmInfo}>
                      <Text style={styles.crmName}>{client.name}</Text>
                      <Text style={styles.crmProperty} numberOfLines={1}>{client.property}</Text>
                    </View>
                    <View style={[styles.crmStatusBadge, { backgroundColor: statusBg }]}>
                      <Text style={[styles.crmStatusText, { color: statusColor }]}>{client.status}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.crmDivider} />
                  
                  <View style={styles.crmFooter}>
                    <View style={styles.crmStat}>
                      <Text style={styles.crmStatLabel}>Fractions</Text>
                      <Text style={styles.crmStatValue}>{client.fractions}</Text>
                    </View>
                    <View style={styles.crmStat}>
                      <Text style={styles.crmStatLabel}>Earned</Text>
                      <Text style={[styles.crmStatValue, isPaid && { color: '#10B981' }]}>{client.commission}</Text>
                    </View>
                    <TouchableOpacity style={styles.crmChatBtn} onPress={() => Alert.alert('Chat', `Open chat with ${client.name}`)}>
                      <Ionicons name="chatbubble-ellipses" size={16} color={GoldSystem.primaryGold} style={{ marginRight: 6 }} />
                      <Text style={styles.crmChatText}>Message</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>

      </ScrollView>

      {/* Payout History Modal */}
      <Modal visible={showPayouts} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowPayouts(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Payout Ledger</Text>
            <TouchableOpacity onPress={() => setShowPayouts(false)} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={24} color={Neutrals.obsidian} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            <View style={styles.emptyLedgerCard}>
              <Text style={{ fontSize: 48, marginBottom: 16 }}>🧾</Text>
              <Text style={styles.emptyLedgerTitle}>No Payouts Yet</Text>
              <Text style={styles.emptyLedgerSub}>
                Your payout history ledger will appear here automatically once your pending commissions are cleared and deposited into your verified bank account.
              </Text>
            </View>
          </ScrollView>
        </View>
      </Modal>

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
    paddingTop: Platform.OS === 'web' ? 24 : 60,
    paddingBottom: 16,
    backgroundColor: Neutrals.surface,
  },
  headerTitle: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
  },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Neutrals.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  heroCard: {
    backgroundColor: Neutrals.obsidian,
    borderRadius: Radius.xl,
    padding: 24,
    overflow: 'hidden',
    ...Shadows.strong,
  },
  heroBgCircle: {
    position: 'absolute',
    top: -50,
    right: -20,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroSubtitle: {
    ...Typography.caption,
    color: GoldSystem.paleGold,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  currencySymbol: {
    ...Typography.headlineMedium,
    color: Neutrals.gray300,
    marginRight: 4,
  },
  heroTitle: {
    ...Typography.displayLarge,
    color: Neutrals.surface,
    fontSize: 36,
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  growthBadgeText: {
    ...Typography.caption,
    color: '#10B981',
    fontWeight: '800',
    marginLeft: 4,
  },
  heroSplit: {
    flexDirection: 'row',
    marginTop: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
    marginBottom: 6,
  },
  heroSplitValue: {
    ...Typography.headlineMedium,
    color: Neutrals.surface,
  },
  heroBtnSolid: {
    flexDirection: 'row',
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: Radius.md,
    backgroundColor: GoldSystem.primaryGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBtnSolidText: {
    ...Typography.labelMedium,
    color: Neutrals.obsidian,
  },
  metricsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    backgroundColor: Neutrals.surface,
    borderRadius: Radius.lg,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Neutrals.border,
    ...Shadows.soft,
  },
  metricIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  metricValue: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
    marginBottom: 4,
  },
  metricLabel: {
    ...Typography.caption,
    color: Neutrals.gray500,
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
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
  },
  sectionLink: {
    ...Typography.labelMedium,
    color: GoldSystem.primaryGold,
  },
  chartCard: {
    backgroundColor: Neutrals.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Neutrals.border,
    padding: 20,
    ...Shadows.soft,
  },
  chartSubtitle: {
    ...Typography.caption,
    color: Neutrals.gray500,
    marginBottom: 24,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  chartArea: {
    height: 160,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  barColumn: {
    alignItems: 'center',
    width: 44,
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
    width: 32,
    height: 100,
    backgroundColor: Neutrals.gray100,
    borderRadius: Radius.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: Neutrals.obsidian,
    borderTopLeftRadius: Radius.sm,
    borderTopRightRadius: Radius.sm,
  },
  barLabel: {
    ...Typography.caption,
    color: Neutrals.gray500,
    marginTop: 8,
  },
  barLabelActive: {
    color: Neutrals.obsidian,
    fontWeight: '800',
  },
  tabsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Neutrals.surface,
    borderWidth: 1,
    borderColor: Neutrals.border,
    marginRight: 8,
  },
  tabBtnActive: {
    backgroundColor: Neutrals.obsidian,
    borderColor: Neutrals.obsidian,
  },
  tabText: {
    ...Typography.labelMedium,
    color: Neutrals.gray600,
  },
  tabTextActive: {
    color: Neutrals.surface,
  },
  crmCard: {
    backgroundColor: Neutrals.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Neutrals.border,
    marginBottom: 12,
    ...Shadows.soft,
  },
  crmHeader: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  crmAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Neutrals.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: Neutrals.border,
  },
  crmAvatarText: {
    ...Typography.headlineMedium,
    color: Neutrals.gray600,
  },
  crmInfo: {
    flex: 1,
  },
  crmName: {
    ...Typography.labelLarge,
    color: Neutrals.obsidian,
    marginBottom: 2,
  },
  crmProperty: {
    ...Typography.caption,
    color: Neutrals.gray500,
  },
  crmStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  crmStatusText: {
    ...Typography.caption,
    fontWeight: '700',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  crmDivider: {
    height: 1,
    backgroundColor: Neutrals.border,
  },
  crmFooter: {
    flexDirection: 'row',
    padding: 12,
    paddingHorizontal: 16,
    backgroundColor: Neutrals.gray100,
    borderBottomLeftRadius: Radius.lg,
    borderBottomRightRadius: Radius.lg,
    alignItems: 'center',
  },
  crmStat: {
    flex: 1,
  },
  crmStatLabel: {
    ...Typography.caption,
    color: Neutrals.gray500,
    fontSize: 10,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  crmStatValue: {
    ...Typography.labelMedium,
    color: Neutrals.obsidian,
  },
  crmChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Neutrals.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Neutrals.border,
  },
  crmChatText: {
    ...Typography.labelMedium,
    color: Neutrals.obsidian,
  },
  emptyStateBox: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: Neutrals.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Neutrals.border,
    borderStyle: 'dashed',
    marginTop: 16,
  },
  emptyStateTitle: {
    ...Typography.labelLarge,
    color: Neutrals.obsidian,
    marginBottom: 8,
  },
  emptyStateSub: {
    ...Typography.bodyMedium,
    color: Neutrals.gray500,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Neutrals.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: Platform.OS === 'web' ? 24 : 60,
    borderBottomWidth: 1,
    borderColor: Neutrals.border,
    backgroundColor: Neutrals.surface,
  },
  modalTitle: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
  },
  modalCloseBtn: {
    padding: 8,
    backgroundColor: Neutrals.gray100,
    borderRadius: 20,
  },
  modalBody: {
    padding: 20,
  },
  emptyLedgerCard: {
    backgroundColor: Neutrals.surface,
    borderRadius: Radius.lg,
    padding: 32,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: Neutrals.border,
    ...Shadows.soft,
  },
  emptyLedgerTitle: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
    marginBottom: 12,
  },
  emptyLedgerSub: {
    ...Typography.bodyMedium,
    color: Neutrals.gray500,
    textAlign: 'center',
    lineHeight: 22,
  },
});
