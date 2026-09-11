import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { auth } from '@/lib/firebase';
import { useUser } from '@/contexts/UserContext';
import { useDrawer } from '@/contexts/DrawerContext';
import { useResponsive } from '@/hooks/useResponsive';
import { getApiUrl } from '@/lib/api';
import { LinearGradient } from 'expo-linear-gradient';
import { Radius } from '@/constants/design';
import { PropertyCard } from '@/components/ui/PropertyCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { QuickActions } from '@/components/home/QuickActions';
import { RecentActivity } from '@/components/home/RecentActivity';
import { HotProjects } from '@/components/home/HotProjects';
import { TopLocalities } from '@/components/home/TopLocalities';
import { ServicesStrip } from '@/components/home/ServicesStrip';
import { TopDevelopers } from '@/components/home/TopDevelopers';
import { propertyToCardProps } from '@/lib/formatters';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageToFirebase } from '@/lib/uploadImage';
const screenWidth = Dimensions.get('window').width;

let LineChart: any = null;
if (Platform.OS !== 'web') {
  LineChart = require('react-native-chart-kit').LineChart;
}

export default function AgentPortalScreen({ isEmbedded = false }: { isEmbedded?: boolean } = {}) {
  const router = useRouter();
  const { profile } = useUser();
  const { openDrawer } = useDrawer();
  const { isDesktop } = useResponsive();
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [properties, setProperties] = useState<any[]>([]);

  // Post Property State
  const [showPostModal, setShowPostModal] = useState(false);
  const [myListings, setMyListings] = useState<any[]>([]);
  const [postTitle, setPostTitle] = useState('');
  const [postLocality, setPostLocality] = useState('');
  const [postDistrict, setPostDistrict] = useState('Hyderabad');
  const [postState, setPostState] = useState('Telangana');
  const [postType, setPostType] = useState('Residential');
  const [postListingType, setPostListingType] = useState<'fractional' | 'outright'>('fractional');
  const [postFractions, setPostFractions] = useState('100');
  const [postPrice, setPostPrice] = useState('500000');
  const [postYield, setPostYield] = useState('9.0');
  const [postImageUrl, setPostImageUrl] = useState('');
  const [postSubmitting, setPostSubmitting] = useState(false);

  useEffect(() => {
    if (profile && profile.role !== 'agent' && profile.role !== 'admin') {
      if (!isEmbedded) router.replace('/');
      return;
    }
    fetchDashboardData();
    fetchMyListings();
  }, [profile]);

  const fetchMyListings = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/properties/builder`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMyListings(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.log('Failed to fetch agent listings', e);
    }
  };

  const handleDeleteProperty = async (id: string) => {
    if (Platform.OS === 'web') {
      if (!window.confirm("Are you sure you want to delete this listing?")) return;
    }
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/properties/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setMyListings(prev => prev.filter(p => p.id !== id));
      } else {
        alert("Failed to delete listing.");
      }
    } catch (err) {
      console.error("Error deleting listing:", err);
      alert("Failed to delete listing.");
    }
  };

  const handlePostProperty = async () => {
    if (!postTitle || !postLocality) {
      alert('Please enter a title and locality.');
      return;
    }
    setPostSubmitting(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        alert('Please sign in to post a property.');
        setPostSubmitting(false);
        return;
      }

      let finalImageUrl = postImageUrl;
      if (postImageUrl && !postImageUrl.startsWith('http')) {
        try {
          finalImageUrl = await uploadImageToFirebase(postImageUrl, 'property_images');
        } catch (error) {
          alert('Failed to upload the image. Please try again.');
          setPostSubmitting(false);
          return;
        }
      }

      const token = await user.getIdToken();
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/properties`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: postTitle,
          description: `Property submitted by Agent ${profile?.full_name || ''}`,
          locality: postLocality,
          district: postDistrict,
          state: postState,
          property_type: postType.toLowerCase(),
          listing_type: postListingType,
          total_fractions: postListingType === 'outright' ? 1 : Number(postFractions),
          available_fractions: postListingType === 'outright' ? 1 : Number(postFractions),
          price_per_fraction: Number(postPrice),
          booking_amount: Number(postPrice) * 0.1,
          assured_yield: Number(postYield),
          image_url: finalImageUrl || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&fit=crop',
        }),
      });
      if (res.ok) {
        setShowPostModal(false);
        setPostTitle('');
        setPostLocality('');
        setPostImageUrl('');
        alert('Property submitted to RealShare Admin for approval.');
        fetchMyListings();
      } else {
        alert('Could not submit property. Please try again.');
      }
    } catch (e) {
      console.log('Failed to post property', e);
      alert('Could not submit property. Please try again.');
    } finally {
      setPostSubmitting(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      let nextIndex = activeIndex + 1;
      if (nextIndex >= Math.min(properties.length > 0 ? properties.length : 1, 5)) nextIndex = 0;
      scrollRef.current?.scrollTo({ x: nextIndex * screenWidth, animated: true });
      setActiveIndex(nextIndex);
    }, 3500);
    return () => clearInterval(interval);
  }, [activeIndex, properties]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const user = auth.currentUser;
      if (!user) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const token = await user.getIdToken();
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/agents/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Failed to fetch dashboard data (HTTP ${res.status})`);
      }

      const data = await res.json();
      setDashboardData(data);
      setError('');

      // Fetch Properties
      const propsRes = await fetch(`${apiUrl}/api/properties`);
      if (propsRes.ok) {
        const propsData = await propsRes.json();
        const mappedProperties = propsData.map((p: any) => ({
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
    } catch (err: any) {
      console.error('Agent dashboard fetch error:', err);
      setError(err.message || 'An error occurred while loading RealShare - Partner Hub');
    } finally {
      setLoading(false);
    }
  };

  const referralLink = `https://realshare.in/ref/${dashboardData?.referralCode || 'AG-2026-VIP'}`;

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const clientLeads = dashboardData?.clientLeads || [];

  if (profile && profile.role !== 'agent' && profile.role !== 'admin') {
    return null;
  }

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <Text style={{ fontSize: 32, marginBottom: 12 }}>⚠️</Text>
        <Text style={{ color: '#EF4444', textAlign: 'center', fontSize: 16, fontWeight: '700', marginBottom: 8 }}>
          {error}
        </Text>
        <Text style={{ color: '#94A3B8', textAlign: 'center', fontSize: 13, marginBottom: 20 }}>
          Unable to retrieve your agent metrics. Please check your connection and try again.
        </Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity
            style={{
              backgroundColor: '#D4AF37',
              paddingVertical: 10,
              paddingHorizontal: 20,
              borderRadius: 8,
            }}
            onPress={fetchDashboardData}
          >
            <Text style={{ color: '#0F172A', fontWeight: 'bold' }}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              backgroundColor: 'rgba(255,255,255,0.1)',
              paddingVertical: 10,
              paddingHorizontal: 20,
              borderRadius: 8,
            }}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Premium Header */}
      <LinearGradient colors={['#0F172A', '#1E293B']} style={[styles.header, (isDesktop && isEmbedded) ? { paddingTop: 32 } : {}]}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.iconBtn} onPress={openDrawer}>
            <Ionicons name="menu-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>RealShare - Partner Hub</Text>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/notifications')}>
            <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Profile Summary inside Header */}
        <View style={styles.profileSection}>
          <View style={styles.avatarWrap}>
            <LinearGradient colors={['#D4AF37', '#FBBF24']} style={styles.avatar}>
              <Text style={styles.avatarText}>
                {dashboardData?.agentName ? dashboardData.agentName.substring(0, 2).toUpperCase() : 'AG'}
              </Text>
            </LinearGradient>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓</Text>
            </View>
          </View>
          <View style={styles.profileDetails}>
            <Text style={styles.agentName}>{dashboardData?.agentName || 'Agent Partner'}</Text>
            <Text style={styles.agencyName}>{dashboardData?.agencyName || 'RealShare Enterprise'}</Text>
            <View style={styles.tierBadge}>
              <Text style={styles.tierText}>★ {dashboardData?.commissionRate || 'Platinum Tier (2.5%)'}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <HeroCarousel />
        <CategoryGrid />
        <QuickActions />
        <RecentActivity />

        <View style={{ marginBottom: 24, paddingLeft: 16 }}>
          <SectionHeader title="Hot Selling Projects" onViewAll={() => {}} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16 }}>
            {properties.map((prop) => (
              <PropertyCard key={prop.id} {...prop} compact />
            ))}
          </ScrollView>
        </View>

        <TopDevelopers />
        <HotProjects properties={properties.slice(0, 8)} />

        <TopLocalities properties={properties} />
        <ServicesStrip />

        {/* Referral Link Generator - Premium Dark */}
        <View style={styles.premiumReferralCard}>
          <View style={styles.premiumReferralHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name="link" size={20} color="#D4AF37" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.premiumCardTitle}>Private Client Referral Link</Text>
              <Text style={styles.premiumCardSubtitle}>
                Share this secure link with your clients to automatically attribute your 2.5% platinum commission.
              </Text>
            </View>
          </View>
          
          <View style={styles.premiumLinkContainer}>
            <TextInput
              style={styles.premiumLinkInput}
              value={referralLink}
              editable={false}
              selectionColor="#D4AF37"
            />
            <TouchableOpacity style={[styles.premiumCopyBtn, copied && { backgroundColor: '#10B981' }]} onPress={handleCopy}>
              <Ionicons name={copied ? "checkmark-done" : "copy-outline"} size={16} color="#111827" style={{ marginRight: 4 }} />
              <Text style={styles.premiumCopyBtnText}>{copied ? 'COPIED' : 'COPY'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* My Listings (Agent Posting) */}
        <View style={styles.listingsContainer}>
          <View style={styles.listingsHeaderRow}>
            <Text style={styles.listingsTitle}>My Listings</Text>
            <TouchableOpacity style={styles.postPropertyBtn} onPress={() => router.push('/post-property' as any)}>
              <Ionicons name="add-circle" size={18} color="#111827" style={{ marginRight: 6 }} />
              <Text style={styles.postPropertyBtnText}>Post Property</Text>
            </TouchableOpacity>
          </View>
          
          {myListings.length === 0 ? (
            <View style={styles.emptyListingsBox}>
              <Ionicons name="business-outline" size={40} color="#9CA3AF" style={{ marginBottom: 12 }} />
              <Text style={styles.emptyListingsTitle}>No properties posted yet.</Text>
              <Text style={styles.emptyListingsSub}>Submit a property to RealShare Admin for approval to get it listed on the marketplace.</Text>
            </View>
          ) : (
            myListings.map((p) => {
              const isApproved = p.approval_status === 'approved';
              const isRejected = p.approval_status === 'rejected';
              
              let badgeBg = 'rgba(217, 119, 6, 0.15)'; // Pending (Orange)
              let badgeBorder = 'rgba(217, 119, 6, 0.3)';
              let textColor = '#D97706';
              let textLabel = 'Pending';
              
              if (isApproved) {
                badgeBg = 'rgba(16, 185, 129, 0.15)'; // Live (Green)
                badgeBorder = 'rgba(16, 185, 129, 0.3)';
                textColor = '#10B981';
                textLabel = 'Live';
              } else if (isRejected) {
                badgeBg = 'rgba(239, 68, 68, 0.15)'; // Rejected (Red)
                badgeBorder = 'rgba(239, 68, 68, 0.3)';
                textColor = '#EF4444';
                textLabel = 'Rejected';
              }

              return (
                <View key={p.id} style={styles.premiumLeadCard}>
                  <View style={styles.premiumLeadImagePlaceholder}>
                    {(() => {
                      const getImageUrl = (url: string) => url.startsWith('/') ? `${getApiUrl()}${url}` : url;
                      
                      if (p.images && p.images.length > 0 && p.images[0].image_url) {
                        return <Image source={{ uri: getImageUrl(p.images[0].image_url) }} style={{ width: '100%', height: '100%', borderRadius: 8 }} />;
                      } else if (p.image_url) {
                        return <Image source={{ uri: getImageUrl(p.image_url) }} style={{ width: '100%', height: '100%', borderRadius: 8 }} />;
                      } else {
                        return <Ionicons name="image-outline" size={24} color="#9CA3AF" />;
                      }
                    })()}
                  </View>
                  <View style={styles.premiumLeadInfo}>
                    <Text style={styles.premiumLeadName} numberOfLines={1}>{p.title}</Text>
                    <Text style={styles.premiumLeadMeta}>
                      {p.locality}, {p.district} • {p.listing_type === 'outright' ? 'Outright' : 'Fractional'}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View
                      style={[
                        styles.premiumStatusBadge,
                        { backgroundColor: badgeBg, borderColor: badgeBorder },
                      ]}
                    >
                      <Text
                        style={[
                          styles.premiumStatusText,
                          { color: textColor },
                        ]}
                      >
                        {textLabel}
                      </Text>
                    </View>
                    
                    {!isApproved && (
                      <TouchableOpacity 
                        onPress={() => handleDeleteProperty(p.id)}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <Ionicons name="trash-outline" size={16} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>

        </View>

      <Modal visible={showPostModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <ScrollView style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Post a Property</Text>
            <Text style={styles.modalSubtitle}>Submit a listing for RealShare Admin approval.</Text>

            <Text style={styles.inputLabel}>Listing Type</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              {(['fractional', 'outright'] as const).map((lt) => (
                <TouchableOpacity
                  key={lt}
                  style={[
                    { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
                    postListingType === lt
                      ? { backgroundColor: '#111827', borderColor: '#111827' }
                      : { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' },
                  ]}
                  onPress={() => setPostListingType(lt)}
                >
                  <Text style={{ color: postListingType === lt ? '#D4AF37' : '#374151', fontWeight: '700', fontSize: 12 }}>
                    {lt === 'fractional' ? 'Fractional' : 'Outright'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {postListingType === 'fractional' && (
              <>
                <Text style={styles.inputLabel}>Total Fractions</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={postFractions} onChangeText={setPostFractions} placeholderTextColor="#9CA3AF" />
              </>
            )}

            <Text style={styles.inputLabel}>{postListingType === 'outright' ? 'Property Price (₹)' : 'Price per Fraction (₹)'}</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={postPrice} onChangeText={setPostPrice} placeholderTextColor="#9CA3AF" />

            <Text style={styles.inputLabel}>Assured Yield (%)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={postYield} onChangeText={setPostYield} placeholderTextColor="#9CA3AF" />

            <Text style={styles.inputLabel}>Property Title</Text>
            <TextInput style={styles.input} placeholder="e.g. Skyline Residences" value={postTitle} onChangeText={setPostTitle} placeholderTextColor="#9CA3AF" />

            <Text style={styles.inputLabel}>Locality</Text>
            <TextInput style={styles.input} placeholder="e.g. Gachibowli" value={postLocality} onChangeText={setPostLocality} placeholderTextColor="#9CA3AF" />

            <Text style={styles.inputLabel}>District</Text>
            <TextInput style={styles.input} value={postDistrict} onChangeText={setPostDistrict} placeholderTextColor="#9CA3AF" />

            <Text style={styles.inputLabel}>State</Text>
            <TextInput style={styles.input} value={postState} onChangeText={setPostState} placeholderTextColor="#9CA3AF" />

            <Text style={styles.inputLabel}>Property Image (Optional)</Text>
            <TouchableOpacity 
              style={styles.imagePickerBtn}
              onPress={async () => {
                const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (permissionResult.granted === false) {
                  alert("You need to grant permission to access your photos.");
                  return;
                }
                const pickerResult = await ImagePicker.launchImageLibraryAsync({
                  mediaTypes: ImagePicker.MediaTypeOptions.Images,
                  allowsEditing: true,
                  aspect: [16, 9],
                  quality: 0.8,
                });
                if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
                  setPostImageUrl(pickerResult.assets[0].uri);
                }
              }}
            >
              {postImageUrl ? (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: postImageUrl }} style={styles.imagePreview} />
                  <View style={styles.changeImageOverlay}>
                    <Ionicons name="camera-reverse-outline" size={24} color="#FFF" />
                    <Text style={styles.changeImageText}>Change Photo</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="cloud-upload-outline" size={32} color="#9CA3AF" />
                  <Text style={styles.imagePlaceholderText}>Tap to select a photo</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBankBtn} onPress={handlePostProperty} disabled={postSubmitting}>
              {postSubmitting ? <ActivityIndicator color="#D4AF37" /> : <Text style={styles.saveBankText}>Submit for Approval</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBankBtn} onPress={() => setShowPostModal(false)} disabled={postSubmitting}>
              <Text style={styles.cancelBankText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6', // Light gray bg for contrast against dark cards
  },
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
    marginBottom: 20,
    marginTop: Platform.OS === 'web' ? 0 : 20,
  },
  iconBtn: {
    padding: 8,
  },
  backBtn: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#D4AF37', // Gold text
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1E293B',
  },
  avatarText: {
    color: '#111827',
    fontWeight: '900',
    fontSize: 22,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#10B981',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0F172A',
  },
  verifiedText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  profileDetails: {
    flex: 1,
  },
  agentName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  agencyName: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  tierBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  tierText: {
    color: '#D4AF37',
    fontSize: 11,
    fontWeight: '700',
  },
  content: {
    padding: 20,
    marginTop: -10, // Pull content slightly up
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  kpiBox: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 1,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: '900',
    marginVertical: 8,
  },
  kpiSub: {
    fontSize: 11,
    color: '#6B7280',
  },
  premiumReferralCard: {
    backgroundColor: '#111827', // Obsidian
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)', // Subtle Gold Border
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  premiumReferralHeader: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  premiumCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F9FAFB',
    marginBottom: 6,
  },
  premiumCardSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 20,
  },
  premiumLinkContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  premiumLinkInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    fontSize: 13,
    color: '#D1D5DB',
    fontWeight: '500',
  },
  premiumCopyBtn: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  premiumCopyBtnText: {
    color: '#111827',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    paddingBottom: 10,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chartWrapper: {
    alignItems: 'center',
    width: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  chartSub: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 16,
    marginTop: 4,
  },
  listingsContainer: {
    paddingHorizontal: 16,
    marginBottom: 40,
  },
  listingsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  listingsTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
  },
  postPropertyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4AF37',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  postPropertyBtnText: {
    color: '#111827',
    fontWeight: '800',
    fontSize: 13,
  },
  emptyListingsBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyListingsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  emptyListingsSub: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  premiumLeadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  premiumLeadImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  premiumLeadInfo: {
    flex: 1,
    marginRight: 12,
  },
  premiumLeadName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  premiumLeadMeta: {
    fontSize: 13,
    color: '#6B7280',
  },
  premiumStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  premiumStatusText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  quickActionBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginHorizontal: 4,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  notiIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  notiIcon: {
    fontSize: 20,
  },
  notiContent: {
    flex: 1,
  },
  notiTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  notiSub: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 18,
    marginBottom: 8,
  },
  notiTime: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  sectionContainer: {
    paddingTop: 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  propertyCard: {
    width: 260,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginRight: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  propertyImage: {
    width: '100%',
    height: 140,
  },
  propertyInfo: {
    padding: 12,
  },
  propertyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  propertyLocation: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  propertySplit: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  propertyPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  propertyCommission: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  propertyShareBtn: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  propertyShareBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  leadStats: {
    alignItems: 'flex-end',
  },
  commissionAmt: {
    fontSize: 16,
    fontWeight: '900',
    color: '#10B981',
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusPaid: {
    backgroundColor: '#D1FAE5',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusReview: {
    backgroundColor: '#F3F4F6',
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusTextPaid: {
    color: '#059669',
  },
  statusTextPending: {
    color: '#D97706',
  },
  statusTextReview: {
    color: '#4B5563',
  },
  bankCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  bankHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  bankSavedBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  bankSavedText: { color: '#059669', fontSize: 10, fontWeight: '800' },
  bankMaskedText: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 4 },
  bankAddBtn: { backgroundColor: '#111827', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  bankAddBtnText: { color: '#D4AF37', fontWeight: '800', fontSize: 13 },
  bankUpdateBtn: { backgroundColor: '#F3F4F6', paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginTop: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  bankUpdateBtnText: { color: '#4B5563', fontWeight: '700', fontSize: 12 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A', marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: '#64748B', marginBottom: 20 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 6, textTransform: 'uppercase' },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#0F172A', marginBottom: 16 },
  saveBankBtn: { backgroundColor: '#111827', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  saveBankText: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 14,
  },
  cancelBankBtn: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 40,
  },
  cancelBankText: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 14,
  },
  imagePickerBtn: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    overflow: 'hidden',
    backgroundColor: '#F9FAFB',
    marginBottom: 20,
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  imagePlaceholderText: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 13,
    marginTop: 8,
  },
  imagePreviewContainer: {
    flex: 1,
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  changeImageOverlay: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  changeImageText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  }
});
