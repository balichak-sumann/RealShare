import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';
import { auth } from '@/lib/firebase';
import { EmptyState } from '@/components/ui/EmptyState';

export default function LedgerScreen() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchLedger();
  }, []);

  const fetchLedger = async () => {
    try {
      setError(null);
      const user = auth.currentUser;
      if (!user) {
        setError('Please sign in to view your ledger.');
        setLoading(false);
        return;
      }
      const token = await user.getIdToken();
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com'}/api/ledger`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      } else {
        setError('Failed to load ledger.');
      }
    } catch (err) {
      console.warn(err);
      setError('Network error.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchLedger();
  };

  const getTransactionIcon = (type: string) => {
    switch(type) {
      case 'deposit': return '💰';
      case 'withdrawal': return '💸';
      case 'investment': return '🏢';
      case 'yield_payout': return '📈';
      case 'rental_income': return '🏠';
      default: return '📝';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>A/C Ledger</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={GoldSystem.primaryGold} />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <EmptyState title="Error" subtitle={error} icon="⚠️" />
        </View>
      ) : transactions.length === 0 ? (
        <View style={styles.centerContainer}>
          <EmptyState 
            title="No Transactions" 
            subtitle="Your financial activity will appear here." 
            icon="📊" 
          />
        </View>
      ) : (
        <ScrollView 
          style={styles.content}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {transactions.map((txn) => (
            <View key={txn.id} style={styles.txnCard}>
              <View style={styles.iconContainer}>
                <Text style={styles.iconText}>{getTransactionIcon(txn.transaction_type)}</Text>
              </View>
              <View style={styles.txnDetails}>
                <Text style={styles.txnTitle}>
                  {txn.transaction_type.replace('_', ' ').toUpperCase()}
                </Text>
                {txn.property && (
                  <Text style={styles.txnSubtitle} numberOfLines={1}>
                    {txn.property.title}
                  </Text>
                )}
                <Text style={styles.txnDate}>
                  {new Date(txn.created_at).toLocaleString()}
                </Text>
              </View>
              <View style={styles.amountContainer}>
                <Text style={[
                  styles.txnAmount, 
                  { color: ['deposit', 'yield_payout', 'rental_income'].includes(txn.transaction_type) ? '#16A34A' : '#DC2626' }
                ]}>
                  {['deposit', 'yield_payout', 'rental_income'].includes(txn.transaction_type) ? '+' : '-'}
                  ₹{Number(txn.amount).toLocaleString('en-IN')}
                </Text>
                <Text style={styles.txnStatus}>{txn.payment_status}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Neutrals.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, paddingTop: 50, backgroundColor: Neutrals.surface,
    borderBottomWidth: 1, borderBottomColor: Neutrals.border,
  },
  backBtn: { padding: 8, marginLeft: -8 },
  backIcon: { fontSize: 24, color: Neutrals.obsidian },
  headerTitle: { ...Typography.headlineMedium, color: Neutrals.obsidian },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  content: { flex: 1 },
  txnCard: {
    backgroundColor: Neutrals.surface,
    flexDirection: 'row',
    padding: 16,
    borderRadius: Radius.md,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Neutrals.border,
    alignItems: 'center',
  },
  iconContainer: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Neutrals.gray100,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  iconText: { fontSize: 20 },
  txnDetails: { flex: 1, marginRight: 8 },
  txnTitle: { ...Typography.labelMedium, color: Neutrals.obsidian },
  txnSubtitle: { ...Typography.bodyMedium, color: Neutrals.gray600, marginTop: 2 },
  txnDate: { ...Typography.caption, color: Neutrals.gray400, marginTop: 4 },
  amountContainer: { alignItems: 'flex-end' },
  txnAmount: { ...Typography.labelLarge, fontWeight: '700' },
  txnStatus: { ...Typography.caption, color: Neutrals.gray500, marginTop: 4, textTransform: 'capitalize' },
});
