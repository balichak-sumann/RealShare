import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';

const MOCK_LEADS = [
  { id: '1', name: 'Rahul Sharma', time: '2 hours ago', status: 'New', phone: '+91 98765 43210', property: '3 BHK Villa, Jubilee Hills' },
  { id: '2', name: 'Priya Patel', time: '5 hours ago', status: 'Contacted', phone: '+91 99887 76655', property: '3 BHK Villa, Jubilee Hills' },
  { id: '3', name: 'Arjun Reddy', time: '1 day ago', status: 'Negotiating', phone: '+91 91234 56789', property: 'Commercial Plot, Gachibowli' },
];

export default function LeadsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lead Management</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        
        <View style={styles.filterRow}>
          {['All', 'New', 'Contacted', 'Negotiating'].map((filter, idx) => (
            <TouchableOpacity key={filter} style={[styles.filterPill, idx === 0 && styles.filterPillActive]}>
              <Text style={[styles.filterText, idx === 0 && styles.filterTextActive]}>{filter}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {MOCK_LEADS.map(lead => (
          <View key={lead.id} style={styles.leadCard}>
            <View style={styles.leadHeader}>
              <View style={styles.leadAvatar}>
                <Text style={styles.avatarText}>{lead.name.charAt(0)}</Text>
              </View>
              <View style={styles.leadInfo}>
                <Text style={styles.leadName}>{lead.name}</Text>
                <Text style={styles.leadTime}>{lead.time}</Text>
              </View>
              <View style={[styles.statusBadge, lead.status === 'New' && styles.statusNew]}>
                <Text style={[styles.statusText, lead.status === 'New' && styles.statusTextNew]}>{lead.status}</Text>
              </View>
            </View>

            <View style={styles.leadDetails}>
              <Text style={styles.detailText}>📞 {lead.phone}</Text>
              <Text style={styles.detailText}>🏠 {lead.property}</Text>
            </View>

            <View style={styles.leadActions}>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Neutrals.surface, borderWidth: 1, borderColor: Neutrals.border }]}>
                <Text style={styles.actionBtnText}>WhatsApp</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Neutrals.obsidian }]}>
                <Text style={[styles.actionBtnText, { color: Neutrals.surface }]}>Call Now</Text>
              </TouchableOpacity>
            </View>
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
  filterRow: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Neutrals.surface,
    borderWidth: 1,
    borderColor: Neutrals.border,
  },
  filterPillActive: {
    backgroundColor: Neutrals.obsidian,
    borderColor: Neutrals.obsidian,
  },
  filterText: {
    ...Typography.labelMedium,
    color: Neutrals.obsidian,
  },
  filterTextActive: {
    color: Neutrals.surface,
  },
  leadCard: {
    backgroundColor: Neutrals.surface,
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Neutrals.border,
    marginBottom: 16,
    ...Shadows.soft,
  },
  leadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  leadAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: GoldSystem.paleGold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    ...Typography.headlineMedium,
    color: GoldSystem.darkGold,
  },
  leadInfo: {
    flex: 1,
  },
  leadName: {
    ...Typography.labelLarge,
    color: Neutrals.obsidian,
  },
  leadTime: {
    ...Typography.caption,
    color: Neutrals.gray500,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    backgroundColor: Neutrals.gray100,
  },
  statusText: {
    ...Typography.caption,
    color: Neutrals.obsidian,
  },
  statusNew: {
    backgroundColor: '#DEF7EC',
  },
  statusTextNew: {
    color: '#03543F',
    fontWeight: '700',
  },
  leadDetails: {
    backgroundColor: Neutrals.background,
    padding: 12,
    borderRadius: Radius.md,
    marginBottom: 16,
    gap: 8,
  },
  detailText: {
    ...Typography.bodyMedium,
    color: Neutrals.textSecondary,
  },
  leadActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  actionBtnText: {
    ...Typography.labelMedium,
    color: Neutrals.obsidian,
  },
});
