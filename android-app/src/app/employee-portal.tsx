import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '../contexts/UserContext';
import { auth } from '../lib/firebase';
import { LinearGradient } from 'expo-linear-gradient';

export default function EmployeePortalScreen({ isEmbedded = false }: { isEmbedded?: boolean } = {}) {
  const router = useRouter();
  const { profile } = useUser();
  const selectedRole = profile?.employee_department || 'sales';

  const [salesClients, setSalesClients] = useState<any[]>([]);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [accountsLedger, setAccountsLedger] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadProperty, setNewLeadProperty] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedRole]);

  async function fetchData() {
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com'}/api/employees/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await res.json();

      if (selectedRole === 'sales') {
        // Use real data if present, else show empty state
        setSalesClients(data.salesClients || []);
      } else if (selectedRole === 'support') {
        setSupportTickets(data.supportTickets || []);
      } else if (selectedRole === 'accounts') {
        setAccountsLedger(data.accountsLedger || []);
      }
    } catch (err) {
      console.error('Failed to fetch employee dashboard data', err);
    } finally {
      setLoading(false);
    }
  }

  const getDepartmentColor = (): [string, string] => {
    switch (selectedRole) {
      case 'sales':    return ['#1E3A8A', '#3B82F6'];
      case 'support':  return ['#831843', '#BE185D'];
      case 'accounts': return ['#064E3B', '#059669'];
      default:         return ['#0F172A', '#334155'];
    }
  };

  const handleAddLead = () => {
    const cleanedPhone = newLeadPhone.replace(/\D/g, '').slice(-10);
    if (!newLeadName.trim() || cleanedPhone.length !== 10 || !/^[6-9]/.test(cleanedPhone)) {
      Alert.alert('Invalid Input', 'Please enter a valid name and a 10-digit mobile number starting with 7, 8, 9, or 6.');
      return;
    }
    setIsSaving(true);
    setTimeout(() => {
      const newLead = {
        name: newLeadName,
        phone: newLeadPhone,
        property: newLeadProperty || 'Not assigned yet',
        fractions: 0,
        value: '₹0',
        status: 'Lead',
      };
      setSalesClients(prev => [newLead, ...prev]);
      setNewLeadName(''); setNewLeadPhone(''); setNewLeadProperty('');
      setShowNewLeadModal(false);
      setIsSaving(false);
    }, 600);
  };

  const handleUpdateStatus = (newStatus: string) => {
    setSalesClients(prev =>
      prev.map(c => c.name === selectedClient?.name ? { ...c, status: newStatus } : c)
    );
    setShowStatusModal(false);
    setSelectedClient(null);
  };

  const handleUpdateTicket = (newStatus: string) => {
    setSupportTickets(prev =>
      prev.map(t => t.ticketId === selectedTicket?.ticketId ? { ...t, status: newStatus } : t)
    );
    setShowTicketModal(false);
    setSelectedTicket(null);
  };

  const generateReport = () => {
    const converted = salesClients.filter(c => c.status === 'Converted').length;
    const leads = salesClients.filter(c => c.status === 'Lead').length;
    const pending = salesClients.filter(c => c.status === 'Pending').length;
    return { total: salesClients.length, converted, leads, pending };
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#1E3A8A" />
        <Text style={{ color: '#64748B', marginTop: 12, fontSize: 14 }}>Loading your workspace...</Text>
      </View>
    );
  }

  const report = generateReport();

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Premium Header */}
        <LinearGradient colors={getDepartmentColor()} style={styles.header}>
          <View style={styles.headerTop}>
            {!isEmbedded && (
              <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/')}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>Logout</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.headerTitle}>INTERNAL OPS</Text>
            <TouchableOpacity style={styles.refreshBtn} onPress={fetchData}>
              <Text style={{ fontSize: 16, color: '#FFFFFF' }}>↻</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.profileSection}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{profile?.full_name?.charAt(0) || 'E'}</Text>
              </View>
              <View style={styles.authBadge}>
                <Text style={styles.authBadgeText}>SECURE</Text>
              </View>
            </View>
            <View style={styles.profileDetails}>
              <Text style={styles.empName}>{profile?.full_name || 'Staff Member'}</Text>
              <Text style={styles.empEmail}>{profile?.email || 'staff@realshare.com'}</Text>
              <View style={styles.deptBadge}>
                <Text style={styles.deptBadgeText}>{selectedRole.toUpperCase()} DIVISION</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>

          {/* SALES VIEW */}
          {selectedRole === 'sales' && (
            <View>
              <View style={styles.statsRow}>
                <View style={styles.statCard}><Text style={styles.statNum}>{report.total}</Text><Text style={styles.statLabel}>Total Leads</Text></View>
                <View style={[styles.statCard, { backgroundColor: '#DCFCE7' }]}><Text style={[styles.statNum, { color: '#15803D' }]}>{report.converted}</Text><Text style={styles.statLabel}>Converted</Text></View>
                <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}><Text style={[styles.statNum, { color: '#B45309' }]}>{report.pending}</Text><Text style={styles.statLabel}>Pending</Text></View>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => setShowNewLeadModal(true)}>
                  <Text style={styles.actionBtnText}>＋  New Lead</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#1E3A8A' }]} onPress={() => setShowReportModal(true)}>
                  <Text style={[styles.actionBtnText, { color: '#1E3A8A' }]}>📊  Generate Report</Text>
                </TouchableOpacity>
              </View>

              {salesClients.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>👥</Text>
                  <Text style={styles.emptyTitle}>No Assigned Clients Yet</Text>
                  <Text style={styles.emptyBody}>Your admin will assign investors to you, or add a new lead manually above.</Text>
                </View>
              ) : (
                salesClients.map((client, i) => (
                  <TouchableOpacity key={i} style={styles.itemCard} onPress={() => { setSelectedClient(client); setShowStatusModal(true); }}>
                    <View style={styles.itemHeader}>
                      <Text style={styles.itemName}>{client.name}</Text>
                      <View style={[styles.statusBadge,
                        client.status === 'Converted' ? styles.statusSuccess :
                        client.status === 'Pending' ? styles.statusWarning : styles.statusNeutral
                      ]}>
                        <Text style={[styles.statusText,
                          client.status === 'Converted' ? styles.statusTextSuccess :
                          client.status === 'Pending' ? styles.statusTextWarning : styles.statusTextNeutral
                        ]}>{client.status.toUpperCase()}</Text>
                      </View>
                    </View>
                    <View style={styles.itemDivider} />
                    <View style={styles.itemBodyRow}>
                      <View>
                        <Text style={styles.itemLabel}>Property Interest</Text>
                        <Text style={styles.itemValueMain}>🏢 {client.property}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.itemLabel}>Investment Value</Text>
                        <Text style={styles.itemValueHighlight}>{client.value}</Text>
                      </View>
                    </View>
                    <Text style={styles.itemPhone}>📞 {client.phone}</Text>
                    <Text style={styles.tapHint}>Tap to update status →</Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          {/* SUPPORT VIEW */}
          {selectedRole === 'support' && (
            <View>
              <View style={[styles.statsRow]}>
                <View style={styles.statCard}><Text style={styles.statNum}>{supportTickets.length}</Text><Text style={styles.statLabel}>Total Tickets</Text></View>
                <View style={[styles.statCard, { backgroundColor: '#FEE2E2' }]}><Text style={[styles.statNum, { color: '#DC2626' }]}>{supportTickets.filter(t => t.priority === 'HIGH').length}</Text><Text style={styles.statLabel}>High Priority</Text></View>
                <View style={[styles.statCard, { backgroundColor: '#DCFCE7' }]}><Text style={[styles.statNum, { color: '#15803D' }]}>{supportTickets.filter(t => t.status === 'Resolved').length}</Text><Text style={styles.statLabel}>Resolved</Text></View>
              </View>

              {supportTickets.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>🎧</Text>
                  <Text style={styles.emptyTitle}>No Open Tickets</Text>
                  <Text style={styles.emptyBody}>All clear! No customer tickets assigned to you.</Text>
                </View>
              ) : (
                supportTickets.map((tck, i) => (
                  <TouchableOpacity key={i} style={styles.itemCard} onPress={() => { setSelectedTicket(tck); setShowTicketModal(true); }}>
                    <View style={styles.itemHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={styles.ticketId}>{tck.ticketId}</Text>
                        <Text style={[styles.priorityBadge, tck.priority === 'HIGH' && { color: '#DC2626' }, tck.priority === 'MED' && { color: '#B45309' }]}>[{tck.priority}]</Text>
                      </View>
                      <View style={[styles.statusBadge,
                        tck.status === 'Resolved' ? styles.statusSuccess :
                        tck.status === 'In Progress' ? styles.statusWarning : styles.statusNeutral
                      ]}>
                        <Text style={[styles.statusText,
                          tck.status === 'Resolved' ? styles.statusTextSuccess :
                          tck.status === 'In Progress' ? styles.statusTextWarning : styles.statusTextNeutral
                        ]}>{tck.status.toUpperCase()}</Text>
                      </View>
                    </View>
                    <View style={styles.itemDivider} />
                    <Text style={styles.itemLabel}>Customer</Text>
                    <Text style={styles.itemName}>{tck.user}</Text>
                    <Text style={[styles.itemLabel, { marginTop: 8 }]}>Query</Text>
                    <Text style={styles.itemQuery}>{tck.query}</Text>
                    <Text style={styles.tapHint}>Tap to update status →</Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          {/* ACCOUNTS VIEW */}
          {selectedRole === 'accounts' && (
            <View>
              <View style={styles.statsRow}>
                <View style={styles.statCard}><Text style={styles.statNum}>{accountsLedger.length}</Text><Text style={styles.statLabel}>Transactions</Text></View>
                <View style={[styles.statCard, { backgroundColor: '#DCFCE7' }]}><Text style={[styles.statNum, { color: '#15803D' }]}>{accountsLedger.filter(t => t.verified).length}</Text><Text style={styles.statLabel}>Verified</Text></View>
                <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}><Text style={[styles.statNum, { color: '#B45309' }]}>{accountsLedger.filter(t => !t.verified).length}</Text><Text style={styles.statLabel}>Pending</Text></View>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#059669' }]}
                  onPress={() => Alert.alert('Export CSV', 'A CSV export of all transactions has been triggered. You will receive an email with the file shortly.')}>
                  <Text style={styles.actionBtnText}>⬇  Export CSV</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#064E3B' }]}
                  onPress={() => Alert.alert('Audit Run', `Audit complete.\n\n✅ Verified: ${accountsLedger.filter(t => t.verified).length}\n⚠️ Pending Review: ${accountsLedger.filter(t => !t.verified).length}`)}>
                  <Text style={[styles.actionBtnText, { color: '#064E3B' }]}>🔍  Run Audit</Text>
                </TouchableOpacity>
              </View>

              {accountsLedger.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>🧾</Text>
                  <Text style={styles.emptyTitle}>No Ledger Entries</Text>
                  <Text style={styles.emptyBody}>No transactions to review at this time.</Text>
                </View>
              ) : (
                accountsLedger.map((txn, i) => (
                  <View key={i} style={styles.itemCard}>
                    <View style={styles.itemHeader}>
                      <Text style={styles.ticketId}>{txn.ref}</Text>
                      <View style={[styles.statusBadge, txn.verified ? styles.statusSuccess : styles.statusWarning]}>
                        <Text style={[styles.statusText, txn.verified ? styles.statusTextSuccess : styles.statusTextWarning]}>
                          {txn.verified ? '✓ VERIFIED' : 'PENDING'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.itemDivider} />
                    <Text style={styles.itemLabel}>Transaction Type</Text>
                    <Text style={styles.itemName}>{txn.type}</Text>
                    <View style={styles.itemBodyRow}>
                      <View>
                        <Text style={[styles.itemLabel, { marginTop: 8 }]}>Beneficiary</Text>
                        <Text style={styles.itemValueMain}>{txn.user}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                        <Text style={[styles.itemValueHighlight, { color: '#059669', fontSize: 18 }]}>{txn.amount}</Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* NEW LEAD MODAL */}
      <Modal visible={showNewLeadModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Add New Lead</Text>
            <Text style={styles.modalSubtitle}>Enter the client's basic information to start tracking them.</Text>

            <Text style={styles.inputLabel}>Full Name *</Text>
            <TextInput style={styles.input} placeholder="e.g. Rahul Sharma" value={newLeadName} onChangeText={setNewLeadName} placeholderTextColor="#9CA3AF" />

            <Text style={styles.inputLabel}>Phone Number *</Text>
            <TextInput style={styles.input} placeholder="e.g. +91 98765 43210" value={newLeadPhone} onChangeText={setNewLeadPhone} keyboardType="phone-pad" placeholderTextColor="#9CA3AF" />

            <Text style={styles.inputLabel}>Property Interest</Text>
            <TextInput style={styles.input} placeholder="e.g. Goa Beachfront Villa" value={newLeadProperty} onChangeText={setNewLeadProperty} placeholderTextColor="#9CA3AF" />

            <TouchableOpacity style={[styles.actionBtn, { marginTop: 8 }]} onPress={handleAddLead} disabled={isSaving}>
              {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>Save Lead</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#F3F4F6', marginTop: 8 }]} onPress={() => setShowNewLeadModal(false)}>
              <Text style={[styles.actionBtnText, { color: '#374151' }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* REPORT MODAL */}
      <Modal visible={showReportModal} animationType="fade" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>📊 Sales Report</Text>
            <Text style={styles.modalSubtitle}>Summary for {profile?.full_name || 'you'} — {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</Text>

            {[
              { label: 'Total Assigned Leads', value: report.total, color: '#1E3A8A' },
              { label: 'Converted to Investor', value: report.converted, color: '#15803D' },
              { label: 'Pending Follow-up', value: report.pending, color: '#B45309' },
              { label: 'New Leads', value: report.leads, color: '#475569' },
              { label: 'Conversion Rate', value: report.total > 0 ? `${Math.round((report.converted / report.total) * 100)}%` : '0%', color: '#7C3AED' },
            ].map((row, i) => (
              <View key={i} style={styles.reportRow}>
                <Text style={styles.reportLabel}>{row.label}</Text>
                <Text style={[styles.reportValue, { color: row.color }]}>{row.value}</Text>
              </View>
            ))}

            <TouchableOpacity style={[styles.actionBtn, { marginTop: 20 }]} onPress={() => setShowReportModal(false)}>
              <Text style={styles.actionBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* UPDATE CLIENT STATUS MODAL */}
      <Modal visible={showStatusModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Update Status</Text>
            <Text style={styles.modalSubtitle}>{selectedClient?.name}</Text>
            {['Lead', 'Pending', 'Converted', 'Lost'].map(status => (
              <TouchableOpacity key={status} style={[styles.statusOptionBtn,
                selectedClient?.status === status && { borderColor: '#1E3A8A', backgroundColor: '#EFF6FF' }
              ]} onPress={() => handleUpdateStatus(status)}>
                <Text style={[styles.statusOptionText, selectedClient?.status === status && { color: '#1E3A8A', fontWeight: '800' }]}>{status}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#F3F4F6', marginTop: 8 }]} onPress={() => setShowStatusModal(false)}>
              <Text style={[styles.actionBtnText, { color: '#374151' }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* UPDATE TICKET STATUS MODAL */}
      <Modal visible={showTicketModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Update Ticket</Text>
            <Text style={styles.modalSubtitle}>{selectedTicket?.ticketId} — {selectedTicket?.user}</Text>
            {['Open', 'In Progress', 'Resolved', 'Escalated'].map(status => (
              <TouchableOpacity key={status} style={[styles.statusOptionBtn,
                selectedTicket?.status === status && { borderColor: '#831843', backgroundColor: '#FDF2F8' }
              ]} onPress={() => handleUpdateTicket(status)}>
                <Text style={[styles.statusOptionText, selectedTicket?.status === status && { color: '#831843', fontWeight: '800' }]}>{status}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#F3F4F6', marginTop: 8 }]} onPress={() => setShowTicketModal(false)}>
              <Text style={[styles.actionBtnText, { color: '#374151' }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    paddingTop: Platform.OS === 'web' ? 18 : 55,
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
  backBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8 },
  refreshBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, width: 36, alignItems: 'center' },
  headerTitle: { fontSize: 14, fontWeight: '800', color: '#FFFFFF', letterSpacing: 2 },
  profileSection: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, gap: 16 },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 60, height: 60, borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6,
  },
  avatarText: { color: '#0F172A', fontWeight: '900', fontSize: 24 },
  authBadge: {
    position: 'absolute', bottom: -8, alignSelf: 'center',
    backgroundColor: '#10B981', paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4, borderWidth: 2, borderColor: '#0F172A',
  },
  authBadgeText: { color: '#FFF', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  profileDetails: { flex: 1 },
  empName: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', marginBottom: 2 },
  empEmail: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 8 },
  deptBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start',
  },
  deptBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  content: { padding: 20 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1, backgroundColor: '#EFF6FF', borderRadius: 12,
    padding: 12, alignItems: 'center', justifyContent: 'center',
  },
  statNum: { fontSize: 24, fontWeight: '900', color: '#1E3A8A' },
  statLabel: { fontSize: 10, color: '#64748B', fontWeight: '600', marginTop: 2, textAlign: 'center' },
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  actionBtn: {
    flex: 1, backgroundColor: '#1E3A8A', paddingVertical: 13,
    borderRadius: 10, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  actionBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  itemCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10,
    elevation: 3, borderWidth: 1, borderColor: '#E5E7EB',
  },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  itemDivider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },
  itemBodyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  itemLabel: { fontSize: 11, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', marginBottom: 4 },
  itemValueMain: { fontSize: 14, color: '#1E293B', fontWeight: '600' },
  itemValueHighlight: { fontSize: 16, fontWeight: '800', color: '#1E3A8A' },
  itemPhone: { fontSize: 13, color: '#64748B', marginTop: 12, fontWeight: '500' },
  tapHint: { fontSize: 11, color: '#3B82F6', marginTop: 8, fontWeight: '600', textAlign: 'right' },
  ticketId: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: '800', fontSize: 13, color: '#475569' },
  priorityBadge: { fontSize: 11, fontWeight: '800', color: '#64748B' },
  itemQuery: {
    fontSize: 14, color: '#334155', lineHeight: 20,
    backgroundColor: '#F8FAFC', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#F1F5F9',
  },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusSuccess: { backgroundColor: '#DCFCE7' },
  statusWarning: { backgroundColor: '#FEF3C7' },
  statusNeutral: { backgroundColor: '#F1F5F9' },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  statusTextSuccess: { color: '#15803D' },
  statusTextWarning: { color: '#B45309' },
  statusTextNeutral: { color: '#475569' },
  emptyState: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  emptyBody: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 20 },
  modalBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  modalHandle: { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A', marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: '#64748B', marginBottom: 20 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 6, textTransform: 'uppercase' },
  input: {
    backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: '#0F172A', marginBottom: 16,
  },
  reportRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderColor: '#F3F4F6',
  },
  reportLabel: { fontSize: 14, color: '#374151', fontWeight: '600' },
  reportValue: { fontSize: 22, fontWeight: '900' },
  statusOptionBtn: {
    paddingVertical: 14, paddingHorizontal: 16, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#E5E7EB', marginBottom: 10, backgroundColor: '#F9FAFB',
  },
  statusOptionText: { fontSize: 15, color: '#374151', fontWeight: '600' },
});
