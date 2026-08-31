import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';

const TENANTS = [
  { id: '1', name: 'Rahul Sharma', property: '3 BHK, Jubilee Hills', rent: '₹45,000', due: '5th Oct', status: 'Paid' },
  { id: '2', name: 'Anjali Verma', property: '2 BHK, Madhapur', rent: '₹32,000', due: '1st Oct', status: 'Pending' },
];

export default function PropertyManagementScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Property Management</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Financial Overview */}
        <View style={styles.financeCard}>
          <Text style={styles.financeLabel}>Total Rent Collected (This Month)</Text>
          <Text style={styles.financeValue}>₹45,000</Text>
          <View style={styles.financeRow}>
            <View>
              <Text style={styles.financeSubLabel}>Pending</Text>
              <Text style={[styles.financeSubValue, { color: '#EF4444' }]}>₹32,000</Text>
            </View>
            <View style={styles.divider} />
            <View>
              <Text style={styles.financeSubLabel}>Next Month Est.</Text>
              <Text style={styles.financeSubValue}>₹77,000</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionBtn}>
            <Text style={styles.actionIcon}>📄</Text>
            <Text style={styles.actionText}>Rent Agreement</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Text style={styles.actionIcon}>🔧</Text>
            <Text style={styles.actionText}>Maintenance</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Text style={styles.actionIcon}>🧾</Text>
            <Text style={styles.actionText}>Receipts</Text>
          </TouchableOpacity>
        </View>

        {/* Tenants List */}
        <Text style={styles.sectionTitle}>Active Tenants</Text>
        {TENANTS.map(tenant => (
          <View key={tenant.id} style={styles.tenantCard}>
            <View style={styles.tenantHeader}>
              <View style={styles.tenantAvatar}>
                <Text style={styles.avatarText}>{tenant.name.charAt(0)}</Text>
              </View>
              <View style={styles.tenantInfo}>
                <Text style={styles.tenantName}>{tenant.name}</Text>
                <Text style={styles.tenantProperty}>{tenant.property}</Text>
              </View>
            </View>
            
            <View style={styles.rentInfoRow}>
              <View>
                <Text style={styles.rentLabel}>Rent</Text>
                <Text style={styles.rentValue}>{tenant.rent}</Text>
              </View>
              <View>
                <Text style={styles.rentLabel}>Due Date</Text>
                <Text style={styles.rentValue}>{tenant.due}</Text>
              </View>
              <View>
                <Text style={styles.rentLabel}>Status</Text>
                <View style={[styles.statusBadge, tenant.status === 'Paid' ? styles.statusPaid : styles.statusPending]}>
                  <Text style={[styles.statusText, tenant.status === 'Paid' ? styles.statusTextPaid : styles.statusTextPending]}>
                    {tenant.status}
                  </Text>
                </View>
              </View>
            </View>

            {tenant.status === 'Pending' && (
              <TouchableOpacity style={styles.remindBtn}>
                <Text style={styles.remindBtnText}>Send Reminder</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

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
  financeCard: {
    backgroundColor: Neutrals.obsidian,
    padding: 24,
    borderRadius: Radius.lg,
    marginBottom: 24,
    ...Shadows.strong,
  },
  financeLabel: {
    ...Typography.labelMedium,
    color: Neutrals.gray300,
    marginBottom: 8,
  },
  financeValue: {
    ...Typography.displayLarge,
    color: GoldSystem.primaryGold,
    marginBottom: 24,
  },
  financeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  financeSubLabel: {
    ...Typography.caption,
    color: Neutrals.gray400,
    marginBottom: 4,
  },
  financeSubValue: {
    ...Typography.labelLarge,
    color: Neutrals.surface,
  },
  divider: {
    width: 1,
    backgroundColor: Neutrals.gray600,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: Neutrals.surface,
    paddingVertical: 16,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Neutrals.border,
    alignItems: 'center',
    ...Shadows.soft,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionText: {
    ...Typography.caption,
    color: Neutrals.obsidian,
    fontWeight: '700',
  },
  sectionTitle: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
    marginBottom: 16,
  },
  tenantCard: {
    backgroundColor: Neutrals.surface,
    padding: 20,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Neutrals.border,
    marginBottom: 16,
    ...Shadows.soft,
  },
  tenantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Neutrals.border,
  },
  tenantAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Neutrals.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
  },
  tenantInfo: {
    flex: 1,
  },
  tenantName: {
    ...Typography.labelLarge,
    color: Neutrals.obsidian,
  },
  tenantProperty: {
    ...Typography.caption,
    color: Neutrals.gray500,
  },
  rentInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  rentLabel: {
    ...Typography.caption,
    color: Neutrals.gray500,
    marginBottom: 4,
  },
  rentValue: {
    ...Typography.labelMedium,
    color: Neutrals.obsidian,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  statusPaid: {
    backgroundColor: '#DEF7EC',
  },
  statusPending: {
    backgroundColor: '#FDE8E8',
  },
  statusText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  statusTextPaid: {
    color: '#03543F',
  },
  statusTextPending: {
    color: '#9B1C1C',
  },
  remindBtn: {
    marginTop: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Neutrals.border,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  remindBtnText: {
    ...Typography.labelMedium,
    color: Neutrals.obsidian,
  },
});
