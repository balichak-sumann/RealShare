import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';

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

export default function BuilderPortalScreen() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'my_properties' | 'post_new'>('my_properties');
  const [properties, setProperties] = useState<BuilderProperty[]>([
    {
      id: 'BLD-101',
      title: 'Aparna Zenith Premium Suites',
      location: 'Nallagandla, Hyderabad',
      type: 'Residential',
      totalFractions: 50,
      pricePerFraction: '₹4,00,000',
      yield: '7.8%',
      status: 'Pending Admin Approval',
      image: 'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=400&fit=crop',
    },
    {
      id: 'BLD-102',
      title: 'Prestige High Fields Tower',
      location: 'Gachibowli Financial District, Hyderabad',
      type: 'Commercial',
      totalFractions: 60,
      pricePerFraction: '₹8,00,000',
      yield: '9.0%',
      status: 'Pending Admin Approval',
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&fit=crop',
    },
  ]);

  // Form State
  const [title, setTitle] = useState('');
  const [locality, setLocality] = useState('');
  const [type, setType] = useState('Commercial');
  const [fractions, setFractions] = useState('50');
  const [price, setPrice] = useState('500000');
  const [yieldVal, setYieldVal] = useState('8.5');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const handlePostProperty = () => {
    if (!title || !locality) {
      alert('Please fill in property title and location.');
      return;
    }
    const newProp: BuilderProperty = {
      id: `BLD-${Math.floor(100 + Math.random() * 900)}`,
      title,
      location: `${locality}, Hyderabad`,
      type,
      totalFractions: Number(fractions),
      pricePerFraction: `₹${Number(price).toLocaleString('en-IN')}`,
      yield: `${yieldVal}%`,
      status: 'Pending Admin Approval',
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&fit=crop',
    };

    setProperties([newProp, ...properties]);
    setTitle('');
    setLocality('');
    setActiveTab('my_properties');
    setSuccessNotice(`Property "${newProp.title}" submitted to RealShare Admin for approval.`);
    setTimeout(() => setSuccessNotice(null), 4000);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A' }}>← Back</Text>
        </TouchableOpacity>
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
                    <TouchableOpacity style={styles.editBtn}>
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

            <TouchableOpacity style={styles.submitBtn} onPress={handlePostProperty}>
              <Text style={styles.submitBtnText}>Submit for Admin Verification</Text>
            </TouchableOpacity>
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
});
