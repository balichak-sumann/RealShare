import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';
import { useUser } from '@/contexts/UserContext';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { profile } = useUser();
  const [activeTab, setActiveTab] = useState('Overview');

  if (profile?.role !== 'admin' && profile?.role !== 'employee') {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Access Denied. Admins and Employees only.</Text>
      </View>
    );
  }

  const TABS = ['Overview', 'Users', 'Agents', 'Properties', 'Transactions', 'Services'];

  const renderOverview = () => (
    <View style={styles.grid}>
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Total Sales (Fractions)</Text>
        <Text style={styles.statValue}>₹ 14.5 Cr</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Pending Users</Text>
        <Text style={[styles.statValue, { color: '#D97706' }]}>12</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Pending Properties</Text>
        <Text style={[styles.statValue, { color: '#059669' }]}>3</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Active Agents</Text>
        <Text style={styles.statValue}>45</Text>
      </View>
    </View>
  );

  const renderUsers = () => (
    <View style={styles.listSection}>
      <View style={styles.listItem}>
        <View>
          <Text style={styles.itemTitle}>Rahul Sharma</Text>
          <Text style={styles.itemSubtitle}>ID: PAN - ABCD1234E</Text>
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#10B981' }]}><Text style={styles.actionText}>Approve</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#EF4444' }]}><Text style={styles.actionText}>Reject</Text></TouchableOpacity>
        </View>
      </View>
      <View style={styles.listItem}>
        <View>
          <Text style={styles.itemTitle}>Anita Desai</Text>
          <Text style={styles.itemSubtitle}>ID: Aadhar - 1234 5678 9012</Text>
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#10B981' }]}><Text style={styles.actionText}>Approve</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#EF4444' }]}><Text style={styles.actionText}>Reject</Text></TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderProperties = () => (
    <View style={styles.listSection}>
      <View style={styles.listItem}>
        <View style={{ flex: 1 }}>
          <Text style={styles.itemTitle}>Lodha Bellezza - 3BHK</Text>
          <Text style={styles.itemSubtitle}>Total Shares: 100 • Price/Share: ₹1.5L</Text>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: '45%' }]} />
          </View>
          <Text style={styles.progressText}>45 / 100 Shares Sold</Text>
        </View>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Neutrals.obsidian }]}><Text style={styles.actionText}>Edit Listing</Text></TouchableOpacity>
      </View>
      
      <View style={styles.listItem}>
        <View style={{ flex: 1 }}>
          <Text style={styles.itemTitle}>Prestige High Fields (Pending)</Text>
          <Text style={styles.itemSubtitle}>Builder: Aparna Group • Shares: 50</Text>
        </View>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#10B981' }]}><Text style={styles.actionText}>Approve</Text></TouchableOpacity>
      </View>
    </View>
  );

  const renderServices = () => (
    <View style={styles.listSection}>
      <Text style={styles.sectionHeader}>Manage Additional Services</Text>
      {['Interior Works', 'Insurance Services', 'Property Management'].map(service => (
        <View key={service} style={styles.listItem}>
          <Text style={styles.itemTitle}>{service}</Text>
          <Switch value={true} trackColor={{ true: GoldSystem.primaryGold }} />
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.sidebar}>
        <Text style={styles.logo}>RealShare <Text style={{ color: GoldSystem.primaryGold }}>Admin</Text></Text>
        {TABS.map(tab => (
          <TouchableOpacity 
            key={tab} 
            style={[styles.sidebarTab, activeTab === tab && styles.sidebarTabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.sidebarTabText, activeTab === tab && styles.sidebarTabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={[styles.sidebarTab, { marginTop: 'auto' }]} onPress={() => router.replace('/')}>
          <Text style={styles.sidebarTabText}>← Back to App</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.mainContent}>
        <Text style={styles.pageTitle}>{activeTab}</Text>
        <ScrollView style={{ flex: 1 }}>
          {activeTab === 'Overview' && renderOverview()}
          {activeTab === 'Users' && renderUsers()}
          {activeTab === 'Properties' && renderProperties()}
          {activeTab === 'Services' && renderServices()}
          
          {['Agents', 'Transactions'].includes(activeTab) && (
             <View style={styles.centerContainer}>
               <Text style={styles.itemTitle}>{activeTab} Module Loading...</Text>
             </View>
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
  sidebarTabActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
  },
  sidebarTabText: {
    ...Typography.labelLarge,
    color: Neutrals.gray400,
  },
  sidebarTabTextActive: {
    color: GoldSystem.primaryGold,
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
  listSection: {
    backgroundColor: Neutrals.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Neutrals.border,
    overflow: 'hidden',
    ...Shadows.soft,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Neutrals.border,
  },
  itemTitle: {
    ...Typography.labelLarge,
    color: Neutrals.obsidian,
    marginBottom: 4,
  },
  itemSubtitle: {
    ...Typography.bodyMedium,
    color: Neutrals.gray500,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.sm,
  },
  actionText: {
    ...Typography.labelMedium,
    color: Neutrals.white,
  },
  progressBg: {
    height: 6,
    backgroundColor: Neutrals.gray200,
    borderRadius: 3,
    marginTop: 12,
    marginBottom: 4,
    width: '100%',
    maxWidth: 300,
  },
  progressFill: {
    height: '100%',
    backgroundColor: GoldSystem.primaryGold,
    borderRadius: 3,
  },
  progressText: {
    ...Typography.caption,
    color: Neutrals.gray500,
  },
  sectionHeader: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Neutrals.border,
    backgroundColor: Neutrals.gray100,
  }
});
