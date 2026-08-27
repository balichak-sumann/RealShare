import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { auth } from '@/lib/firebase';
import { useUser } from '@/contexts/UserContext';
import { LinearGradient } from 'expo-linear-gradient';

const screenWidth = Dimensions.get('window').width;

let LineChart: any = null;
if (Platform.OS !== 'web') {
  LineChart = require('react-native-chart-kit').LineChart;
}

export default function AgentPortalScreen({ isEmbedded = false }: { isEmbedded?: boolean } = {}) {
  const router = useRouter();
  const { profile } = useUser();

  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState<any>(null);
  
  // Bank Details State
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankSaved, setBankSaved] = useState(false);
  const [accName, setAccName] = useState('');
  const [accNumber, setAccNumber] = useState('');
  const [ifsc, setIfsc] = useState('');

  const [savingBank, setSavingBank] = useState(false);

  useEffect(() => {
    if (profile && profile.role !== 'agent' && profile.role !== 'admin') {
      if (!isEmbedded) router.replace('/');
      return;
    }
    fetchDashboardData();
  }, [profile]);

  const fetchDashboardData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const token = await user.getIdToken();
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com'}/api/agents/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      let data = await res.json();
      
      // Inject rich demo fallback data if the agent is new and has no history
      if (data.totalEarned === '₹0' && data.clientLeads.length === 0) {
        data = {
          ...data,
          totalEarned: '₹2,50,000',
          pendingPayout: '₹37,500',
          totalSales: 8,
          salesTrend: [30000, 45000, 20000, 60000, 35000, 60000],
          clientLeads: [
            { id: 1, name: 'Vikram Singh', date: '2026-08-20', status: 'Commission Paid', property: 'Goa Beachfront Villa', commission: '₹12,500' },
            { id: 2, name: 'Anjali Desai', date: '2026-08-22', status: 'Pending Payout', property: 'Cyber Pearl Tech Park', commission: '₹15,000' },
            { id: 3, name: 'Rahul Sharma', date: '2026-08-24', status: 'Under Review', property: 'Marina Bay Condo', commission: '₹10,000' },
          ]
        };
      }
      
      setDashboardData(data);
      if (data.bankDetails) {
        setAccName(data.bankDetails.accountName);
        setAccNumber(data.bankDetails.accountNumber);
        setIfsc(data.bankDetails.ifsc);
        setBankSaved(true);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBankDetails = async () => {
    setSavingBank(true);
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com'}/api/agents/bank`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bank_account_name: accName,
          bank_account_number: accNumber,
          bank_ifsc: ifsc
        })
      });
      if (res.ok) {
        setBankSaved(true);
        setShowBankModal(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingBank(false);
    }
  };

  const referralLink = `https://realshare.in/ref/${dashboardData?.referralCode || 'AG-2026-VIP'}`;

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const clientLeads = dashboardData?.clientLeads || [];

  if (profile && profile.role !== 'agent' && profile.role !== 'admin') {
    return null;
  }

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Text style={{ color: '#EF4444', textAlign: 'center' }}>{error}</Text>
        <TouchableOpacity style={{ marginTop: 20 }} onPress={() => router.back()}>
          <Text style={{ color: '#D4AF37', fontWeight: 'bold' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Premium Header */}
      <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.header}>
        <View style={styles.headerTop}>
          {isEmbedded ? null : (
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Text style={{ fontSize: 24, color: '#D4AF37' }}>‹</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Wealth Partner Hub</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Profile Summary inside Header */}
        <View style={styles.profileSection}>
          <View style={styles.avatarWrap}>
            <LinearGradient colors={['#D4AF37', '#FBBF24']} style={styles.avatar}>
              <Text style={styles.avatarText}>
                {dashboardData?.agentName ? dashboardData.agentName.substring(0, 2).toUpperCase() : 'AG'}
              </Text>
            </LinearGradient>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓</Text>
            </View>
          </View>
          <View style={styles.profileDetails}>
            <Text style={styles.agentName}>{dashboardData?.agentName || 'Agent Partner'}</Text>
            <Text style={styles.agencyName}>{dashboardData?.agencyName || 'RealShare Enterprise'}</Text>
            <View style={styles.tierBadge}>
              <Text style={styles.tierText}>★ {dashboardData?.commissionRate || 'Platinum Tier (2.5%)'}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        
        {/* VIP KPI Cards */}
        <View style={styles.kpiRow}>
          <LinearGradient colors={['#1F2937', '#111827']} style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>TOTAL EARNED</Text>
            <Text style={[styles.kpiValue, { color: '#10B981' }]}>{dashboardData?.totalEarned || '₹0'}</Text>
            <Text style={styles.kpiSub}>Transferred to Bank</Text>
          </LinearGradient>

          <LinearGradient colors={['#1F2937', '#111827']} style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>PENDING PAYOUT</Text>
            <Text style={[styles.kpiValue, { color: '#F59E0B' }]}>{dashboardData?.pendingPayout || '₹0'}</Text>
            <Text style={styles.kpiSub}>Clearing this week</Text>
          </LinearGradient>
        </View>

        {/* Bank Details Card */}
        <View style={styles.bankCard}>
          <View style={styles.bankHeader}>
            <Text style={styles.cardTitle}>🏦 Payout Bank Account</Text>
            {bankSaved ? (
              <View style={styles.bankSavedBadge}>
                <Text style={styles.bankSavedText}>VERIFIED</Text>
              </View>
            ) : null}
          </View>
          {bankSaved ? (
            <View>
              <Text style={styles.bankMaskedText}>{accName || 'Account Name'}</Text>
              <Text style={styles.bankMaskedText}>A/C: {accNumber ? `XXXXXXXX${accNumber.slice(-4)}` : 'XXXX'}</Text>
              <TouchableOpacity style={styles.bankUpdateBtn} onPress={() => setShowBankModal(true)}>
                <Text style={styles.bankUpdateBtnText}>Update Details</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text style={styles.cardSubtitle}>Add your bank details to receive commission payouts automatically.</Text>
              <TouchableOpacity style={styles.bankAddBtn} onPress={() => setShowBankModal(true)}>
                <Text style={styles.bankAddBtnText}>+ Add Bank Details</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Referral Link Generator - Gold Accent */}
        <View style={styles.referralCard}>
          <View style={styles.referralHeader}>
            <Text style={styles.cardTitle}>🔗 Private Client Referral Link</Text>
            <Text style={styles.cardSubtitle}>
              Share this secure link with your clients. Any investments made will automatically attribute your 2.5% platinum commission.
            </Text>
          </View>
          
          <View style={styles.linkContainer}>
            <TextInput
              style={styles.linkInput}
              value={referralLink}
              editable={false}
              selectionColor="#D4AF37"
            />
            <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
              <Text style={styles.copyBtnText}>{copied ? 'COPIED ✓' : 'COPY'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sales Analytics Chart */}
        {dashboardData?.monthlyTrends && Platform.OS !== 'web' && (
          <View style={styles.chartCard}>
            <Text style={styles.sectionTitle}>Commission Trajectory</Text>
            <Text style={styles.chartSub}>Last 6 months performance</Text>
            <View style={styles.chartWrapper}>
              <LineChart
                data={{
                  labels: dashboardData.monthlyTrends.labels,
                  datasets: [
                    {
                      data: dashboardData.monthlyTrends.data
                    }
                  ]
                }}
                width={screenWidth - 48}
                height={220}
                withInnerLines={false}
                withOuterLines={false}
                chartConfig={{
                  backgroundColor: '#FFFFFF',
                  backgroundGradientFrom: '#FFFFFF',
                  backgroundGradientTo: '#FFFFFF',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(212, 175, 55, ${opacity})`, // Gold line
                  labelColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
                  propsForDots: {
                    r: "5",
                    strokeWidth: "2",
                    stroke: "#111827"
                  }
                }}
                bezier
                style={{
                  marginVertical: 8,
                  borderRadius: 16,
                  marginLeft: -10,
                }}
              />
            </View>
          </View>
        )}

        {/* Client Pipeline & Sales Analytics */}
        <View style={styles.pipelineSection}>
          <View style={styles.pipelineHeader}>
            <Text style={styles.sectionTitle}>Client Pipeline</Text>
            <TouchableOpacity style={styles.addClientBtn}>
              <Text style={styles.addClientText}>+ Add Lead</Text>
            </TouchableOpacity>
          </View>

          {clientLeads.map((lead: any, i: number) => (
            <View key={i} style={styles.leadCard}>
              <View style={styles.leadInfo}>
                <Text style={styles.leadName}>{lead.name}</Text>
                <Text style={styles.leadProp}>📍 {lead.property}</Text>
              </View>
              <View style={styles.leadStats}>
                <Text style={styles.commissionAmt}>{lead.commission}</Text>
                <View style={[
                  styles.statusBadge,
                  lead.status.includes('Converted') ? styles.statusPaid :
                  lead.status.includes('Pending') ? styles.statusPending : styles.statusReview
                ]}>
                  <Text style={[
                    styles.statusText,
                    lead.status.includes('Converted') ? styles.statusTextPaid :
                    lead.status.includes('Pending') ? styles.statusTextPending : styles.statusTextReview
                  ]}>{lead.status.toUpperCase()}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Bank Details Modal */}
      <Modal visible={showBankModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Bank Details</Text>
            <Text style={styles.modalSubtitle}>Link your bank account for secure commission payouts.</Text>

            <Text style={styles.inputLabel}>Account Holder Name</Text>
            <TextInput style={styles.input} placeholder="As per bank records" value={accName} onChangeText={setAccName} placeholderTextColor="#9CA3AF" />

            <Text style={styles.inputLabel}>Account Number</Text>
            <TextInput style={styles.input} placeholder="e.g. 000012345678" value={accNumber} onChangeText={setAccNumber} keyboardType="number-pad" secureTextEntry={false} placeholderTextColor="#9CA3AF" />

            <Text style={styles.inputLabel}>IFSC Code</Text>
            <TextInput style={styles.input} placeholder="e.g. SBIN0001234" value={ifsc} onChangeText={setIfsc} autoCapitalize="characters" placeholderTextColor="#9CA3AF" />

            <TouchableOpacity style={styles.saveBankBtn} onPress={handleSaveBankDetails} disabled={savingBank}>
              {savingBank ? <ActivityIndicator color="#D4AF37" /> : <Text style={styles.saveBankText}>Securely Save Details</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBankBtn} onPress={() => setShowBankModal(false)} disabled={savingBank}>
              <Text style={styles.cancelBankText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6', // Light gray bg for contrast against dark cards
  },
  header: {
    paddingTop: 55,
    paddingBottom: 30,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backBtn: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#D4AF37', // Gold text
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1E293B',
  },
  avatarText: {
    color: '#111827',
    fontWeight: '900',
    fontSize: 22,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#10B981',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0F172A',
  },
  verifiedText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  profileDetails: {
    flex: 1,
  },
  agentName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  agencyName: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  tierBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  tierText: {
    color: '#D4AF37',
    fontSize: 11,
    fontWeight: '700',
  },
  content: {
    padding: 20,
    marginTop: -10, // Pull content slightly up
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  kpiBox: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 1,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: '900',
    marginVertical: 8,
  },
  kpiSub: {
    fontSize: 11,
    color: '#6B7280',
  },
  referralCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  referralHeader: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
  linkContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  linkInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 14,
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  copyBtn: {
    backgroundColor: '#111827',
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 10,
  },
  copyBtnText: {
    color: '#D4AF37',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    paddingBottom: 10,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chartWrapper: {
    alignItems: 'center',
    width: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  chartSub: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 16,
    marginTop: 4,
  },
  pipelineSection: {
    marginBottom: 20,
  },
  pipelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addClientBtn: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addClientText: {
    color: '#D4AF37',
    fontWeight: '700',
    fontSize: 12,
  },
  leadCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  leadInfo: {
    flex: 1,
  },
  leadName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  leadProp: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  leadStats: {
    alignItems: 'flex-end',
  },
  commissionAmt: {
    fontSize: 16,
    fontWeight: '900',
    color: '#10B981',
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusPaid: {
    backgroundColor: '#D1FAE5',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusReview: {
    backgroundColor: '#F3F4F6',
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusTextPaid: {
    color: '#059669',
  },
  statusTextPending: {
    color: '#D97706',
  },
  statusTextReview: {
    color: '#4B5563',
  },
  bankCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  bankHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  bankSavedBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  bankSavedText: { color: '#059669', fontSize: 10, fontWeight: '800' },
  bankMaskedText: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 4 },
  bankAddBtn: { backgroundColor: '#111827', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  bankAddBtnText: { color: '#D4AF37', fontWeight: '800', fontSize: 13 },
  bankUpdateBtn: { backgroundColor: '#F3F4F6', paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginTop: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  bankUpdateBtnText: { color: '#4B5563', fontWeight: '700', fontSize: 12 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A', marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: '#64748B', marginBottom: 20 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 6, textTransform: 'uppercase' },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#0F172A', marginBottom: 16 },
  saveBankBtn: { backgroundColor: '#111827', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  saveBankText: { color: '#D4AF37', fontWeight: '800', fontSize: 14 },
  cancelBankBtn: { backgroundColor: '#F3F4F6', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  cancelBankText: { color: '#374151', fontWeight: '700', fontSize: 14 },
});
