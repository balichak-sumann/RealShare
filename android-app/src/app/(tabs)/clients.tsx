import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { EmptyState } from '@/components/ui/EmptyState';
import { auth } from '@/lib/firebase';
import { useRouter } from 'expo-router';
import { TabAnimationWrapper } from '@/components/ui/TabAnimationWrapper';

export default function ClientsScreen() {
  const router = useRouter();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientBudget, setNewClientBudget] = useState('');

  React.useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com'}/api/agents/clients`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      }
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = async () => {
    if (!newClientName || !newClientPhone) {
      Alert.alert('Error', 'Name and Phone are required.');
      return;
    }
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com'}/api/agents/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: newClientName, phone: newClientPhone, budget: newClientBudget })
      });
      if (res.ok) {
        Alert.alert('Success', 'Client added successfully!');
        setShowAddClientModal(false);
        setNewClientName('');
        setNewClientPhone('');
        setNewClientBudget('');
        fetchClients();
      } else {
        const errorData = await res.json();
        Alert.alert('Error', errorData.error || 'Failed to add client');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'An error occurred while adding client');
    }
  };

  return (
    <TabAnimationWrapper>
      <View style={styles.container}>
        <LinearGradient colors={['#111827', '#1E293B']} style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Client Hub</Text>
            <Text style={styles.headerSubtitle}>Manage leads and chat securely</Text>
          </View>
        </LinearGradient>

        <ScrollView style={styles.listContainer} contentContainerStyle={styles.listContent}>
          <View style={styles.actionsRow}>
            <Text style={styles.countText}>{clients.length} Active Clients</Text>
            <TouchableOpacity style={styles.actionBtn} onPress={() => setShowAddClientModal(true)}>
              <Text style={styles.actionBtnText}>+ Add New Client</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#D4AF37" style={{ marginTop: 40 }} />
          ) : clients.length === 0 ? (
            <EmptyState title="No clients yet" subtitle="Add your first client to start pitching properties." icon="👥" />
          ) : (
            clients.map(client => (
              <TouchableOpacity key={client.id} style={styles.clientCard} onPress={() => router.push(`/chat/${client.id}` as any)}>
                <View style={styles.clientHeader}>
                  <View style={styles.clientAvatar}>
                    <Text style={styles.clientAvatarText}>{client.client_name?.charAt(0) || 'C'}</Text>
                  </View>
                  <View style={styles.clientInfo}>
                    <Text style={styles.clientName}>{client.client_name}</Text>
                    <Text style={styles.clientPhone}>{client.phone_number}</Text>
                  </View>
                  <View style={styles.chatBadge}>
                    <Text style={styles.chatBadgeText}>💬 Chat</Text>
                  </View>
                </View>
                <View style={styles.clientFooter}>
                  <Text style={styles.clientBudgetText}>Budget: {client.target_budget || 'N/A'}</Text>
                  <Text style={styles.statusText}>{client.status || 'Hot Lead'}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        {/* Add New Client Modal */}
        <Modal visible={showAddClientModal} animationType="fade" transparent>
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalSheet, { borderTopLeftRadius: 16, borderTopRightRadius: 16, borderRadius: 16, margin: 24, paddingBottom: 24 }]}>
              <Text style={styles.modalTitle}>Add New Client</Text>
              
              <Text style={styles.inputLabel}>Client Name</Text>
              <TextInput style={styles.input} placeholder="e.g. Vikram Singh" value={newClientName} onChangeText={setNewClientName} />
              
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput style={styles.input} placeholder="e.g. +91 98765 43210" keyboardType="phone-pad" value={newClientPhone} onChangeText={setNewClientPhone} />
              
              <Text style={styles.inputLabel}>Target Budget</Text>
              <TextInput style={styles.input} placeholder="e.g. ₹5.0 Cr" value={newClientBudget} onChangeText={setNewClientBudget} />

              <TouchableOpacity style={[styles.saveBtn, { marginTop: 20 }]} onPress={handleAddClient}>
                <Text style={styles.saveBtnText}>Save Client</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setShowAddClientModal(false)}>
                <Text style={styles.cancelModalText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </TabAnimationWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingTop: Platform.OS === 'web' ? 40 : 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 10,
  },
  headerContent: { maxWidth: 1000, alignSelf: 'center', width: '100%' },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#FFFFFF', marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: '#94A3B8' },
  listContainer: { flex: 1 },
  listContent: { padding: 24, paddingTop: 32, paddingBottom: 120, maxWidth: 1000, alignSelf: 'center', width: '100%' },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  countText: { fontSize: 14, fontWeight: '700', color: '#4B5563' },
  actionBtn: { backgroundColor: '#111827', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  actionBtnText: { color: '#D4AF37', fontSize: 12, fontWeight: '800' },
  clientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },
  clientHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  clientAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  clientAvatarText: { fontSize: 20, fontWeight: '900', color: '#111827' },
  clientInfo: { flex: 1 },
  clientName: { fontSize: 16, fontWeight: '800', color: '#111827' },
  clientPhone: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  chatBadge: { backgroundColor: '#111827', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  chatBadgeText: { color: '#D4AF37', fontSize: 11, fontWeight: '800' },
  clientFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 16 },
  clientBudgetText: { fontSize: 14, fontWeight: '700', color: '#111827' },
  statusText: { color: '#059669', fontSize: 12, fontWeight: '800' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center' },
  modalSheet: { backgroundColor: '#FFFFFF', padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A', marginBottom: 4 },
  inputLabel: { fontSize: 12, fontWeight: '800', color: '#64748B', marginBottom: 8, marginTop: 16, textTransform: 'uppercase' },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#0F172A' },
  saveBtn: { backgroundColor: '#111827', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { color: '#D4AF37', fontSize: 14, fontWeight: '800' },
  cancelModalBtn: { backgroundColor: '#F3F4F6', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 16 },
  cancelModalText: { color: '#374151', fontWeight: '700', fontSize: 14 },
});
