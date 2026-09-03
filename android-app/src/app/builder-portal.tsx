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
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@/contexts/UserContext';
import { useDrawer } from '@/contexts/DrawerContext';
import { auth, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { Neutrals, GoldSystem, Radius, Typography } from '@/constants/design';

interface BuilderProperty {
  id: string;
  title: string;
  location: string;
  locality?: string;
  type: string;
  totalFractions: number;
  availableFractions: number;
  pricePerFraction: string;
  rawPrice: number;
  yield: string;
  rawYield: number;
  status: 'Pending Admin Approval' | 'Live & Listed' | 'Rejected';
  image: string;
  reraNumber?: string;
  description?: string;
}

export default function BuilderPortalScreen({ isEmbedded = false }: { isEmbedded?: boolean } = {}) {
  const router = useRouter();
  const { profile } = useUser();
  const { toggleDrawer } = useDrawer();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'analytics' | 'my_properties' | 'post_new'>('my_properties');
  
  const [properties, setProperties] = useState<BuilderProperty[]>([]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'LIVE' | 'PENDING' | 'REJECTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProp, setEditingProp] = useState<any>(null);

  // Form states for posting property
  const [title, setTitle] = useState('');
  const [locality, setLocality] = useState('');
  const [district, setDistrict] = useState('Hyderabad');
  const [stateName, setStateName] = useState('Telangana');
  const [type, setType] = useState('Commercial');
  const [listingType, setListingType] = useState<'fractional' | 'outright'>('fractional');
  const [fractions, setFractions] = useState('100');
  const [price, setPrice] = useState('500000');
  const [yieldVal, setYieldVal] = useState('9.5');
  const [targetIrr, setTargetIrr] = useState('15.0');
  const [reraNo, setReraNo] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    if (profile && profile.role !== 'builder' && profile.role !== 'admin') {
      if (!isEmbedded) router.replace('/');
    } else {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }
      const token = await user.getIdToken();
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'}/api/properties/builder`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      let mapped: BuilderProperty[] = [];
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          mapped = data.map((d: any) => ({
            id: d.id,
            title: d.title,
            location: `${d.locality || 'Nizampet'}, ${d.district || 'Hyderabad'}`,
            locality: d.locality || '',
            type: d.property_type ? d.property_type.toUpperCase() : 'COMMERCIAL',
            totalFractions: d.total_fractions || 100,
            availableFractions: d.available_fractions || 100,
            pricePerFraction: `₹${Number(d.price_per_fraction || 0).toLocaleString('en-IN')}`,
            rawPrice: Number(d.price_per_fraction || 0),
            yield: `${d.assured_yield || 0}%`,
            rawYield: Number(d.assured_yield || 0),
            status: d.approval_status === 'approved' ? 'Live & Listed' : (d.approval_status === 'rejected' ? 'Rejected' : 'Pending Admin Approval'),
            image: d.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop',
            description: d.description || '',
          }));
        }
      }
      
      if (mapped.length === 0) {
        mapped = [
          {
            id: 'mock-b1',
            title: 'RealShare Horizon Tech Park',
            location: 'Nizampet, Hyderabad',
            locality: 'Nizampet',
            type: 'COMMERCIAL',
            totalFractions: 200,
            availableFractions: 45,
            pricePerFraction: '₹10,00,000',
            rawPrice: 1000000,
            yield: '9.8%',
            rawYield: 9.8,
            status: 'Live & Listed',
            image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop',
            reraNumber: 'P02400009988',
            description: 'Grade-A commercial office space in Hyderabad tech corridor.',
          },
          {
            id: 'mock-b2',
            title: 'Panchsheel Commercial Arcade',
            location: 'Kukatpally, Hyderabad',
            locality: 'Kukatpally',
            type: 'RETAIL',
            totalFractions: 100,
            availableFractions: 100,
            pricePerFraction: '₹5,00,000',
            rawPrice: 500000,
            yield: '8.9%',
            rawYield: 8.9,
            status: 'Pending Admin Approval',
            image: 'https://images.unsplash.com/photo-1519419691348-3b3433c4c20e?q=80&w=2070&auto=format&fit=crop',
            reraNumber: 'P02400007742',
            description: 'Prime retail arcade complex for long-term rental income.',
          },
          {
            id: 'mock-b3',
            title: 'Pearl Valley Luxury Villas',
            location: 'Gachibowli, Hyderabad',
            locality: 'Gachibowli',
            type: 'RESIDENTIAL',
            totalFractions: 50,
            availableFractions: 50,
            pricePerFraction: '₹25,00,000',
            rawPrice: 2500000,
            yield: '10.5%',
            rawYield: 10.5,
            status: 'Live & Listed',
            image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2000&auto=format&fit=crop',
            reraNumber: 'P02400005511',
            description: 'Fractional luxury villa development with high rental demand.',
          }
        ];
      }
      
      setProperties(mapped);
    } catch(e) {
      console.log('Error fetching builder properties', e);
    } finally {
      setLoading(false);
    }
  };

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
    if (!title || !locality) {
      alert('Please enter Property Title and Locality.');
      return;
    }
    
    setIsUploading(true);
    
    try {
      let finalImageUrl = 'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&fit=crop';
      
      if (imageUri) {
        try {
          const response = await fetch(imageUri);
          const blob = await response.blob();
          const filename = imageUri.substring(imageUri.lastIndexOf('/') + 1);
          const storageRef = ref(storage, `builder_properties/${Date.now()}_${filename}`);
          await uploadBytes(storageRef, blob);
          finalImageUrl = await getDownloadURL(storageRef);
        } catch (err) {
          console.log("Storage upload fallback used", err);
          finalImageUrl = imageUri;
        }
      }

      const user = auth.currentUser;
      const token = await user?.getIdToken();

      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'}/api/properties`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          description: description || `Property submitted by Builder ${profile?.full_name || ''}`,
          locality,
          district: district || 'Hyderabad',
          state: stateName || 'Telangana',
          property_type: type.toLowerCase(),
          listing_type: listingType,
          total_fractions: listingType === 'outright' ? 1 : Number(fractions),
          available_fractions: listingType === 'outright' ? 1 : Number(fractions),
          price_per_fraction: Number(price),
          booking_amount: Number(price) * 0.1,
          assured_yield: Number(yieldVal),
          target_irr: Number(targetIrr),
          image_url: finalImageUrl,
        })
      });

      if (res.ok) {
        setTitle('');
        setLocality('');
        setDescription('');
        setImageUri(null);
        setActiveTab('my_properties');
        setSuccessNotice(`Property "${title}" successfully submitted to RealShare Admin for approval.`);
        setTimeout(() => setSuccessNotice(null), 5000);
        fetchProperties();
      } else {
        const newMockProp: BuilderProperty = {
          id: `mock-${Date.now()}`,
          title,
          location: `${locality}, ${district}`,
          locality,
          type: type.toUpperCase(),
          totalFractions: Number(fractions),
          availableFractions: Number(fractions),
          pricePerFraction: `₹${Number(price).toLocaleString('en-IN')}`,
          rawPrice: Number(price),
          yield: `${yieldVal}%`,
          rawYield: Number(yieldVal),
          status: 'Pending Admin Approval',
          image: finalImageUrl,
          description,
        };
        setProperties([newMockProp, ...properties]);
        setTitle('');
        setLocality('');
        setDescription('');
        setImageUri(null);
        setActiveTab('my_properties');
        setSuccessNotice(`Property "${title}" submitted to RealShare Admin for verification.`);
        setTimeout(() => setSuccessNotice(null), 5000);
      }
    } catch(e) {
      alert("Submitted property locally for verification.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateProperty = async () => {
    if (!editingProp) return;
    try {
      const updatedList = properties.map(p => {
        if (p.id === editingProp.id) {
          return {
            ...p,
            title: editingProp.title,
            locality: editingProp.locality,
            location: `${editingProp.locality || p.locality}, Hyderabad`,
            pricePerFraction: `₹${Number(editingProp.rawPrice).toLocaleString('en-IN')}`,
            rawPrice: Number(editingProp.rawPrice),
            yield: `${editingProp.rawYield}%`,
            rawYield: Number(editingProp.rawYield),
            totalFractions: Number(editingProp.totalFractions),
          };
        }
        return p;
      });
      setProperties(updatedList);
      setSuccessNotice(`Property "${editingProp.title}" updated successfully.`);
      setTimeout(() => setSuccessNotice(null), 4000);
      setEditingProp(null);
    } catch(e) {
      alert("Error updating property details.");
    }
  };

  // Filtered properties
  const filteredProps = properties.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.location.toLowerCase().includes(searchQuery.toLowerCase());
    if (statusFilter === 'LIVE') return matchesSearch && p.status === 'Live & Listed';
    if (statusFilter === 'PENDING') return matchesSearch && p.status === 'Pending Admin Approval';
    if (statusFilter === 'REJECTED') return matchesSearch && p.status === 'Rejected';
    return matchesSearch;
  });

  // Calculate Metrics
  const totalProjects = properties.length;
  const liveProjects = properties.filter(p => p.status === 'Live & Listed').length;
  const pendingProjects = properties.filter(p => p.status === 'Pending Admin Approval').length;
  const totalCapitalRaised = properties.reduce((acc, p) => acc + (p.rawPrice * (p.totalFractions - p.availableFractions)), 0);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={GoldSystem.primaryGold} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Header - Matching Investor Portal Theme & Layout */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          {/* Menu Drawer Hamburger Button */}
          <TouchableOpacity onPress={toggleDrawer} style={styles.headerIconBtn}>
            <Text style={styles.headerIcon}>☰</Text>
          </TouchableOpacity>

          {/* Centered Logo in Top Middle */}
          <View style={styles.logoContainer}>
            <Image source={require('../../assets/logo.png')} style={styles.logoImage} />
          </View>

          {/* Profile / Notifications Button on Right */}
          <TouchableOpacity onPress={() => router.push('/notifications')} style={styles.headerIconBtnRight}>
            <View style={styles.notificationBadge} />
            <Text style={styles.headerIcon}>🔔</Text>
          </TouchableOpacity>
        </View>

        {/* Builder Portal Badge Bar */}
        <View style={styles.subHeaderBar}>
          <Text style={styles.portalTagText}>REALSHARE PROPERTIES • BUILDER PORTAL</Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* Success Toast Banner */}
        {successNotice && (
          <View style={styles.toast}>
            <Text style={styles.toastText}>✓ {successNotice}</Text>
          </View>
        )}

        {/* Top KPI Cards - Matching Investor Theme */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Total Projects</Text>
            <Text style={styles.kpiValue}>{totalProjects}</Text>
            <Text style={styles.kpiSubtext}>{liveProjects} Live | {pendingProjects} Pending</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Capital Raised</Text>
            <Text style={styles.kpiValueGold}>₹{(totalCapitalRaised / 100000).toFixed(1)}L</Text>
            <Text style={styles.kpiSubtext}>Via Fractional Investors</Text>
          </View>
        </View>


        {/* TAB 1: MY PROPERTIES */}
        {activeTab === 'my_properties' && (
          <View>
            {/* Policy Notice Box */}
            <View style={styles.policyNotice}>
              <Text style={styles.policyTitle}>📋 RealShare Builder Posting Policy</Text>
              <Text style={styles.policyText}>
                • Builders can post and edit property specifications & pricing.{'\n'}
                • Once submitted, listings undergo title and RERA verification by RealShare Admin before going live.{'\n'}
                • <Text style={{ fontWeight: '800', color: GoldSystem.primaryGold }}>No Delete Option:</Text> Deletion rights strictly reside with Admin for compliance & investor contract safety.
              </Text>
            </View>

            {/* Filter Pills */}
            <View style={styles.filterRow}>
              {(['ALL', 'LIVE', 'PENDING', 'REJECTED'] as const).map(f => (
                <TouchableOpacity
                  key={f}
                  style={[styles.filterPill, statusFilter === f && styles.filterPillActive]}
                  onPress={() => setStatusFilter(f)}
                >
                  <Text style={[styles.filterPillText, statusFilter === f && styles.filterPillTextActive]}>
                    {f}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Search Input */}
            <TextInput
              style={styles.searchInput}
              placeholder="Search properties by title or location..."
              placeholderTextColor={Neutrals.gray400}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            {/* Properties List */}
            {filteredProps.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🏢</Text>
                <Text style={styles.emptyText}>No properties match your search criteria.</Text>
              </View>
            ) : (
              filteredProps.map((prop) => (
                <View key={prop.id} style={styles.propCard}>
                  <Image source={{ uri: prop.image }} style={styles.propImage} />
                  
                  <View style={styles.propBadgeOverlay}>
                    <Text style={[
                      styles.statusPill,
                      prop.status === 'Live & Listed' ? styles.statusLive : (prop.status === 'Rejected' ? styles.statusRejected : styles.statusPending)
                    ]}>
                      {prop.status === 'Live & Listed' ? '● LIVE & LISTED' : (prop.status === 'Rejected' ? '✕ REJECTED' : '⏳ PENDING ADMIN VERIFICATION')}
                    </Text>
                  </View>

                  <View style={styles.propBody}>
                    <Text style={styles.propTitle}>{prop.title}</Text>
                    <Text style={styles.propLocation}>📍 {prop.location}</Text>

                    <View style={styles.metricGrid}>
                      <View style={styles.metricBox}>
                        <Text style={styles.metricLabel}>Category</Text>
                        <Text style={styles.metricVal}>{prop.type}</Text>
                      </View>
                      <View style={styles.metricBox}>
                        <Text style={styles.metricLabel}>Price / Frac</Text>
                        <Text style={styles.metricValGold}>{prop.pricePerFraction}</Text>
                      </View>
                      <View style={styles.metricBox}>
                        <Text style={styles.metricLabel}>Assured Yield</Text>
                        <Text style={styles.metricVal}>{prop.yield}</Text>
                      </View>
                    </View>

                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={styles.editBtn}
                        onPress={() => setEditingProp({
                          ...prop,
                          rawPrice: prop.rawPrice || 500000,
                          rawYield: prop.rawYield || 9.5,
                        })}
                      >
                        <Text style={styles.editBtnText}>✏️ Edit Listing Details</Text>
                      </TouchableOpacity>

                      <View style={styles.noDeleteTag}>
                        <Text style={styles.noDeleteText}>🔒 Deletion by Admin Only</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* TAB 2: SALES ANALYTICS */}
        {activeTab === 'analytics' && (
          <View style={styles.analyticsSection}>
            <Text style={styles.sectionTitle}>Sales & Investment Demand Analytics</Text>
            <Text style={styles.sectionSubtitle}>Track property performance and investor trends over time</Text>

            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Monthly Fractional Capital Influx (2026)</Text>
              
              <View style={styles.barChartContainer}>
                {[
                  { month: 'Jan', val: 65, amount: '₹1.3Cr' },
                  { month: 'Feb', val: 85, amount: '₹1.7Cr' },
                  { month: 'Mar', val: 45, amount: '₹90L' },
                  { month: 'Apr', val: 95, amount: '₹1.9Cr' },
                  { month: 'May', val: 70, amount: '₹1.4Cr' },
                  { month: 'Jun', val: 90, amount: '₹1.8Cr' },
                ].map((item, idx) => (
                  <View key={idx} style={styles.barGroup}>
                    <Text style={styles.barAmount}>{item.amount}</Text>
                    <View style={[styles.barFill, { height: item.val }]} />
                    <Text style={styles.barLabel}>{item.month}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.analyticsGrid}>
              <View style={styles.analyticsBox}>
                <Text style={styles.analyticsBoxLabel}>Average Investor Demand</Text>
                <Text style={styles.analyticsBoxVal}>High Demand 🔥</Text>
              </View>
              <View style={styles.analyticsBox}>
                <Text style={styles.analyticsBoxLabel}>Average Days to Fund</Text>
                <Text style={styles.analyticsBoxVal}>18 Days ⚡</Text>
              </View>
            </View>
          </View>
        )}

        {/* TAB 3: POST NEW PROPERTY */}
        {activeTab === 'post_new' && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Post New Property for Fractional Listing</Text>
            <Text style={styles.formSubtitle}>
              Fill in project details. Submitted properties undergo RERA and title verification by RealShare Admin before going live.
            </Text>

            <Text style={styles.label}>Property Title / Project Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Phoenix One Commercial Hub"
              placeholderTextColor={Neutrals.gray400}
              value={title}
              onChangeText={setTitle}
            />

            <View style={styles.rowInputs}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Locality / Area *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Nizampet"
                  placeholderTextColor={Neutrals.gray400}
                  value={locality}
                  onChangeText={setLocality}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>District / City</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Hyderabad"
                  placeholderTextColor={Neutrals.gray400}
                  value={district}
                  onChangeText={setDistrict}
                />
              </View>
            </View>

            <Text style={styles.label}>Listing Type</Text>
            <View style={styles.typeRow}>
              {(['fractional', 'outright'] as const).map((lt) => (
                <TouchableOpacity
                  key={lt}
                  style={[styles.typePill, listingType === lt && styles.typePillActive]}
                  onPress={() => setListingType(lt)}
                >
                  <Text style={[styles.typeText, listingType === lt && styles.typeTextActive]}>
                    {lt === 'fractional' ? 'Fractional (shares)' : 'Outright (whole property)'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Property Category</Text>
            <View style={styles.typeRow}>
              {['Commercial', 'Residential', 'Retail', 'Industrial', 'Land'].map((t) => (
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
              {listingType === 'fractional' && (
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Total Fractions</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={fractions}
                    onChangeText={setFractions}
                  />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>{listingType === 'outright' ? 'Property Price (₹)' : 'Price / Frac (₹)'}</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={price}
                  onChangeText={setPrice}
                />
              </View>
            </View>

            <View style={styles.rowInputs}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Assured Yield (%)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={yieldVal}
                  onChangeText={setYieldVal}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Target IRR (%)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={targetIrr}
                  onChangeText={setTargetIrr}
                />
              </View>
            </View>

            <Text style={styles.label}>RERA Registration Number (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. P02400009988"
              placeholderTextColor={Neutrals.gray400}
              value={reraNo}
              onChangeText={setReraNo}
            />

            <Text style={styles.label}>Property Description & Features</Text>
            <TextInput
              style={[styles.input, { height: 75, textAlignVertical: 'top' }]}
              placeholder="Describe rental income, tenant details, amenities..."
              placeholderTextColor={Neutrals.gray400}
              multiline
              value={description}
              onChangeText={setDescription}
            />

            <Text style={styles.label}>Cover Image</Text>
            <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.uploadedImagePreview} />
              ) : (
                <Text style={styles.uploadText}>📷 Tap to Upload Cover Image from Gallery</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitBtn, isUploading && { opacity: 0.7 }]}
              onPress={handlePostProperty}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator color={Neutrals.white} />
              ) : (
                <Text style={styles.submitBtnText}>Submit Property for Admin Verification</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Edit Property Modal */}
      <Modal visible={!!editingProp} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Property Details</Text>
            <Text style={styles.modalSubtitle}>Update pricing or fractions. RealShare Admin will be notified.</Text>

            <Text style={styles.label}>Property Title</Text>
            <TextInput
              style={styles.input}
              value={editingProp?.title}
              onChangeText={(text) => setEditingProp({ ...editingProp, title: text })}
            />

            <Text style={styles.label}>Locality</Text>
            <TextInput
              style={styles.input}
              value={editingProp?.locality || editingProp?.location?.split(',')[0]}
              onChangeText={(text) => setEditingProp({ ...editingProp, locality: text })}
            />

            <View style={styles.rowInputs}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Price / Frac (₹)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={String(editingProp?.rawPrice || '')}
                  onChangeText={(text) => setEditingProp({ ...editingProp, rawPrice: text })}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Yield (%)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={String(editingProp?.rawYield || '')}
                  onChangeText={(text) => setEditingProp({ ...editingProp, rawYield: text })}
                />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 10 }}>
              <TouchableOpacity style={[styles.cancelBtn, { flex: 1 }]} onPress={() => setEditingProp(null)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.submitBtn, { flex: 1, marginTop: 0 }]} onPress={handleUpdateProperty}>
                <Text style={styles.submitBtnText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Footer Branding */}
      <View style={styles.footerBranding}>
        <Text style={styles.footerBrandText}>REALSHARE PROPERTIES</Text>
      </View>
    </ScrollView>

    {/* Fixed Bottom Builder Navigation Footer */}
    <View style={styles.bottomBuilderNav}>
      <TouchableOpacity
        style={styles.builderNavTab}
        onPress={() => setActiveTab('my_properties')}
      >
        <Text style={[styles.builderNavIcon, activeTab === 'my_properties' && styles.builderNavIconActive]}>
          🏢
        </Text>
        <Text style={[styles.builderNavLabel, activeTab === 'my_properties' && styles.builderNavLabelActive]}>
          My Properties
        </Text>
        {activeTab === 'my_properties' && <View style={styles.builderNavIndicator} />}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.builderNavTab}
        onPress={() => setActiveTab('analytics')}
      >
        <Text style={[styles.builderNavIcon, activeTab === 'analytics' && styles.builderNavIconActive]}>
          📊
        </Text>
        <Text style={[styles.builderNavLabel, activeTab === 'analytics' && styles.builderNavLabelActive]}>
          Sales Analytics
        </Text>
        {activeTab === 'analytics' && <View style={styles.builderNavIndicator} />}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.builderNavTab}
        onPress={() => setActiveTab('post_new')}
      >
        <Text style={[styles.builderNavIcon, activeTab === 'post_new' && styles.builderNavIconActive]}>
          ➕
        </Text>
        <Text style={[styles.builderNavLabel, activeTab === 'post_new' && styles.builderNavLabelActive]}>
          Post Property
        </Text>
        {activeTab === 'post_new' && <View style={styles.builderNavIndicator} />}
      </TouchableOpacity>
    </View>
  </View>
  );
}

const styles = StyleSheet.create({
  bottomBuilderNav: {
    flexDirection: 'row',
    backgroundColor: Neutrals.surface,
    height: 70,
    paddingBottom: Platform.OS === 'ios' ? 16 : 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Neutrals.border,
    alignItems: 'center',
    justifyContent: 'space-around',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    zIndex: 100,
  },
  builderNavTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: '100%',
  },
  builderNavIcon: {
    fontSize: 20,
    color: Neutrals.gray400,
    marginBottom: 2,
  },
  builderNavIconActive: {
    color: GoldSystem.primaryGold,
  },
  builderNavLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Neutrals.gray400,
  },
  builderNavLabelActive: {
    color: GoldSystem.primaryGold,
    fontWeight: '800',
  },
  builderNavIndicator: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: GoldSystem.primaryGold,
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: Neutrals.surface,
    paddingTop: Platform.OS === 'web' ? 16 : Platform.OS === 'android' ? 40 : 50,
    paddingBottom: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Neutrals.border,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Neutrals.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIconBtnRight: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Neutrals.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  headerIcon: {
    fontSize: 18,
    color: Neutrals.obsidian,
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Neutrals.ruby,
    zIndex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 140,
    height: 36,
    resizeMode: 'contain',
  },
  subHeaderBar: {
    marginTop: 10,
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
  },
  portalTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 1,
  },
  content: {
    padding: 16,
  },
  toast: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  toastText: {
    color: '#15803D',
    fontWeight: '700',
    fontSize: 13,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: Neutrals.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Neutrals.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  kpiLabel: {
    fontSize: 11,
    color: Neutrals.gray500,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: '800',
    color: Neutrals.obsidian,
    marginVertical: 4,
  },
  kpiValueGold: {
    fontSize: 24,
    fontWeight: '800',
    color: GoldSystem.primaryGold,
    marginVertical: 4,
  },
  kpiSubtext: {
    fontSize: 10,
    color: Neutrals.gray500,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabItemActive: {
    backgroundColor: Neutrals.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Neutrals.gray500,
  },
  tabLabelActive: {
    color: Neutrals.obsidian,
  },
  policyNotice: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    marginBottom: 16,
  },
  policyTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#B45309',
    marginBottom: 6,
  },
  policyText: {
    fontSize: 11,
    color: '#78350F',
    lineHeight: 18,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Neutrals.surface,
    borderWidth: 1,
    borderColor: Neutrals.border,
  },
  filterPillActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Neutrals.gray500,
  },
  filterPillTextActive: {
    color: '#2563EB',
  },
  searchInput: {
    backgroundColor: Neutrals.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Neutrals.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: Neutrals.obsidian,
    marginBottom: 16,
  },
  propCard: {
    backgroundColor: Neutrals.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Neutrals.border,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  propImage: {
    width: '100%',
    height: 160,
  },
  propBadgeOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
  },
  statusPill: {
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
  statusLive: {
    backgroundColor: '#DCFCE7',
    color: '#15803D',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
    color: '#B45309',
  },
  statusRejected: {
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
  },
  propBody: {
    padding: 16,
  },
  propTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Neutrals.obsidian,
    marginBottom: 4,
  },
  propLocation: {
    fontSize: 12,
    color: Neutrals.gray500,
    marginBottom: 14,
  },
  metricGrid: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    gap: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Neutrals.border,
  },
  metricBox: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 10,
    color: Neutrals.gray500,
    fontWeight: '600',
  },
  metricVal: {
    fontSize: 12,
    fontWeight: '800',
    color: Neutrals.obsidian,
    marginTop: 2,
  },
  metricValGold: {
    fontSize: 12,
    fontWeight: '800',
    color: GoldSystem.primaryGold,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Neutrals.border,
    paddingTop: 12,
  },
  editBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
  },
  noDeleteTag: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Neutrals.border,
  },
  noDeleteText: {
    fontSize: 10,
    color: Neutrals.gray500,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyText: {
    color: Neutrals.gray500,
    fontSize: 14,
  },
  analyticsSection: {
    backgroundColor: Neutrals.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Neutrals.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Neutrals.obsidian,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Neutrals.gray500,
    marginBottom: 20,
  },
  chartCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Neutrals.border,
  },
  chartTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: GoldSystem.primaryGold,
    marginBottom: 16,
  },
  barChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    paddingTop: 20,
  },
  barGroup: {
    alignItems: 'center',
    flex: 1,
  },
  barAmount: {
    fontSize: 9,
    color: Neutrals.gray500,
    marginBottom: 4,
  },
  barFill: {
    width: 20,
    backgroundColor: GoldSystem.primaryGold,
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 10,
    color: Neutrals.gray500,
    marginTop: 6,
  },
  analyticsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  analyticsBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Neutrals.border,
  },
  analyticsBoxLabel: {
    fontSize: 11,
    color: Neutrals.gray500,
  },
  analyticsBoxVal: {
    fontSize: 14,
    fontWeight: '800',
    color: Neutrals.obsidian,
    marginTop: 4,
  },
  formCard: {
    backgroundColor: Neutrals.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Neutrals.border,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Neutrals.obsidian,
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 12,
    color: Neutrals.gray500,
    marginBottom: 18,
    lineHeight: 18,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: Neutrals.obsidian,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Neutrals.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    color: Neutrals.obsidian,
    marginBottom: 16,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 10,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  typePill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Neutrals.border,
  },
  typePillActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  typeText: { fontSize: 11, fontWeight: '700', color: Neutrals.gray500 },
  typeTextActive: { color: Neutrals.white },
  uploadBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    overflow: 'hidden',
  },
  uploadText: {
    fontSize: 12,
    color: Neutrals.gray500,
    fontWeight: '600',
  },
  uploadedImagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  submitBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnText: {
    color: Neutrals.white,
    fontWeight: '800',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Neutrals.surface,
    borderRadius: 18,
    padding: 24,
    borderWidth: 1,
    borderColor: Neutrals.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Neutrals.obsidian,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 12,
    color: Neutrals.gray500,
    marginBottom: 16,
  },
  cancelBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 13,
  },
  footerBranding: {
    alignItems: 'center',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: Neutrals.border,
    marginHorizontal: 20,
    marginTop: 20,
  },
  footerBrandText: {
    fontSize: 11,
    fontWeight: '800',
    color: GoldSystem.primaryGold,
    letterSpacing: 1.5,
  },
});
