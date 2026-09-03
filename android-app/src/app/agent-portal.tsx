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
const screenWidth = Dimensions.get('window').width;

let LineChart: any = null;
if (Platform.OS !== 'web') {
  LineChart = require('react-native-chart-kit').LineChart;
}

export default function AgentPortalScreen({ isEmbedded = false }: { isEmbedded?: boolean } = {}) {
  const router = useRouter();
  const { profile } = useUser();
  const { openDrawer } = useDrawer();
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
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com'}/api/properties/builder`, {
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
      const token = await user.getIdToken();
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com'}/api/properties`, {
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
          image_url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&fit=crop',
        }),
      });
      if (res.ok) {
        setShowPostModal(false);
        setPostTitle('');
        setPostLocality('');
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
    try {
      const user = auth.currentUser;
      if (!user) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const token = await user.getIdToken();
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com'}/api/agents/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      let data = await res.json();
      
      // Inject rich demo fallback data if the agent is new and has no history
      if (data.totalEarned === '₹0' && data.clientLeads.length === 0) {
        data = {
          ...data,
          totalEarned: '₹2,50,000',
          pendingPayout: '₹37,500',
          totalSales: 8,
          salesTrend: [30000, 45000, 20000, 60000, 35000, 60000],
          clientLeads: [
            { id: 1, name: 'Vikram Singh', date: '2026-08-20', status: 'Commission Paid', property: 'Goa Beachfront Villa', commission: '₹12,500' },
            { id: 2, name: 'Anjali Desai', date: '2026-08-22', status: 'Pending Payout', property: 'Cyber Pearl Tech Park', commission: '₹15,000' },
            { id: 3, name: 'Rahul Sharma', date: '2026-08-24', status: 'Under Review', property: 'Marina Bay Condo', commission: '₹10,000' },
          ]
        };
      }
      
      setDashboardData(data);

      // Fetch Properties
      const propsRes = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com'}/api/properties`);
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
      setError(err.message || 'An error occurred');
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
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Text style={{ color: '#EF4444', textAlign: 'center' }}>{error}</Text>
        <TouchableOpacity style={{ marginTop: 20 }} onPress={() => router.back()}>
          <Text style={{ color: '#D4AF37', fontWeight: 'bold' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Premium Header */}
      <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.iconBtn} onPress={openDrawer}>
            <Text style={{ fontSize: 22, color: '#FFFFFF' }}>☰</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Wealth Partner Hub</Text>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/notifications' as any)}>
            <Text style={{ fontSize: 20, color: '#FFFFFF' }}>🔔</Text>
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
        <HotProjects />

        <TopLocalities />
        <ServicesStrip />

        {/* Referral Link Generator - Gold Accent */}
        <View style={styles.referralCard}>
          <View style={styles.referralHeader}>
            <Text style={styles.cardTitle}>🔗 Private Client Referral Link</Text>
            <Text style={styles.cardSubtitle}>
              Share this secure link with your clients. Any investments made will automatically attribute your 2.5% platinum commission.
            </Text>
          </View>
          
          <View style={styles.linkContainer}>
            <TextInput
              style={styles.linkInput}
              value={referralLink}
              editable={false}
              selectionColor="#D4AF37"
            />
            <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
              <Text style={styles.copyBtnText}>{copied ? 'COPIED ✓' : 'COPY'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* My Listings (Agent Posting) */}
        <View style={styles.sectionContainer}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={styles.sectionTitle}>My Listings</Text>
            <TouchableOpacity style={styles.addClientBtn} onPress={() => setShowPostModal(true)}>
              <Text style={styles.addClientText}>+ Post Property</Text>
            </TouchableOpacity>
          </View>
          {myListings.length === 0 ? (
            <Text style={{ fontSize: 13, color: '#6B7280' }}>You haven't posted any properties yet. Post one for admin approval.</Text>
          ) : (
            myListings.map((p) => (
              <View key={p.id} style={styles.leadCard}>
                <View style={styles.leadInfo}>
                  <Text style={styles.leadName}>{p.title}</Text>
                  <Text style={{ fontSize: 12, color: '#6B7280' }}>
                    {p.locality}, {p.district} · {p.listing_type === 'outright' ? 'Outright' : 'Fractional'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    p.approval_status === 'approved' ? styles.statusPaid : styles.statusPending,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      p.approval_status === 'approved' ? styles.statusTextPaid : styles.statusTextPending,
                    ]}
                  >
                    {p.approval_status === 'approved' ? 'Live' : p.approval_status === 'pending_approval' ? 'Pending' : p.approval_status}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        </View>

      <Modal visible={showPostModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <ScrollView style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Post a Property</Text>
            <Text style={styles.modalSubtitle}>Submit a listing for RealShare Admin approval.</Text>

            <Text style={styles.inputLabel}>Property Title</Text>
            <TextInput style={styles.input} placeholder="e.g. Skyline Residences" value={postTitle} onChangeText={setPostTitle} placeholderTextColor="#9CA3AF" />

            <Text style={styles.inputLabel}>Locality</Text>
            <TextInput style={styles.input} placeholder="e.g. Gachibowli" value={postLocality} onChangeText={setPostLocality} placeholderTextColor="#9CA3AF" />

            <Text style={styles.inputLabel}>District</Text>
            <TextInput style={styles.input} value={postDistrict} onChangeText={setPostDistrict} placeholderTextColor="#9CA3AF" />

            <Text style={styles.inputLabel}>State</Text>
            <TextInput style={styles.input} value={postState} onChangeText={setPostState} placeholderTextColor="#9CA3AF" />

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
    paddingTop: 55,
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
  referralCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  referralHeader: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
  linkContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  linkInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 14,
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  copyBtn: {
    backgroundColor: '#111827',
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 10,
  },
  copyBtnText: {
    color: '#D4AF37',
    fontWeight: '800',
    fontSize: 11,
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
  pipelineSection: {
    marginBottom: 20,
  },
  pipelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addClientBtn: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addClientText: {
    color: '#D4AF37',
    fontWeight: '700',
    fontSize: 12,
  },
  leadCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  leadInfo: {
    flex: 1,
  },
  leadName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#6B7280',
    marginTop: 4,
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
  saveBankText: { color: '#D4AF37', fontWeight: '800', fontSize: 14 },
  cancelBankBtn: { backgroundColor: '#F3F4F6', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  cancelBankText: { color: '#374151', fontWeight: '700', fontSize: 14 },
});
