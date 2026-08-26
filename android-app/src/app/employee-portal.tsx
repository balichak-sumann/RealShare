import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '../contexts/UserContext';

export default function EmployeePortalScreen({ isEmbedded = false }: { isEmbedded?: boolean } = {}) {
  const router = useRouter();
  const { profile } = useUser();

  const selectedRole = profile?.employee_department || 'sales';

  const salesClients = [
    { name: 'Arjun Kumar', phone: '+91 98765 43210', property: 'Goa Beachfront Villa', fractions: 10, value: '₹1.50 Cr', status: 'Active Investor' },
    { name: 'Priya Sharma', phone: '+91 87654 32109', property: 'Cyber Pearl Tech Park', fractions: 4, value: '₹20,00,000', status: 'Active Investor' },
    { name: 'Rohan Mehta', phone: '+91 76543 21098', property: 'Marina Bay Luxury Condo', fractions: 2, value: '₹50,00,000', status: 'Booked' },
  ];

  const supportTickets = [
    { ticketId: 'TCK-101', user: 'Vikram Singh', query: 'Aadhaar upload failing due to blur image', priority: 'High', status: 'Open' },
    { ticketId: 'TCK-102', user: 'Anjali Desai', query: 'Question regarding rental yield distribution bank account', priority: 'Medium', status: 'In Progress' },
    { ticketId: 'TCK-103', user: 'Meera Nair', query: 'Request for digital share certificate duplicate', priority: 'Low', status: 'Resolved' },
  ];

  const accountsLedger = [
    { ref: 'TXN-8821', user: 'Arjun Kumar', type: 'Fraction Booking Token', amount: '₹50,000', verified: true },
    { ref: 'TXN-8822', user: '45 Active Investors', type: 'Q3 Rental Yield Disbursed', amount: '₹81,250', verified: true },
    { ref: 'TXN-8823', user: 'Agent Vikramaditya', type: 'Commission Payout', amount: '₹37,500', verified: true },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Header */}
      <View style={styles.header}>
        {!isEmbedded && (
          <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/')}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A' }}>Logout</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>RealShare Employee Portal</Text>
      </View>

      <View style={styles.content}>
        {/* Employee ID Banner */}
        <View style={styles.employeeCard}>
          <View style={styles.empAvatar}>
            <Text style={styles.empAvatarText}>{profile?.full_name?.charAt(0) || 'E'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.empName}>{profile?.full_name || 'Employee'}</Text>
            <Text style={styles.empRole}>Department: {selectedRole.toUpperCase()}</Text>
          </View>
        </View>

        {/* Sales Person View */}
        {selectedRole === 'sales' && (
          <View>
            <View style={styles.scopeNotice}>
              <Text style={styles.scopeTitle}>🔒 Scoped View: Assigned Customers Only</Text>
              <Text style={styles.scopeBody}>
                As configured by Admin, sales reps only see their assigned investor leads and property fractions.
              </Text>
            </View>

            {salesClients.map((client, i) => (
              <View key={i} style={styles.itemCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{client.name}</Text>
                  <Text style={styles.itemPhone}>{client.phone}</Text>
                  <Text style={styles.itemMeta}>🏢 {client.property} ({client.fractions} Frac)</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.itemValue}>{client.value}</Text>
                  <Text style={styles.statusBadge}>{client.status}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Support Team View */}
        {selectedRole === 'support' && (
          <View>
            <View style={styles.scopeNotice}>
              <Text style={styles.scopeTitle}>🎧 Support Desk: KYC & Inquiry Tickets</Text>
              <Text style={styles.scopeBody}>
                Customer tickets assigned for identity verification assistance and customer service.
              </Text>
            </View>

            {supportTickets.map((tck, i) => (
              <View key={i} style={styles.itemCard}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                    <Text style={{ fontFamily: 'monospace', fontWeight: '800', fontSize: 11 }}>{tck.ticketId}</Text>
                    <Text style={{ fontSize: 11, color: '#DC2626', fontWeight: '700' }}>[{tck.priority}]</Text>
                  </View>
                  <Text style={styles.itemName}>{tck.user}</Text>
                  <Text style={styles.itemPhone}>{tck.query}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.statusBadge, { backgroundColor: tck.status === 'Resolved' ? '#DCFCE7' : '#FEF3C7', color: tck.status === 'Resolved' ? '#15803D' : '#B45309' }]}>
                    {tck.status}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Accounts Team View */}
        {selectedRole === 'accounts' && (
          <View>
            <View style={styles.scopeNotice}>
              <Text style={styles.scopeTitle}>🧾 Accounts: Escrow & Yield Settlements</Text>
              <Text style={styles.scopeBody}>
                Authorized reconciliation ledger for fraction bookings, dividend disbursements, and agent commissions.
              </Text>
            </View>

            {accountsLedger.map((txn, i) => (
              <View key={i} style={styles.itemCard}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'monospace', fontWeight: '700', fontSize: 11, color: '#64748B' }}>{txn.ref}</Text>
                  <Text style={styles.itemName}>{txn.type}</Text>
                  <Text style={styles.itemPhone}>Beneficiary: {txn.user}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.itemValue}>{txn.amount}</Text>
                  <Text style={[styles.statusBadge, { backgroundColor: '#DCFCE7', color: '#15803D' }]}>
                    ✓ Audited
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
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
  employeeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    gap: 12,
  },
  empAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  empAvatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  empName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  empRole: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  sectionHeaderLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  roleTabs: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  roleTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  roleTabActive: {
    backgroundColor: '#FFFFFF',
  },
  roleTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  roleTabTextActive: {
    color: '#2563EB',
  },
  scopeNotice: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 14,
  },
  scopeTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E3A8A',
    marginBottom: 2,
  },
  scopeBody: {
    fontSize: 11,
    color: '#3B82F6',
    lineHeight: 15,
  },
  itemCard: {
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
  itemName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  itemPhone: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  itemMeta: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '600',
    marginTop: 4,
  },
  itemValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: '700',
    backgroundColor: '#DCFCE7',
    color: '#15803D',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
});
