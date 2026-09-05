import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';
import { auth } from '@/lib/firebase';
import { EmptyState } from '@/components/ui/EmptyState';

export default function AssetDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'agreements'>('overview');

  useEffect(() => {
    fetchAssetDetails();
  }, [id]);

  const fetchAssetDetails = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com'}/api/assets/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAsset(data);
      } else {
        Alert.alert('Error', 'Failed to load asset details');
      }
    } catch (err) {
      console.warn(err);
      Alert.alert('Error', 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDocument = async () => {
    // In a real app, this would open a file picker and upload to Firebase Storage
    // Here we'll just simulate a successful upload by calling the API
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com'}/api/assets/${id}/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: 'Sample Sale Deed',
          document_url: 'https://example.com/document.pdf',
          document_type: 'sale_deed'
        })
      });
      if (res.ok) {
        Alert.alert('Success', 'Document added!');
        fetchAssetDetails();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddAgreement = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com'}/api/assets/${id}/agreements`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tenant_name: 'John Doe',
          start_date: '2026-10-01',
          end_date: '2027-09-30',
          monthly_rent: 45000,
          security_deposit: 135000,
        })
      });
      if (res.ok) {
        Alert.alert('Success', 'Rental agreement created!');
        fetchAssetDetails();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={GoldSystem.primaryGold} />
      </View>
    );
  }

  if (!asset) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Asset not found</Text>
        <TouchableOpacity style={styles.backBtnSolid} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{asset.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>Overview</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'documents' && styles.tabActive]}
          onPress={() => setActiveTab('documents')}
        >
          <Text style={[styles.tabText, activeTab === 'documents' && styles.tabTextActive]}>Documents</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'agreements' && styles.tabActive]}
          onPress={() => setActiveTab('agreements')}
        >
          <Text style={[styles.tabText, activeTab === 'agreements' && styles.tabTextActive]}>Agreements</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ padding: 16 }}>
        {activeTab === 'overview' && (
          <View>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Property Type</Text>
              <Text style={styles.cardValue}>{asset.property_type}</Text>
              
              <Text style={[styles.cardLabel, { marginTop: 16 }]}>Address</Text>
              <Text style={styles.cardValue}>{asset.address}</Text>

              <Text style={[styles.cardLabel, { marginTop: 16 }]}>Purchase Price</Text>
              <Text style={styles.cardValue}>
                {asset.purchase_price ? `₹${Number(asset.purchase_price).toLocaleString('en-IN')}` : 'Not Specified'}
              </Text>
              
              <Text style={[styles.cardLabel, { marginTop: 16 }]}>Added On</Text>
              <Text style={styles.cardValue}>{new Date(asset.created_at).toLocaleDateString()}</Text>
            </View>
          </View>
        )}

        {activeTab === 'documents' && (
          <View>
            <TouchableOpacity style={styles.actionBtn} onPress={handleAddDocument}>
              <Text style={styles.actionBtnText}>+ Upload Document (Demo)</Text>
            </TouchableOpacity>
            
            {asset.documents?.length === 0 ? (
              <EmptyState title="No Documents" subtitle="Upload sale deeds, tax receipts, etc." icon="📄" />
            ) : (
              asset.documents?.map((doc: any) => (
                <View key={doc.id} style={styles.card}>
                  <View style={styles.docHeader}>
                    <Text style={styles.docIcon}>📄</Text>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.docTitle}>{doc.title}</Text>
                      <Text style={styles.docType}>{doc.document_type} • {new Date(doc.uploaded_at).toLocaleDateString()}</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'agreements' && (
          <View>
            <TouchableOpacity style={styles.actionBtn} onPress={handleAddAgreement}>
              <Text style={styles.actionBtnText}>+ Add Rental Agreement (Demo)</Text>
            </TouchableOpacity>

            {asset.rental_agreements?.length === 0 ? (
              <EmptyState title="No Agreements" subtitle="Manage your tenants and leases here." icon="🤝" />
            ) : (
              asset.rental_agreements?.map((agr: any) => (
                <View key={agr.id} style={styles.card}>
                  <Text style={styles.agrTenant}>{agr.tenant_name}</Text>
                  <Text style={styles.agrDate}>
                    {new Date(agr.start_date).toLocaleDateString()} to {new Date(agr.end_date).toLocaleDateString()}
                  </Text>
                  <View style={styles.agrStats}>
                    <View style={styles.agrStat}>
                      <Text style={styles.agrStatLabel}>Rent / Mo</Text>
                      <Text style={styles.agrStatValue}>₹{Number(agr.monthly_rent).toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.agrStat}>
                      <Text style={styles.agrStatLabel}>Deposit</Text>
                      <Text style={styles.agrStatValue}>₹{Number(agr.security_deposit).toLocaleString('en-IN')}</Text>
                    </View>
                  </View>
                  <Text style={[styles.agrStatus, { color: agr.status === 'active' ? '#16A34A' : '#64748B' }]}>
                    {agr.status.toUpperCase()}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Neutrals.background },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Neutrals.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, paddingTop: Platform.OS === 'web' ? 18 : 50, backgroundColor: Neutrals.surface,
    borderBottomWidth: 1, borderBottomColor: Neutrals.border,
  },
  backBtn: { padding: 8, marginLeft: -8 },
  backIcon: { fontSize: 24, color: Neutrals.obsidian },
  headerTitle: { ...Typography.headlineMedium, color: Neutrals.obsidian, flex: 1, textAlign: 'center' },
  tabs: { flexDirection: 'row', backgroundColor: Neutrals.surface, borderBottomWidth: 1, borderBottomColor: Neutrals.border },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: Neutrals.obsidian },
  tabText: { ...Typography.labelMedium, color: Neutrals.gray500 },
  tabTextActive: { color: Neutrals.obsidian, fontWeight: '700' },
  content: { flex: 1 },
  card: {
    backgroundColor: Neutrals.surface, padding: 16, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Neutrals.border, marginBottom: 16, ...Shadows.soft
  },
  cardLabel: { ...Typography.caption, color: Neutrals.gray500, marginBottom: 4 },
  cardValue: { ...Typography.bodyLarge, color: Neutrals.obsidian },
  errorText: { ...Typography.headlineMedium, color: Neutrals.obsidian, marginBottom: 16 },
  backBtnSolid: { backgroundColor: Neutrals.obsidian, paddingHorizontal: 24, paddingVertical: 12, borderRadius: Radius.md },
  backBtnText: { color: Neutrals.surface, ...Typography.labelLarge },
  actionBtn: { backgroundColor: '#F8FAFC', padding: 16, borderRadius: Radius.md, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', marginBottom: 16, borderStyle: 'dashed' },
  actionBtnText: { ...Typography.labelMedium, color: '#3B82F6' },
  docHeader: { flexDirection: 'row', alignItems: 'center' },
  docIcon: { fontSize: 24 },
  docTitle: { ...Typography.labelMedium, color: Neutrals.obsidian },
  docType: { ...Typography.caption, color: Neutrals.gray500 },
  agrTenant: { ...Typography.headlineMedium, color: Neutrals.obsidian },
  agrDate: { ...Typography.bodyMedium, color: Neutrals.gray600, marginBottom: 12 },
  agrStats: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: Neutrals.border, paddingTop: 12 },
  agrStat: { flex: 1 },
  agrStatLabel: { ...Typography.caption, color: Neutrals.gray500 },
  agrStatValue: { ...Typography.labelLarge, color: Neutrals.obsidian },
  agrStatus: { marginTop: 12, ...Typography.labelSmall, fontWeight: '700' }
});
