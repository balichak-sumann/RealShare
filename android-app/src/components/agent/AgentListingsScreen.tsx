import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
  ActivityIndicator, Alert, Modal, TextInput, Platform, RefreshControl, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';
import { auth } from '@/lib/firebase';
import { useRouter } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CATEGORIES = [
  'Residential', 'Commercial', 'Holiday', 'Rental', 'Re-sale', 'Fractional'
];

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  pending_approval: { bg: '#FEF3C7', text: '#B45309', label: 'Pending' },
  approved: { bg: '#D1FAE5', text: '#065F46', label: 'Approved' },
  rejected: { bg: '#FEE2E2', text: '#991B1B', label: 'Rejected' },
  draft: { bg: '#E5E7EB', text: '#374151', label: 'Draft' },
  sold_out: { bg: '#DBEAFE', text: '#1E40AF', label: 'Sold Out' },
};

interface Listing {
  id: string;
  title: string;
  description?: string;
  property_type: string;
  total_fractions: number;
  available_fractions: number;
  price_per_fraction: string;
  assured_yield?: string;
  target_irr?: string;
  state: string;
  district: string;
  locality: string;
  full_address?: string;
  approval_status: string;
  rejection_notes?: string;
  images: { image_url: string }[];
  created_at: string;
}

export function AgentListingsScreen() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [propertyType, setPropertyType] = useState('Residential');
  const [totalFractions, setTotalFractions] = useState('100');
  const [pricePerFraction, setPricePerFraction] = useState('');
  const [assuredYield, setAssuredYield] = useState('');
  const [targetIrr, setTargetIrr] = useState('');
  const [stateName, setStateName] = useState('');
  const [district, setDistrict] = useState('');
  const [locality, setLocality] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com'}/api/agents/listings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setListings(data);
      }
    } catch (err) {
      console.error('Failed to fetch listings:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const resetForm = () => {
    setTitle(''); setDescription(''); setPropertyType('Residential');
    setTotalFractions('100'); setPricePerFraction('');
    setAssuredYield(''); setTargetIrr('');
    setStateName(''); setDistrict(''); setLocality('');
    setFullAddress(''); setImageUrl(''); setContactPhone('');
  };

  const handleSubmitListing = async () => {
    if (!title.trim() || !pricePerFraction.trim() || !stateName.trim() || !district.trim() || !locality.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all required fields: Title, Price, State, District, and Locality.');
      return;
    }
    setSubmitting(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com'}/api/properties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          property_type: propertyType,
          total_fractions: parseInt(totalFractions) || 100,
          available_fractions: parseInt(totalFractions) || 100,
          price_per_fraction: parseFloat(pricePerFraction),
          assured_yield: assuredYield ? parseFloat(assuredYield) : null,
          target_irr: targetIrr ? parseFloat(targetIrr) : null,
          state: stateName.trim(),
          district: district.trim(),
          locality: locality.trim(),
          full_address: fullAddress.trim() || null,
          image_url: imageUrl.trim() || null,
        }),
      });
      if (res.ok) {
        Alert.alert('Submitted!', 'Your listing has been submitted for admin approval. You can track its status here.');
        setShowSubmitForm(false);
        resetForm();
        fetchListings();
      } else {
        const err = await res.json();
        Alert.alert('Error', err.error || 'Failed to submit listing.');
      }
    } catch (err) {
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditListing = async () => {
    if (!editingListing) return;
    setSubmitting(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com'}/api/agents/listings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: editingListing.id,
          title: title.trim(),
          description: description.trim(),
          property_type: propertyType,
          total_fractions: parseInt(totalFractions) || 100,
          available_fractions: parseInt(totalFractions) || 100,
          price_per_fraction: parseFloat(pricePerFraction),
          assured_yield: assuredYield ? parseFloat(assuredYield) : null,
          target_irr: targetIrr ? parseFloat(targetIrr) : null,
          state: stateName.trim(),
          district: district.trim(),
          locality: locality.trim(),
          full_address: fullAddress.trim() || null,
        }),
      });
      if (res.ok) {
        Alert.alert('Updated!', 'Your listing has been updated.');
        setShowEditForm(false);
        setEditingListing(null);
        resetForm();
        fetchListings();
      } else {
        Alert.alert('Error', 'Failed to update listing.');
      }
    } catch (err) {
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = (listing: Listing) => {
    Alert.alert(
      'Withdraw Listing',
      `Are you sure you want to withdraw "${listing.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw', style: 'destructive', onPress: async () => {
            try {
              const token = await auth.currentUser?.getIdToken();
              const res = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com'}/api/agents/listings?id=${listing.id}`,
                { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
              );
              if (res.ok) {
                Alert.alert('Withdrawn', 'Listing has been withdrawn.');
                fetchListings();
              }
            } catch (err) {
              Alert.alert('Error', 'Failed to withdraw listing.');
            }
          }
        }
      ]
    );
  };

  const openEditForm = (listing: Listing) => {
    setEditingListing(listing);
    setTitle(listing.title);
    setDescription(listing.description || '');
    setPropertyType(listing.property_type);
    setTotalFractions(String(listing.total_fractions));
    setPricePerFraction(String(listing.price_per_fraction));
    setAssuredYield(listing.assured_yield ? String(listing.assured_yield) : '');
    setTargetIrr(listing.target_irr ? String(listing.target_irr) : '');
    setStateName(listing.state);
    setDistrict(listing.district);
    setLocality(listing.locality);
    setFullAddress(listing.full_address || '');
    setShowEditForm(true);
  };

  const FILTERS = ['All', 'Pending', 'Approved', 'Rejected'];

  const filteredListings = listings.filter(l => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Pending') return l.approval_status === 'pending_approval' || l.approval_status === 'draft';
    if (activeFilter === 'Approved') return l.approval_status === 'approved';
    if (activeFilter === 'Rejected') return l.approval_status === 'rejected';
    return true;
  });

  const stats = {
    total: listings.length,
    pending: listings.filter(l => l.approval_status === 'pending_approval' || l.approval_status === 'draft').length,
    approved: listings.filter(l => l.approval_status === 'approved').length,
    rejected: listings.filter(l => l.approval_status === 'rejected').length,
  };

  // ----- FORM MODAL -----
  const renderFormModal = (isEdit: boolean) => (
    <Modal visible={isEdit ? showEditForm : showSubmitForm} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.formContainer}>
        <LinearGradient colors={['#111827', '#1E293B']} style={styles.formHeader}>
          <TouchableOpacity onPress={() => { isEdit ? setShowEditForm(false) : setShowSubmitForm(false); resetForm(); }}>
            <Text style={{ color: '#D4AF37', fontSize: 16, fontWeight: '700' }}>Cancel</Text>
          </TouchableOpacity>
          <Text style={{ color: '#FFF', fontSize: 17, fontWeight: '800' }}>{isEdit ? 'Edit Listing' : 'Submit New Listing'}</Text>
          <View style={{ width: 50 }} />
        </LinearGradient>

        <ScrollView style={styles.formBody} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Property Name */}
          <Text style={styles.fieldLabel}>Property Name *</Text>
          <TextInput style={styles.fieldInput} value={title} onChangeText={setTitle} placeholder="e.g. Luxury 3BHK Villa" placeholderTextColor="#9CA3AF" />

          {/* Description */}
          <Text style={styles.fieldLabel}>Description</Text>
          <TextInput style={[styles.fieldInput, { height: 80, textAlignVertical: 'top' }]} value={description} onChangeText={setDescription} placeholder="Describe the property..." placeholderTextColor="#9CA3AF" multiline />

          {/* Category */}
          <Text style={styles.fieldLabel}>Category *</Text>
          <View style={styles.categoryRow}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, propertyType === cat && styles.categoryChipActive]}
                onPress={() => setPropertyType(cat)}
              >
                <Text style={[styles.categoryChipText, propertyType === cat && styles.categoryChipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Location */}
          <Text style={styles.sectionLabel}>📍 Location</Text>
          <Text style={styles.fieldLabel}>State *</Text>
          <TextInput style={styles.fieldInput} value={stateName} onChangeText={setStateName} placeholder="e.g. Telangana" placeholderTextColor="#9CA3AF" />
          <Text style={styles.fieldLabel}>District *</Text>
          <TextInput style={styles.fieldInput} value={district} onChangeText={setDistrict} placeholder="e.g. Hyderabad" placeholderTextColor="#9CA3AF" />
          <Text style={styles.fieldLabel}>Locality *</Text>
          <TextInput style={styles.fieldInput} value={locality} onChangeText={setLocality} placeholder="e.g. Gachibowli" placeholderTextColor="#9CA3AF" />
          <Text style={styles.fieldLabel}>Full Address</Text>
          <TextInput style={styles.fieldInput} value={fullAddress} onChangeText={setFullAddress} placeholder="e.g. Plot No 42, Tech Park Road" placeholderTextColor="#9CA3AF" />

          {/* Pricing */}
          <Text style={styles.sectionLabel}>💰 Pricing</Text>
          <Text style={styles.fieldLabel}>Price per Fraction (₹) *</Text>
          <TextInput style={styles.fieldInput} value={pricePerFraction} onChangeText={setPricePerFraction} placeholder="e.g. 50000" keyboardType="numeric" placeholderTextColor="#9CA3AF" />

          {/* Fractional Fields */}
          {(propertyType === 'Fractional' || true) && (
            <>
              <Text style={styles.fieldLabel}>Total Fractions / Shares</Text>
              <TextInput style={styles.fieldInput} value={totalFractions} onChangeText={setTotalFractions} placeholder="e.g. 100" keyboardType="numeric" placeholderTextColor="#9CA3AF" />
              <Text style={styles.fieldLabel}>Expected Yield (%)</Text>
              <TextInput style={styles.fieldInput} value={assuredYield} onChangeText={setAssuredYield} placeholder="e.g. 8.5" keyboardType="numeric" placeholderTextColor="#9CA3AF" />
              <Text style={styles.fieldLabel}>Target IRR (%)</Text>
              <TextInput style={styles.fieldInput} value={targetIrr} onChangeText={setTargetIrr} placeholder="e.g. 15.0" keyboardType="numeric" placeholderTextColor="#9CA3AF" />
            </>
          )}

          {/* Photo URL (simplified for now) */}
          {!isEdit && (
            <>
              <Text style={styles.sectionLabel}>📸 Photo</Text>
              <Text style={styles.fieldLabel}>Image URL</Text>
              <TextInput style={styles.fieldInput} value={imageUrl} onChangeText={setImageUrl} placeholder="https://example.com/photo.jpg" placeholderTextColor="#9CA3AF" />
            </>
          )}

          {/* Contact */}
          {!isEdit && (
            <>
              <Text style={styles.sectionLabel}>📞 Contact</Text>
              <Text style={styles.fieldLabel}>Contact Phone</Text>
              <TextInput style={styles.fieldInput} value={contactPhone} onChangeText={setContactPhone} placeholder="e.g. +91 9876543210" keyboardType="phone-pad" placeholderTextColor="#9CA3AF" />
            </>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={isEdit ? handleEditListing : handleSubmitListing}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#111827" />
            ) : (
              <Text style={styles.submitBtnText}>{isEdit ? 'Save Changes' : 'Submit for Approval'}</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );

  // ----- MAIN RENDER -----
  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#111827', '#1E293B']} style={styles.header}>
        <Text style={styles.headerTitle}>My Listings</Text>
        <Text style={styles.headerSubtitle}>Manage your property submissions</Text>
      </LinearGradient>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statCard, { borderColor: '#FDE68A' }]}>
          <Text style={[styles.statValue, { color: '#B45309' }]}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={[styles.statCard, { borderColor: '#A7F3D0' }]}>
          <Text style={[styles.statValue, { color: '#065F46' }]}>{stats.approved}</Text>
          <Text style={styles.statLabel}>Live</Text>
        </View>
        <View style={[styles.statCard, { borderColor: '#FECACA' }]}>
          <Text style={[styles.statValue, { color: '#991B1B' }]}>{stats.rejected}</Text>
          <Text style={styles.statLabel}>Rejected</Text>
        </View>
      </View>

      {/* Submit Button */}
      <TouchableOpacity style={styles.addListingBtn} onPress={() => { resetForm(); setShowSubmitForm(true); }}>
        <LinearGradient colors={['#D4AF37', '#B8860B']} style={styles.addListingGradient}>
          <Text style={styles.addListingBtnText}>+ Submit New Listing</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Filters */}
      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.filterChipText, activeFilter === f && styles.filterChipTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Listings */}
      <ScrollView
        style={styles.listingsScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchListings(); }} tintColor="#D4AF37" />}
      >
        {filteredListings.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏗️</Text>
            <Text style={styles.emptyTitle}>{activeFilter === 'All' ? 'No listings yet' : `No ${activeFilter.toLowerCase()} listings`}</Text>
            <Text style={styles.emptySubtitle}>Tap the button above to submit your first property listing!</Text>
          </View>
        ) : (
          filteredListings.map(listing => {
            const statusInfo = STATUS_COLORS[listing.approval_status] || STATUS_COLORS.draft;
            const isPending = listing.approval_status === 'pending_approval' || listing.approval_status === 'draft';
            const imageUri = listing.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=600';

            return (
              <View key={listing.id} style={styles.listingCard}>
                <Image source={{ uri: imageUri }} style={styles.listingImage} />

                {/* Status Badge */}
                <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
                  <Text style={[styles.statusBadgeText, { color: statusInfo.text }]}>{statusInfo.label}</Text>
                </View>

                <View style={styles.listingInfo}>
                  <Text style={styles.listingTitle} numberOfLines={1}>{listing.title}</Text>
                  <Text style={styles.listingLocation} numberOfLines={1}>📍 {listing.locality}, {listing.district}, {listing.state}</Text>

                  <View style={styles.listingMeta}>
                    <Text style={styles.listingMetaItem}>🏷️ {listing.property_type}</Text>
                    <Text style={styles.listingMetaItem}>💰 ₹{Number(listing.price_per_fraction).toLocaleString('en-IN')}/fraction</Text>
                  </View>

                  {listing.approval_status === 'rejected' && listing.rejection_notes && (
                    <View style={styles.rejectionNote}>
                      <Text style={styles.rejectionNoteText}>❌ Reason: {listing.rejection_notes}</Text>
                    </View>
                  )}

                  {/* Actions */}
                  {isPending && (
                    <View style={styles.listingActions}>
                      <TouchableOpacity style={styles.editBtn} onPress={() => openEditForm(listing)}>
                        <Text style={styles.editBtnText}>✏️ Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.withdrawBtn} onPress={() => handleWithdraw(listing)}>
                        <Text style={styles.withdrawBtnText}>🗑️ Withdraw</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  <Text style={styles.listingDate}>Submitted: {new Date(listing.created_at).toLocaleDateString('en-IN')}</Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Form Modals */}
      {renderFormModal(false)}
      {renderFormModal(true)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    paddingTop: Platform.OS === 'web' ? 20 : 55,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  headerSubtitle: { color: '#9CA3AF', fontSize: 13, marginTop: 4 },

  statsRow: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 16, gap: 8 },
  statCard: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12,
    alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB',
  },
  statValue: { fontSize: 22, fontWeight: '900', color: '#111827' },
  statLabel: { fontSize: 11, fontWeight: '600', color: '#6B7280', marginTop: 2 },

  addListingBtn: { marginHorizontal: 16, marginTop: 16, borderRadius: 12, overflow: 'hidden' },
  addListingGradient: { paddingVertical: 14, alignItems: 'center', borderRadius: 12 },
  addListingBtnText: { color: '#111827', fontSize: 16, fontWeight: '800' },

  filterRow: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 16, gap: 8 },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB',
  },
  filterChipActive: { backgroundColor: '#111827', borderColor: '#111827' },
  filterChipText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  filterChipTextActive: { color: '#D4AF37' },

  listingsScroll: { flex: 1, marginTop: 16 },

  emptyState: { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#374151', textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 8 },

  listingCard: {
    marginHorizontal: 16, marginBottom: 16, backgroundColor: '#FFFFFF',
    borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  listingImage: { width: '100%', height: 160 },
  statusBadge: {
    position: 'absolute', top: 12, right: 12,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  statusBadgeText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  listingInfo: { padding: 16 },
  listingTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 4 },
  listingLocation: { fontSize: 13, color: '#6B7280', marginBottom: 10 },
  listingMeta: { flexDirection: 'row', gap: 16, marginBottom: 10 },
  listingMetaItem: { fontSize: 12, color: '#4B5563', fontWeight: '600' },
  listingDate: { fontSize: 11, color: '#9CA3AF', marginTop: 8 },

  rejectionNote: {
    backgroundColor: '#FEF2F2', borderRadius: 8, padding: 10, marginBottom: 10,
    borderLeftWidth: 3, borderLeftColor: '#EF4444',
  },
  rejectionNoteText: { fontSize: 12, color: '#991B1B', fontWeight: '500' },

  listingActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  editBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#D4AF37',
    alignItems: 'center', backgroundColor: '#FFFBEB',
  },
  editBtnText: { fontSize: 13, fontWeight: '700', color: '#B45309' },
  withdrawBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#FECACA',
    alignItems: 'center', backgroundColor: '#FEF2F2',
  },
  withdrawBtnText: { fontSize: 13, fontWeight: '700', color: '#991B1B' },

  // Form styles
  formContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  formHeader: {
    paddingTop: Platform.OS === 'web' ? 16 : 50, paddingBottom: 16,
    paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  formBody: { flex: 1, padding: 20 },
  sectionLabel: { fontSize: 16, fontWeight: '800', color: '#111827', marginTop: 20, marginBottom: 12 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 6, textTransform: 'uppercase' },
  fieldInput: {
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10,
    padding: 14, fontSize: 15, color: '#111827', marginBottom: 16,
  },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  categoryChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF',
  },
  categoryChipActive: { backgroundColor: '#111827', borderColor: '#111827' },
  categoryChipText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  categoryChipTextActive: { color: '#D4AF37' },
  submitBtn: {
    backgroundColor: '#D4AF37', paddingVertical: 16, borderRadius: 12,
    alignItems: 'center', marginTop: 10,
  },
  submitBtnText: { color: '#111827', fontSize: 16, fontWeight: '800' },
});
