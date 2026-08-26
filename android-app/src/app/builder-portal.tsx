import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@/contexts/UserContext';
import { auth, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';

interface BuilderProperty {
  id: string;
  title: string;
  location: string;
  type: string;
  totalFractions: number;
  pricePerFraction: string;
  yield: string;
  status: 'Pending Admin Approval' | 'Live & Listed' | 'Rejected';
  image: string;
}

export default function BuilderPortalScreen({ isEmbedded = false }: { isEmbedded?: boolean } = {}) {
  const router = useRouter();
  const { profile } = useUser();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile && profile.role !== 'builder' && profile.role !== 'admin') {
      if (!isEmbedded) router.replace('/');
    } else {
      setLoading(false);
    }
  }, [profile]);

  const [activeTab, setActiveTab] = useState<'my_properties' | 'post_new'>('my_properties');
  const [properties, setProperties] = useState<BuilderProperty[]>([]);
  const [editingProp, setEditingProp] = useState<any>(null);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      const res = await fetch('https://realshare-5l24.onrender.com/api/properties/builder', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      let mapped = data.map((d: any) => ({
        id: d.id,
        title: d.title,
        location: `${d.locality}, ${d.district}`,
        type: d.property_type,
        totalFractions: d.total_fractions,
        pricePerFraction: `₹${Number(d.price_per_fraction).toLocaleString('en-IN')}`,
        yield: `${d.assured_yield}%`,
        status: d.approval_status === 'approved' ? 'Live & Listed' : (d.approval_status === 'rejected' ? 'Rejected' : 'Pending Admin Approval'),
        image: d.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=400&fit=crop'
      }));
      
      if (mapped.length === 0) {
        mapped = [
          {
            id: 'mock-1',
            title: 'The Skyview Corporate Park',
            location: 'HITEC City, Hyderabad',
            type: 'commercial',
            totalFractions: 100,
            pricePerFraction: '₹10,00,000',
            yield: '9.2%',
            status: 'Live & Listed',
            image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop'
          },
          {
            id: 'mock-2',
            title: 'Lakeside Retail Hub',
            location: 'Kondapur, Hyderabad',
            type: 'retail',
            totalFractions: 50,
            pricePerFraction: '₹5,00,000',
            yield: '8.5%',
            status: 'Pending Admin Approval',
            image: 'https://images.unsplash.com/photo-1519419691348-3b3433c4c20e?q=80&w=2070&auto=format&fit=crop'
          }
        ];
      }
      
      setProperties(mapped);
    } catch(e) {
      console.log('Error fetching properties', e);
    }
  };

  const [title, setTitle] = useState('');
  const [locality, setLocality] = useState('');
  const [type, setType] = useState('Commercial');
  const [fractions, setFractions] = useState('50');
  const [price, setPrice] = useState('500000');
  const [yieldVal, setYieldVal] = useState('8.5');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handlePostProperty = async () => {
    if (!title || !locality || !imageUri) {
      alert('Please fill in property title, location, and select a cover photo.');
      return;
    }
    
    setIsUploading(true);
    
    try {
      const user = auth.currentUser;
      const token = await user?.getIdToken();
      
      // Upload Image
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const filename = imageUri.substring(imageUri.lastIndexOf('/') + 1);
      const storageRef = ref(storage, `builder_properties/${Date.now()}_${filename}`);
      
      await uploadBytes(storageRef, blob);
      const finalImageUrl = await getDownloadURL(storageRef);

      const res = await fetch('https://realshare-5l24.onrender.com/api/properties', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          locality,
          district: 'Hyderabad',
          state: 'Telangana',
          property_type: type.toLowerCase(),
          total_fractions: Number(fractions),
          available_fractions: Number(fractions),
          price_per_fraction: Number(price),
          booking_amount: Number(price) * 0.1,
          assured_yield: Number(yieldVal),
          target_irr: 15.0,
          image_url: finalImageUrl,
        })
      });
      if (res.ok) {
        setTitle('');
        setLocality('');
        setImageUri(null);
        setActiveTab('my_properties');
        setSuccessNotice(`Property "${title}" submitted to RealShare Admin for approval.`);
        setTimeout(() => setSuccessNotice(null), 4000);
        fetchProperties();
      } else {
        alert("Failed to submit property.");
      }
    } catch(e) {
      alert("Error connecting to server.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateProperty = async () => {
    if (!editingProp) return;
    try {
      if (editingProp.id.toString().startsWith('mock')) {
        // Simulate success for demo mock data
        setSuccessNotice(`Property "${editingProp.title}" updated successfully (Demo Mode).`);
        setTimeout(() => setSuccessNotice(null), 4000);
        setEditingProp(null);
        return;
      }
      
      const token = await auth.currentUser?.getIdToken();
      await fetch(`https://realshare-5l24.onrender.com/api/properties/${editingProp.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: editingProp.title,
          locality: editingProp.locality || editingProp.location.split(',')[0],
          property_type: editingProp.type.toLowerCase(),
          total_fractions: Number(editingProp.totalFractions),
          price_per_fraction: Number(editingProp.pricePerFraction.replace(/[^0-9]/g, '')),
          assured_yield: Number(editingProp.yield.replace(/[^0-9.]/g, '')),
        })
      });
      setSuccessNotice(`Property "${editingProp.title}" updated successfully.`);
      setTimeout(() => setSuccessNotice(null), 4000);
      setEditingProp(null);
      fetchProperties();
    } catch(e) {
      alert("Error updating property.");
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#1A56DB" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.header}>
        {!isEmbedded && (
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A' }}>← Back</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Builder & Developer Console</Text>
      </View>

      <View style={styles.content}>
        {/* Toast */}
        {successNotice && (
          <View style={styles.toast}>
            <Text style={styles.toastText}>✓ {successNotice}</Text>
          </View>
        )}

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'my_properties' && styles.tabActive]}
            onPress={() => setActiveTab('my_properties')}
          >
            <Text style={[styles.tabText, activeTab === 'my_properties' && styles.tabTextActive]}>
              My Listed Properties ({properties.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'post_new' && styles.tabActive]}
            onPress={() => setActiveTab('post_new')}
          >
            <Text style={[styles.tabText, activeTab === 'post_new' && styles.tabTextActive]}>
              + Post New Property
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'my_properties' ? (
          <View>
            <View style={styles.noticeBox}>
              <Text style={styles.noticeTitle}>📋 Work Order Policy Note</Text>
              <Text style={styles.noticeBody}>
                Builders can post and edit property specifications. Once submitted, listings undergo title and RERA verification by RealShare Admin before going live. Deletion rights reside with Admin.
              </Text>
            </View>

            {properties.map((prop) => (
              <View key={prop.id} style={styles.propCard}>
                <Image source={{ uri: prop.image }} style={styles.propImage} />
                <View style={styles.propBody}>
                  <View style={styles.propTopRow}>
                    <Text style={styles.propTitle}>{prop.title}</Text>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 4,
                        backgroundColor:
                          prop.status === 'Live & Listed' ? '#DCFCE7' : '#FEF3C7',
                        color:
                          prop.status === 'Live & Listed' ? '#15803D' : '#B45309',
                      }}
                    >
                      {prop.status}
                    </span>
                  </View>
                  <Text style={styles.propLocation}>📍 {prop.location}</Text>

                  <View style={styles.propMetrics}>
                    <Text style={styles.propMetricText}>Type: <strong>{prop.type}</strong></Text>
                    <Text style={styles.propMetricText}>Price: <strong>{prop.pricePerFraction}</strong></Text>
                    <Text style={styles.propMetricText}>Yield: <strong>{prop.yield}</strong></Text>
                  </View>

                  <View style={styles.propActions}>
                    <TouchableOpacity style={styles.editBtn} onPress={() => setEditingProp(prop)}>
                      <Text style={styles.editBtnText}>✏️ Edit Listing Details</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          /* Post Property Form */
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Submit Property for Fractional Listing</Text>

            <Text style={styles.label}>Property Title / Project Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Phoenix One Commercial Park"
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.label}>Locality / Area (Hyderabad / Goa / etc.)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Financial District, Gachibowli"
              value={locality}
              onChangeText={setLocality}
            />

            <Text style={styles.label}>Property Category</Text>
            <View style={styles.typeRow}>
              {['Commercial', 'Holiday', 'Residential', 'International'].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typePill, type === t && styles.typePillActive]}
                  onPress={() => setType(t)}
                >
                  <Text style={[styles.typeText, type === t && styles.typeTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Cover Photo</Text>
            <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.uploadedImagePreview} />
              ) : (
                <Text style={styles.uploadText}>📸 Tap to Upload Photo from Gallery</Text>
              )}
            </TouchableOpacity>

            <View style={styles.rowInputs}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Total Fractions</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={fractions}
                  onChangeText={setFractions}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Price / Frac (₹)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={price}
                  onChangeText={setPrice}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Est. Yield (%)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={yieldVal}
                  onChangeText={setYieldVal}
                />
              </View>
            </View>

            <TouchableOpacity style={[styles.submitBtn, isUploading && { opacity: 0.7 }]} onPress={handlePostProperty} disabled={isUploading}>
              <Text style={styles.submitBtnText}>{isUploading ? 'Uploading & Submitting...' : 'Submit for Admin Verification'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Edit Property Modal */}
      <Modal visible={!!editingProp} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.formTitle}>Edit Property Details</Text>

            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={editingProp?.title}
              onChangeText={(text) => setEditingProp({ ...editingProp, title: text })}
            />

            <View style={styles.rowInputs}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Total Fractions</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={String(editingProp?.totalFractions || '')}
                  onChangeText={(text) => setEditingProp({ ...editingProp, totalFractions: text })}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Price / Frac</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={String(editingProp?.pricePerFraction || '').replace(/[^0-9]/g, '')}
                  onChangeText={(text) => setEditingProp({ ...editingProp, pricePerFraction: text })}
                />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 10 }}>
              <TouchableOpacity style={[styles.submitBtn, { flex: 1, backgroundColor: '#E2E8F0' }]} onPress={() => setEditingProp(null)}>
                <Text style={[styles.submitBtnText, { color: '#475569' }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.submitBtn, { flex: 1 }]} onPress={handleUpdateProperty}>
                <Text style={styles.submitBtnText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  toast: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  toastText: {
    color: '#15803D',
    fontWeight: '700',
    fontSize: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#0F172A',
  },
  noticeBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 16,
  },
  noticeTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E3A8A',
    marginBottom: 2,
  },
  noticeBody: {
    fontSize: 11,
    color: '#3B82F6',
    lineHeight: 16,
  },
  propCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 16,
  },
  propImage: {
    width: '100%',
    height: 140,
  },
  propBody: {
    padding: 14,
  },
  propTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  propTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
  },
  propLocation: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 10,
  },
  propMetrics: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  propMetricText: {
    fontSize: 11,
    color: '#475569',
  },
  propActions: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  editBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  editBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 10,
    fontSize: 12,
    marginBottom: 12,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  typePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  typePillActive: {
    backgroundColor: '#2563EB',
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  typeTextActive: {
    color: '#FFFFFF',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  submitBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  uploadBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  uploadText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  uploadedImagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
  },
});

