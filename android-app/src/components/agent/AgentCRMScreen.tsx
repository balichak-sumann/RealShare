import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, Dimensions, Platform, TextInput, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';
import { MOCK_PROPERTIES } from '@/constants/mockData';
import { PropertyCard } from '@/components/ui/PropertyCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { auth } from '@/lib/firebase';
import { useRouter } from 'expo-router';

export function AgentCRMScreen() {
  const router = useRouter();
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientBudget, setNewClientBudget] = useState('');

  React.useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchClients(), fetchProperties()]);
    setLoading(false);
  };

  const fetchProperties = async () => {
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com'}/api/properties`);
      if (res.ok) {
        const data = await res.json();
        const mappedProperties = data.map((p: any) => ({
          id: p.id,
          title: p.title,
          location: `${p.locality}, ${p.district}`,
          price: `₹ ${(Number(p.price_per_fraction) || 50000).toLocaleString('en-IN')}`,
          images: p.images?.length > 0 ? p.images.map((img: any) => img.image_url) : ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1000'],
          bhk: p.property_type,
          area: 'Premium',
          score: p.target_irr || 15.0,
          isVerified: true
        }));
        setProperties(mappedProperties);
      }
    } catch (err) {
      console.error('Failed to fetch properties:', err);
      setProperties(MOCK_PROPERTIES); // Fallback to mock data if no DB connection
    }
  };

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
        fetchClients(); // Refresh list
      } else {
        Alert.alert('Error', 'Failed to add client.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Network error.');
    }
  };

  const confirmAssignProperty = async (clientId: string) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com'}/api/agents/clients/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ clientId, propertyId: selectedProperty.id })
      });
      if (res.ok) {
        Alert.alert('Success', 'Property assigned to client successfully!');
        setShowAssignModal(false);
        fetchClients(); // Refresh assignments
      } else {
        const data = await res.json();
        Alert.alert('Notice', data.error || 'Failed to assign property.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Network error.');
    }
  };

  const handleAssignProperty = (prop: any) => {
    setSelectedProperty(prop);
    setShowAssignModal(true);
  };

  const renderPropertiesTab = () => (
    <ScrollView style={styles.listContainer} contentContainerStyle={styles.listContent}>
      <View style={styles.actionsRow}>
        <Text style={styles.countText}>{properties.length} Shortlisted Properties</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#D4AF37" style={{ marginTop: 40 }} />
      ) : properties.length === 0 ? (
        <EmptyState title="No properties found" subtitle="Explore properties to shortlist them." icon="🏢" />
      ) : (
        properties.map(prop => (
          <View key={prop.id} style={styles.cardWrapper}>
            <PropertyCard {...prop} compact={false} />
            
            <View style={styles.assignOverlay}>
              <TouchableOpacity 
                style={styles.assignBtn}
                onPress={() => handleAssignProperty(prop)}
              >
                <Text style={styles.assignBtnText}>+ Assign to Client</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#111827', '#1E293B']} style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>CRM Workspace</Text>
          <Text style={styles.headerSubtitle}>Manage clients and pitch properties</Text>
        </View>
      </LinearGradient>

      {/* Tabs - Removed, now strictly just Shortlisted Properties */}
      <View style={{ flex: 1 }}>
        {renderPropertiesTab()}
      </View>

      {/* Assign to Client Modal */}
      <Modal visible={showAssignModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Assign to Client</Text>
            <Text style={styles.modalSubtitle}>Select a client to pitch {selectedProperty?.title} to.</Text>

            {clients.map(client => (
              <TouchableOpacity key={client.id} style={styles.modalClientRow} onPress={() => confirmAssignProperty(client.id)}>
                <Text style={styles.modalClientName}>{client.name}</Text>
                <Text style={styles.modalClientBudget}>Budget: {client.budget}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setShowAssignModal(false)}>
              <Text style={styles.cancelModalText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Sleek ultra-light slate
  },
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
  headerContent: {
    maxWidth: 1000,
    alignSelf: 'center',
    width: '100%',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#D4AF37', // Gold
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginTop: -20, // Overlap the header
    borderRadius: 16,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
    zIndex: 11,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  activeTabBtn: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  activeTabText: {
    color: '#111827',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 24,
    paddingTop: 32,
    paddingBottom: 120,
    maxWidth: 1000,
    alignSelf: 'center',
    width: '100%',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  countText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
  },
  actionBtn: {
    backgroundColor: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionBtnText: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: '800',
  },
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
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  clientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  clientAvatarText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  clientPhone: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  statusText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '800',
  },
  clientFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 16,
  },
  clientLabel: {
    fontSize: 11,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clientBudget: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
    marginTop: 4,
  },
  viewPitchedBtn: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  viewPitchedBtnText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
  },
  cardWrapper: {
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  assignOverlay: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  assignBtn: {
    backgroundColor: '#111827',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  assignBtnText: {
    color: '#D4AF37',
    fontSize: 14,
    fontWeight: '800',
  },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A', marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: '#64748B', marginBottom: 20 },
  modalClientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalClientName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  modalClientBudget: {
    fontSize: 14,
    color: '#6B7280',
  },
  cancelModalBtn: { backgroundColor: '#F3F4F6', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 24 },
  cancelModalText: { color: '#374151', fontWeight: '700', fontSize: 14 },
  inputLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 8,
    marginTop: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#0F172A',
  },
});
