import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Modal, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';
import { useShortlist } from '@/contexts/ShortlistContext';
import { PropertyCard } from '@/components/ui/PropertyCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { useRouter } from 'expo-router';
import { GuestView } from '@/components/ui/GuestView';
import { auth } from '@/lib/firebase';
import { TabAnimationWrapper } from '@/components/ui/TabAnimationWrapper';
import { useUser } from '@/contexts/UserContext';
import { AgentListingsScreen } from '@/components/agent/AgentListingsScreen';
import { Ionicons } from '@expo/vector-icons';
import { ResponsiveGrid } from '@/components/layout/ResponsiveGrid';

const COLLECTIONS = ['All Saved', 'Dream Home', 'Investment', 'Compare Later'];

export default function ShortlistScreen() {
  const { profile } = useUser();
  const isAgent = profile?.role === 'agent';
  const [agentTab, setAgentTab] = useState<'My Properties' | 'Shortlist'>('My Properties');

  const router = useRouter();
  const { savedProperties } = useShortlist();
  const [activeTab, setActiveTab] = useState(COLLECTIONS[0]);
  
  const [realProperties, setRealProperties] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedPropertyForAssign, setSelectedPropertyForAssign] = useState<any>(null);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch properties
        const propRes = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com'}/api/properties`);
        if (propRes.ok) {
          const propData = await propRes.json();
          const mappedProps = propData.map((p: any) => ({
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
          setRealProperties(mappedProps);
        }

        // Fetch clients if agent
        if (isAgent && auth.currentUser) {
          const token = await auth.currentUser.getIdToken();
          const clientRes = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com'}/api/agents/clients`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (clientRes.ok) {
            const clientData = await clientRes.json();
            setClients(clientData);
          }
        }
      } catch (err) {
        console.error('Failed to fetch shortlist data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAgent]);
  
  if (!auth.currentUser) {
    return (
      <TabAnimationWrapper>
      <GuestView 
        title="Saved Properties" 
        description="Sign in to save your favorite properties and compare them later." 
        icon="♡"
      />
      </TabAnimationWrapper>
    );
  }

  const properties = realProperties.filter(p => savedProperties.includes(p.id));

  const handleAssignToClient = async (clientId: string) => {
    if (!selectedPropertyForAssign) return;
    setAssigning(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com'}/api/agents/clients/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          client_id: clientId,
          property_id: selectedPropertyForAssign.id
        })
      });
      
      if (res.ok) {
        Alert.alert('Success', 'Property assigned to client successfully!');
        setShowAssignModal(false);
      } else {
        const err = await res.json();
        // If it's a unique constraint error (already assigned), show a nice message
        if (err.error?.includes('Unique constraint')) {
          Alert.alert('Already Assigned', 'This property is already assigned to this client.');
        } else {
          Alert.alert('Error', err.error || 'Failed to assign property');
        }
      }
    } catch (err) {
      Alert.alert('Error', 'Network error occurred while assigning.');
    } finally {
      setAssigning(false);
    }
  };

  const renderAssignModal = () => (
    <Modal visible={showAssignModal} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Assign to Client</Text>
            <TouchableOpacity onPress={() => setShowAssignModal(false)}>
              <Ionicons name="close" size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.modalSubtitle}>Select a client to assign "{selectedPropertyForAssign?.title}" to:</Text>
          
          <ScrollView style={styles.clientList}>
            {clients.length === 0 ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: '#6B7280' }}>You don't have any clients yet.</Text>
                <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 4 }}>Add clients from the Clients tab.</Text>
              </View>
            ) : (
              clients.map(client => (
                <TouchableOpacity 
                  key={client.id} 
                  style={styles.clientItem}
                  onPress={() => handleAssignToClient(client.id)}
                  disabled={assigning}
                >
                  <View style={styles.clientAvatar}>
                    <Text style={styles.clientInitials}>{client.name.substring(0, 2).toUpperCase()}</Text>
                  </View>
                  <View style={styles.clientInfo}>
                    <Text style={styles.clientName}>{client.name}</Text>
                    <Text style={styles.clientPhone}>{client.phone}</Text>
                  </View>
                  {assigning ? (
                    <ActivityIndicator size="small" color="#D4AF37" />
                  ) : (
                    <Text style={{ color: '#D4AF37', fontWeight: '700' }}>Assign</Text>
                  )}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderShortlistContent = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shortlist</Text>
        <TouchableOpacity style={styles.addBtn}>
          <Text style={styles.addIcon}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer} contentContainerStyle={styles.tabsContent}>
        {COLLECTIONS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.activeTabBtn]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#D4AF37" />
        </View>
      ) : (
        <ScrollView style={styles.listContainer} contentContainerStyle={styles.listContent}>
          {properties.length === 0 ? (
            <EmptyState
              icon="♡"
              title="No properties saved"
              subtitle="Properties you shortlist will appear here."
              actionTitle="Explore Properties"
              onAction={() => router.push('/explore' as any)}
            />
          ) : (
            <>
              <View style={styles.actionsRow}>
                <Text style={styles.countText}>{properties.length} Properties</Text>
                <TouchableOpacity onPress={() => router.push('/compare' as any)}>
                  <Text style={styles.compareText}>Compare Selected</Text>
                </TouchableOpacity>
              </View>

              <ResponsiveGrid>
              {properties.map(prop => (
                <View key={prop.id} style={styles.cardWrapper}>
                  <PropertyCard {...prop} />
                  
                  {isAgent && (
                    <TouchableOpacity 
                      style={styles.assignBtn}
                      onPress={() => {
                        setSelectedPropertyForAssign(prop);
                        setShowAssignModal(true);
                      }}
                    >
                      <LinearGradient colors={['#D4AF37', '#B8860B']} style={styles.assignGradient}>
                        <Text style={styles.assignBtnText}>Assign to Client</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                  
                  {/* Overlay Checkbox for Compare */}
                  {!isAgent && (
                    <TouchableOpacity style={styles.checkboxOverlay}>
                      <View style={styles.checkbox} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              </ResponsiveGrid>
            </>
          )}
        </ScrollView>
      )}
      
      {renderAssignModal()}
    </View>
  );

  if (isAgent) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F3F4F6' }}>
        <View style={styles.agentTabBar}>
          <TouchableOpacity 
            style={[styles.agentTab, agentTab === 'My Properties' && styles.agentTabActive]} 
            onPress={() => setAgentTab('My Properties')}
          >
            <Text style={[styles.agentTabText, agentTab === 'My Properties' && styles.agentTabTextActive]}>List of Properties</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.agentTab, agentTab === 'Shortlist' && styles.agentTabActive]} 
            onPress={() => setAgentTab('Shortlist')}
          >
            <Text style={[styles.agentTabText, agentTab === 'Shortlist' && styles.agentTabTextActive]}>Shortlisted Properties</Text>
          </TouchableOpacity>
        </View>

        {agentTab === 'My Properties' ? <AgentListingsScreen /> : renderShortlistContent()}
      </View>
    );
  }

  return (
    <TabAnimationWrapper>
      {renderShortlistContent()}
    </TabAnimationWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Neutrals.background,
  },
  agentTabBar: {
    flexDirection: 'row',
    paddingTop: Platform.OS === 'web' ? 20 : 60,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  agentTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  agentTabActive: {
    borderBottomColor: '#D4AF37',
  },
  agentTabText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  agentTabTextActive: {
    color: '#D4AF37',
    fontWeight: '800',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'web' ? 20 : 60,
    backgroundColor: Neutrals.surface,
  },
  headerTitle: {
    ...Typography.displayMedium,
    color: Neutrals.obsidian,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Neutrals.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIcon: {
    fontSize: 24,
    color: Neutrals.obsidian,
  },
  tabsContainer: {
    backgroundColor: Neutrals.surface,
    borderBottomWidth: 1,
    borderBottomColor: Neutrals.border,
    maxHeight: 60, // Fixed height so they don't get squished
  },
  tabsContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Neutrals.gray100,
    marginRight: 8,
    height: 36,
    justifyContent: 'center',
  },
  activeTabBtn: {
    backgroundColor: Neutrals.obsidian,
  },
  tabText: {
    ...Typography.labelMedium,
    color: Neutrals.gray600,
  },
  activeTabText: {
    color: Neutrals.surface,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  countText: {
    ...Typography.labelMedium,
    color: Neutrals.obsidian,
  },
  compareText: {
    ...Typography.labelMedium,
    color: GoldSystem.primaryGold,
  },
  cardWrapper: {
    position: 'relative',
    marginBottom: 32, // More margin for the button
  },
  checkboxOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Neutrals.surface,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  assignBtn: {
    marginTop: -16, // Pull it up slightly over the bottom of the card
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 2,
  },
  assignGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignBtnText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '800',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  clientList: {
    maxHeight: 400,
  },
  clientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  clientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FDE68A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  clientInitials: {
    color: '#92400E',
    fontWeight: 'bold',
    fontSize: 14,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  clientPhone: {
    fontSize: 13,
    color: '#6B7280',
  },
});
