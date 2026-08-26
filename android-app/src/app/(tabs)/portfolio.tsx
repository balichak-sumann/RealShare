import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { auth } from '@/lib/firebase';

export default function PortfolioScreen() {
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
        if (!user) return;
        const token = await user.getIdToken();
        const res = await fetch('https://realshare-5l24.onrender.com/api/portfolio', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.investments) setPortfolio(data.investments);
        if (data.user) setUser(data.user);
      } catch (err) {
        console.error('Failed to fetch portfolio:', err);
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
        <ActivityIndicator size="large" color="#1A56DB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={handleBack}>
          <Text style={styles.headerIconText}>&lt;</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Investments</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Top Summary Cards - Row 1 */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Investment</Text>
            <Text style={styles.summaryValue}>₹ {totalInvestment.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Wallet Balance</Text>
            <Text style={styles.summaryValue}>₹ {Number(user?.wallet_balance || 0).toLocaleString('en-IN')}</Text>
          </View>
        </View>

        {/* Summary Cards - Row 2: ROI & Earnings */}
        <View style={[styles.summaryRow, { paddingTop: 0 }]}>
          <View style={[styles.summaryCard, { backgroundColor: '#D1FAE5', borderColor: '#A7F3D0' }]}>
            <Text style={styles.summaryLabel}>Average ROI</Text>
            <Text style={[styles.summaryValue, { color: '#059669' }]}>{avgROI.toFixed(1)}%</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
            <Text style={styles.summaryLabel}>Est. Annual Earnings</Text>
            <Text style={[styles.summaryValue, { color: '#D97706' }]}>₹ {totalEstimatedROI.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        {/* Earnings Report Section */}
        <View style={styles.earningsSection}>
          <Text style={styles.earningsSectionTitle}>📊 Earnings Report</Text>
          <View style={styles.earningsCard}>
            <View style={styles.earningsRow}>
              <Text style={styles.earningsLabel}>Total Properties</Text>
              <Text style={styles.earningsValue}>{portfolio.length}</Text>
            </View>
            <View style={styles.earningsDivider} />
            <View style={styles.earningsRow}>
              <Text style={styles.earningsLabel}>Active Investments</Text>
              <Text style={[styles.earningsValue, { color: '#059669' }]}>
                {portfolio.filter(i => i.status === 'completed' || i.status === 'active').length}
              </Text>
            </View>
            <View style={styles.earningsDivider} />
            <View style={styles.earningsRow}>
              <Text style={styles.earningsLabel}>Total Invested</Text>
              <Text style={styles.earningsValue}>₹ {totalInvestment.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.earningsDivider} />
            <View style={styles.earningsRow}>
              <Text style={styles.earningsLabel}>Est. Monthly Income</Text>
              <Text style={[styles.earningsValue, { color: '#1A56DB' }]}>₹ {Math.round(totalEstimatedROI / 12).toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.earningsDivider} />
            <View style={styles.earningsRow}>
              <Text style={styles.earningsLabel}>Est. Annual Income</Text>
              <Text style={[styles.earningsValue, { color: '#D97706' }]}>₹ {totalEstimatedROI.toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsRow}>
          {['All', 'Active', 'Completed'].map((tab) => (
            <TouchableOpacity 
              key={tab} 
              style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Investment List */}
        <View style={styles.listContainer}>
          {filteredPortfolio.length === 0 && (
            <Text style={{ textAlign: 'center', marginTop: 40, color: '#6B7280', width: '100%' }}>No investments found.</Text>
          )}
          {filteredPortfolio.map((item) => {
            const propertyROI = Number(item.property?.assured_yield || 12);
            const estimatedEarning = Number(item.total_amount || 0) * propertyROI / 100;

            return (
              <TouchableOpacity key={item.id} style={styles.card} onPress={() => router.push(`/property/${item.property?.id}` as any)}>
                <Image source={{ uri: item.property?.images?.[0]?.image_url || 'https://via.placeholder.com/200' }} style={styles.cardImage} />
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{item.property?.title}</Text>
                  <Text style={styles.cardLocation}>{item.property?.locality || item.property?.district}, {item.property?.state}</Text>
                  
                  <View style={styles.cardStats}>
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>Invested</Text>
                      <Text style={styles.statValue}>₹ {Number(item.total_amount).toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>ROI</Text>
                      <Text style={[styles.statValue, { color: '#059669' }]}>{propertyROI}%</Text>
                    </View>
                    <View style={[styles.statBox, { alignItems: 'flex-end' }]}>
                      <Text style={styles.statLabel}>Earnings/yr</Text>
                      <Text style={[styles.statValue, { color: '#D97706' }]}>₹ {estimatedEarning.toLocaleString('en-IN')}</Text>
                    </View>
                  </View>

                  {/* Ownership Bar */}
                  <View style={styles.ownershipRow}>
                    <Text style={styles.ownershipLabel}>Ownership: {Number(item.ownership_percentage).toFixed(2)}%</Text>
                    <View style={styles.ownershipBarBg}>
                      <View style={[styles.ownershipBarFill, { width: `${Math.min(Number(item.ownership_percentage), 100)}%` }]} />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerIconBtn: {
    padding: 5,
  },
  headerIconText: {
    fontSize: 20,
    color: '#111827',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  summaryRow: {
    flexDirection: 'row',
    padding: 20,
    gap: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#F0F5FF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E1EFFE',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#4B5563',
    marginBottom: 6,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 16,
  },
  tabBtn: {
    paddingVertical: 12,
    marginRight: 24,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: '#1A56DB',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#1A56DB',
  },
  listContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'center',
  },
  cardImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  cardLocation: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
  },
  cardStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  ownershipRow: {
    marginTop: 10,
  },
  ownershipLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
  },
  ownershipBarBg: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  ownershipBarFill: {
    height: 6,
    backgroundColor: '#1A56DB',
    borderRadius: 3,
  },
  earningsSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  earningsSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  earningsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  earningsLabel: {
    fontSize: 14,
    color: '#4B5563',
  },
  earningsValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  earningsDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
  },
  bottomTab: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingBottom: 20,
  },
  bottomTabBtn: {
    alignItems: 'center',
    width: 60,
  },
  bottomTabIcon: {
    fontSize: 22,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  bottomTabText: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
  }
});

