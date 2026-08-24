import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';

export default function AgentPortalScreen() {
  const router = useRouter();

  const [copied, setCopied] = useState(false);
  const referralLink = "https://realshare.in/ref/RS-VIKRAM-2026";

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const clientLeads = [
    { name: 'Arjun Kumar', property: 'Goa Beachfront Villa', fractions: 10, commission: '₹37,500', status: 'Commission Paid' },
    { name: 'Priya Sharma', property: 'Cyber Pearl Tech Park', fractions: 4, commission: '₹10,000', status: 'Commission Paid' },
    { name: 'Rohan Mehta', property: 'Marina Bay Luxury Condo', fractions: 2, commission: '₹1,25,000', status: 'Pending Payout' },
    { name: 'Ananya Roy', property: 'Mountain View Alpine Lodge', fractions: 1, commission: '₹30,000', status: 'Under Verification' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Agent & Channel Partner Hub</Text>
      </View>

      <View style={styles.content}>
        {/* Agent Profile Summary */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>VR</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.agentName}>Vikramaditya Rao</Text>
            <Text style={styles.agencyName}>Hyderabad Prime Real Estate</Text>
            <Text style={styles.commissionRateBadge}>⚡ Custom Commission: 2.5% per Sale</Text>
          </View>
        </View>

        {/* Commission KPIs */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Total Earned</Text>
            <Text style={[styles.kpiValue, { color: '#16A34A' }]}>₹2,02,500</Text>
            <Text style={styles.kpiSub}>Transferred to Bank</Text>
          </View>

          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Pending Payout</Text>
            <Text style={[styles.kpiValue, { color: '#D97706' }]}>₹1,25,000</Text>
            <Text style={styles.kpiSub}>Ready for Payout</Text>
          </View>
        </View>

        {/* Referral Link Generator */}
        <View style={styles.referralCard}>
          <Text style={styles.cardTitle}>🔗 Your Unique Investor Referral Link</Text>
          <Text style={styles.cardSubtitle}>
            Share with your clients. Any fractional investment made through this link automatically attributes 2.5% commission to your account.
          </Text>

          <View style={styles.linkContainer}>
            <TextInput
              style={styles.linkInput}
              value={referralLink}
              editable={false}
            />
            <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
              <Text style={styles.copyBtnText}>{copied ? '✓ Copied' : 'Copy Link'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Client Pipeline & Sales Analytics */}
        <View style={styles.pipelineSection}>
          <Text style={styles.sectionTitle}>Client Investment Pipeline ({clientLeads.length})</Text>

          {clientLeads.map((lead, i) => (
            <View key={i} style={styles.leadCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.leadName}>{lead.name}</Text>
                <Text style={styles.leadProp}>{lead.property} ({lead.fractions} Frac)</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.commissionAmt}>{lead.commission}</Text>
                <Text
                  style={[
                    styles.statusBadge,
                    lead.status === 'Commission Paid'
                      ? styles.statusPaid
                      : lead.status === 'Pending Payout'
                      ? styles.statusPending
                      : styles.statusReview,
                  ]}
                >
                  {lead.status}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 55,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  content: {
    padding: 20,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    gap: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  agentName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  agencyName: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  commissionRateBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
    marginTop: 4,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  kpiBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '800',
    marginVertical: 4,
  },
  kpiSub: {
    fontSize: 10,
    color: '#64748B',
  },
  referralCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E3A8A',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#3B82F6',
    lineHeight: 16,
    marginBottom: 12,
  },
  linkContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  linkInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    fontSize: 11,
    color: '#334155',
  },
  copyBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: 8,
  },
  copyBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  pipelineSection: {
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  leadCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  leadName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  leadProp: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  commissionAmt: {
    fontSize: 14,
    fontWeight: '800',
    color: '#16A34A',
    marginBottom: 2,
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusPaid: {
    backgroundColor: '#DCFCE7',
    color: '#15803D',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
    color: '#B45309',
  },
  statusReview: {
    backgroundColor: '#F1F5F9',
    color: '#64748B',
  },
});
