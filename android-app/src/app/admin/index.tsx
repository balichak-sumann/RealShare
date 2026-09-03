import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, ActivityIndicator, Linking, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';
import { useUser } from '@/contexts/UserContext';
import { auth } from '@/lib/firebase';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com';

function formatCurrency(n: number) {
  if (n >= 10000000) return `\u20b9${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `\u20b9${(n / 100000).toFixed(2)} L`;
  return `\u20b9${n.toLocaleString('en-IN')}`;
}

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { profile } = useUser();
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<any>(null);

  useEffect(() => {
    if (profile?.role !== 'admin' && profile?.role !== 'employee') return;
    (async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        const token = await user.getIdToken();
        const res = await fetch(`${API_URL}/api/dashboard/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setKpis(data.kpis);
        }
      } catch (e) {
        console.log('Failed to load admin summary', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [profile]);

  if (profile?.role !== 'admin' && profile?.role !== 'employee') {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Access Denied. Admins and Employees only.</Text>
      </View>
    );
  }

  const openWebAdmin = () => {
    const adminUrl = process.env.EXPO_PUBLIC_ADMIN_URL;
    if (!adminUrl) {
      Alert.alert(
        'Web admin not configured',
        'Ask your platform administrator for the web admin dashboard URL.'
      );
      return;
    }
    Linking.openURL(adminUrl);
  };

  return (
    <View style={styles.container}>
      <View style={styles.sidebar}>
        <Text style={styles.logo}>RealShare <Text style={{ color: GoldSystem.primaryGold }}>Admin</Text></Text>
        <TouchableOpacity style={[styles.sidebarTab, { marginTop: 'auto' }]} onPress={() => router.replace('/')}>
          <Text style={styles.sidebarTabText}>\u2190 Back to App</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.mainContent}>
        <Text style={styles.pageTitle}>Overview</Text>
        <ScrollView style={{ flex: 1 }}>
          {loading ? (
            <ActivityIndicator color={GoldSystem.primaryGold} style={{ marginTop: 40 }} />
          ) : (
            <>
              <View style={styles.grid}>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Total Investments</Text>
                  <Text style={styles.statValue}>{formatCurrency(kpis?.totalInvestments || 0)}</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Pending KYC</Text>
                  <Text style={[styles.statValue, { color: '#D97706' }]}>{kpis?.pendingUsers ?? 0}</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Pending Properties</Text>
                  <Text style={[styles.statValue, { color: '#059669' }]}>{kpis?.pendingProperties ?? 0}</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Active Agents</Text>
                  <Text style={styles.statValue}>{kpis?.activeAgents ?? 0}</Text>
                </View>
              </View>

              <View style={styles.webAdminCard}>
                <Text style={styles.webAdminTitle}>Full admin tools</Text>
                <Text style={styles.webAdminDesc}>
                  User approvals, property moderation, agent management, transactions and service
                  settings are managed from the RealShare web admin dashboard.
                </Text>
                <TouchableOpacity style={styles.webAdminBtn} onPress={openWebAdmin}>
                  <Text style={styles.webAdminBtnText}>Open Web Admin Dashboard</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    backgroundColor: Neutrals.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    ...Typography.headlineMedium,
    color: '#EF4444',
  },
  sidebar: {
    width: Platform.OS === 'web' ? 260 : '100%',
    backgroundColor: Neutrals.obsidian,
    padding: 24,
    paddingTop: Platform.OS === 'web' ? 24 : 60,
  },
  logo: {
    ...Typography.headlineMedium,
    color: Neutrals.white,
    marginBottom: 40,
  },
  sidebarTab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: Radius.md,
    marginBottom: 8,
  },
  sidebarTabText: {
    ...Typography.labelLarge,
    color: Neutrals.gray400,
  },
  mainContent: {
    flex: 1,
    padding: 32,
    backgroundColor: '#F9FAFB',
  },
  pageTitle: {
    ...Typography.displayMedium,
    color: Neutrals.obsidian,
    marginBottom: 32,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
  },
  statCard: {
    backgroundColor: Neutrals.surface,
    padding: 24,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Neutrals.border,
    minWidth: 240,
    flex: 1,
    ...Shadows.soft,
  },
  statLabel: {
    ...Typography.labelLarge,
    color: Neutrals.gray500,
    marginBottom: 8,
  },
  statValue: {
    ...Typography.displayLarge,
    color: Neutrals.obsidian,
  },
  webAdminCard: {
    backgroundColor: Neutrals.surface,
    padding: 24,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Neutrals.border,
    marginTop: 24,
    ...Shadows.soft,
  },
  webAdminTitle: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
    marginBottom: 8,
  },
  webAdminDesc: {
    ...Typography.bodyMedium,
    color: Neutrals.gray600,
    marginBottom: 20,
  },
  webAdminBtn: {
    backgroundColor: Neutrals.obsidian,
    paddingVertical: 14,
    borderRadius: Radius.md,
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 24,
  },
  webAdminBtnText: {
    ...Typography.labelMedium,
    color: Neutrals.surface,
  },
});
