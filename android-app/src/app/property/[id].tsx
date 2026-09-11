import React, { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Platform,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '@/lib/firebase';
import { useUser } from '@/contexts/UserContext';
import { useDrawer } from '@/contexts/DrawerContext';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';
import { GoldButton } from '@/components/ui/GoldButton';
import { InvestmentScore } from '@/components/ui/InvestmentScore';
import { TrustBadge } from '@/components/ui/TrustBadge';
import { WebFooter } from '@/components/layout/WebFooter';
import { PropertyInquiryModal } from '@/components/ui/PropertyInquiryModal';
import { useActivityHistory } from '@/hooks/useActivityHistory';
import { getApiUrl, resilientFetch } from '@/lib/api';

export default function PropertyDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { profile } = useUser();
  const { toggleDrawer } = useDrawer();
  const { addView } = useActivityHistory();

  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    resilientFetch(`${getApiUrl()}/api/properties/${id}`)
      .then(res => res.json())
      .then(data => {
        setProperty(data);
        setLoading(false);
        if (data && data.id) {
          addView(data);
        }
      })
      .catch(err => {
        console.error('Failed to fetch property details:', err);
        setLoading(false);
      });
  }, [id]);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fractionsToBuy, setFractionsToBuy] = useState(1);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [investmentSuccess, setInvestmentSuccess] = useState(false);
  const [certificateId, setCertificateId] = useState('');
  const [askingQuestion, setAskingQuestion] = useState(false);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [calcDownPct, setCalcDownPct] = useState("20");
  const [calcInterest, setCalcInterest] = useState("7.25");
  const [calcYears, setCalcYears] = useState("30");
  const [calcPriceStr, setCalcPriceStr] = useState("");
  const [activeTab, setActiveTab] = useState("Overview");
  const [showGallery, setShowGallery] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [descMaxLines, setDescMaxLines] = useState(5);
  const [totalDescLines, setTotalDescLines] = useState(0);
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={GoldSystem.primaryGold} />
      </View>
    );
  }

  if (!property) {
    return (
      <View style={styles.centerContainer}>
        <Text style={{ color: Neutrals.obsidian }}>Property not found</Text>
        <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={{ marginTop: 16 }}>
          <Text style={{ color: GoldSystem.primaryGold }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // The API rejects the inquiry (400) when there's no listing contact or
  // the caller posted the listing themselves -- both are knowable from the
  // property record we already have, so hide the entry point rather than
  // let the user tap it and hit an error.
  const canAskQuestion = !!property.posted_by && property.posted_by !== profile?.id;

  const handleAskQuestion = async () => {
    if (askingQuestion) return;
    if (!auth.currentUser) {
      router.push('/(auth)/sign-in' as any);
      return;
    }
    setAskingQuestion(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${getApiUrl()}/api/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type: 'property_inquiry', property_id: property.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.id) {
        router.push(('/conversations/' + data.id) as any);
      } else {
        alert(data?.error || 'Could not start a conversation about this property right now.');
      }
    } catch (err) {
      console.warn('Failed to start property inquiry conversation:', err);
      alert('Could not start a conversation about this property right now.');
    } finally {
      setAskingQuestion(false);
    }
  };

  const fractionPrice = Number(property.price_per_fraction) || Number(property.price) || 0;
  const bookingAmtPerFrac = Number(property.booking_amount) || 25000;
  const isOutright = property.listing_type === 'outright';
  const totalBookingAmt = isOutright ? fractionsToBuy * fractionPrice : fractionsToBuy * bookingAmtPerFrac;
  const isSoldOut = property.is_sold_out || property.approval_status === 'sold_out' || (property.total_fractions > 0 && property.available_fractions <= 0);

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (Platform.OS !== 'web') {
        resolve(true); 
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleInitiatePayment = async () => {
    setIsProcessing(true);
    
    // Load Razorpay Script (for Web)
    const res = await loadRazorpay();
    if (!res && Platform.OS === 'web') {
      alert('Razorpay SDK failed to load. Are you online?');
      setIsProcessing(false);
      return;
    }

    try {
      // 1. Get Firebase Token — never fall back to a fake token; if the user
      // isn't actually signed in, stop and send them to sign in instead of
      // letting a real-money payment flow proceed unauthenticated.
      if (!auth.currentUser) {
        alert('Please sign in to continue.');
        setIsProcessing(false);
        return;
      }
      const token = await auth.currentUser.getIdToken();

      // 2. Create Order on Backend
      const orderResponse = await fetch(`${getApiUrl()}/api/transactions/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          propertyId: property.id,
          amount: totalBookingAmt,
          fractionsBought: fractionsToBuy
        })
      });

      const orderData = await orderResponse.json();
      if (!orderResponse.ok) {
        throw new Error(orderData.error || 'Failed to create order');
      }

      // 3. Open Razorpay Modal (Web)
      if (Platform.OS === 'web') {
        const options = {
          key: orderData.keyId || process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_TSKXy2WO8gcwyH', 
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'RealShare',
          description: `Booking for ${property.title}`,
          order_id: orderData.orderId,
          handler: async function (response: any) {
            // 4. Verify Payment on Backend
            const verifyRes = await fetch(`${getApiUrl()}/api/transactions/verify-payment`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                transactionId: orderData.transactionId
              })
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              setCertificateId(verifyData.certificateId);
              setInvestmentSuccess(true);
            } else {
              alert('Payment Verification Failed!');
            }
          },
          prefill: {
            name: auth.currentUser?.displayName || 'Investor',
            email: auth.currentUser?.email || '',
          },
          theme: {
            color: GoldSystem.primaryGold
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (response: any) {
          alert('Payment Failed: ' + response.error.description);
        });
        rzp.open();
      } else {
        // Fallback for native testing 
        alert('Native payment not configured yet. Opening mock success.');
        const generatedCert = `RS-CERT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
        setCertificateId(generatedCert);
        setInvestmentSuccess(true);
      }
    } catch (err: any) {
      alert(err.message || 'Payment initiation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      {!isDesktop && (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'web' ? 16 : Platform.OS === 'android' ? 40 : 50, paddingBottom: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', zIndex: 10 }}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={{ padding: 8, marginLeft: -8, zIndex: 20 }}>
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: 16, alignItems: 'center', zIndex: 10 }}>
            <Image 
              source={require('../../../assets/logo.png')} 
              style={{ width: 140, height: 40, transform: [{ scale: 1.1 }] }} 
              contentFit="contain" 
            />
          </View>
          <TouchableOpacity onPress={toggleDrawer} style={{ padding: 8, marginRight: -8, zIndex: 20 }}>
            <Ionicons name="menu" size={24} color="#1E293B" />
          </TouchableOpacity>
        </View>
      )}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: isDesktop ? 48 : 24, paddingBottom: 48 }}>
        
        {/* Desktop Container */}
        <View style={{ width: '100%', maxWidth: 1400, paddingHorizontal: isDesktop ? 32 : 0, alignSelf: 'center' }}>
          
          {/* Breadcrumbs (Desktop only) */}
          {isDesktop && (
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16 }}>
              <Text style={{ color: '#64748B', fontSize: 13, fontWeight: '500' }}>Home</Text>
              <Text style={{ color: '#94A3B8', fontSize: 13, marginHorizontal: 8 }}>›</Text>
              <Text style={{ color: '#64748B', fontSize: 13, fontWeight: '500' }}>Properties</Text>
              <Text style={{ color: '#94A3B8', fontSize: 13, marginHorizontal: 8 }}>›</Text>
              <Text style={{ color: '#1E293B', fontSize: 13, fontWeight: '600' }}>{property.title}</Text>
            </View>
          )}

          {/* Main Layout Wrapper */}
          <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: isDesktop ? 40 : 0 }}>
            
            {/* Left Column (Main Content) */}
            <View style={{ flex: 1 }}>
              
              {/* Desktop Header & Gallery Row */}
              <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 32, padding: isDesktop ? 0 : 16, marginBottom: 32 }}>
                
                {/* Text Side (or top on mobile) */}
                <View style={{ width: isDesktop ? 340 : '100%' }}>
                  {/* Title + Status Badge */}
                  <Text style={{ fontSize: isDesktop ? 28 : 22, fontWeight: '800', color: '#1E293B', marginBottom: 4 }}>
                    {property.title}
                  </Text>
                  
                  {property.approval_status === 'upcoming' && (
                    <View style={{ alignSelf: 'flex-start', backgroundColor: '#FEF08A', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginBottom: 12 }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#854D0E' }}>📅 Upcoming</Text>
                    </View>
                  )}

                  {/* Location + Google Maps link */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={{ fontSize: 14, color: '#475569', fontWeight: '500' }}>📍 {property.locality || property.district}, {property.state || 'Telangana'}</Text>
                    {(property.google_maps_url || (property.lat && property.lng)) && (
                      <TouchableOpacity
                        onPress={() => {
                          const url = property.google_maps_url || `https://www.google.com/maps/search/?api=1&query=${property.lat},${property.lng}`;
                          if (Platform.OS === 'web') window.open(url, '_blank');
                          else require('react-native').Linking.openURL(url);
                        }}
                        style={{ marginLeft: 16 }}
                      >
                        <Text style={{ color: '#1E293B', fontWeight: '700', fontSize: 13 }}>Open in Google Maps ↗</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Tagline + Short Description */}
                  {property.tagline && (
                    <Text style={{ fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 8 }}>
                      {property.tagline}
                    </Text>
                  )}
                  <Text style={{ fontSize: 14, color: '#64748B', lineHeight: 22, marginBottom: 20 }}>
                    {(property.description || 'Premium property with excellent investment potential and high capital growth prospects.').substring(0, 200)}
                    {(property.description || '').length > 200 ? '...' : ''}
                  </Text>

                  {/* Quick Stats & Details Container */}
                  <View style={{ marginTop: 16, backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 16 }}>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 16, columnGap: 12 }}>
                      {(property.property_type === 'Residential' || property.property_type === 'Holiday') ? (
                        <>
                          <View style={{ width: '45%', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Ionicons name="business-outline" size={20} color="#64748B" />
                            <View>
                              <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '600' }}>Type</Text>
                              <Text style={{ fontSize: 13, color: '#1E293B', fontWeight: '700' }}>{property.floor_type || 'High Rise'}</Text>
                            </View>
                          </View>
                          <View style={{ width: '45%', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Ionicons name="resize-outline" size={20} color="#64748B" />
                            <View>
                              <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '600' }}>Area</Text>
                              <Text style={{ fontSize: 13, color: '#1E293B', fontWeight: '700' }}>{Number(property.area_sqft).toLocaleString('en-IN')}{property.area_sqft_max ? ` - ${Number(property.area_sqft_max).toLocaleString('en-IN')}` : ''} {property.area_unit || 'Sq.ft'}</Text>
                            </View>
                          </View>
                          {property.flooring && (
                            <View style={{ width: '45%', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              <Ionicons name="grid-outline" size={20} color="#64748B" />
                              <View>
                                <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '600' }}>Flooring</Text>
                                <Text style={{ fontSize: 13, color: '#1E293B', fontWeight: '700' }}>{property.flooring}</Text>
                              </View>
                            </View>
                          )}
                        </>
                      ) : (property.property_type === 'Commercial' || property.property_type === 'Fractional') ? (
                        <>
                          <View style={{ width: '45%', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Ionicons name="business-outline" size={20} color="#64748B" />
                            <View>
                              <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '600' }}>Type</Text>
                              <Text style={{ fontSize: 13, color: '#1E293B', fontWeight: '700' }}>{property.sub_type || 'Office'}</Text>
                            </View>
                          </View>
                          <View style={{ width: '45%', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Ionicons name="resize-outline" size={20} color="#64748B" />
                            <View>
                              <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '600' }}>Area</Text>
                              <Text style={{ fontSize: 13, color: '#1E293B', fontWeight: '700' }}>{Number(property.area_sqft).toLocaleString('en-IN')}{property.area_sqft_max ? ` - ${Number(property.area_sqft_max).toLocaleString('en-IN')}` : ''} {property.area_unit || 'Sq.ft'}</Text>
                            </View>
                          </View>
                          <View style={{ width: '45%', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Ionicons name={property.food_courts ? "fast-food-outline" : "card-outline"} size={20} color="#B48811" />
                            <View>
                              <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '600' }}>Facilities</Text>
                              <Text style={{ fontSize: 13, color: '#1E293B', fontWeight: '700' }}>
                                {property.food_courts ? 'Food Courts, ' : ''}{property.amenities || 'ATMs'}
                              </Text>
                            </View>
                          </View>
                          {property.flooring && (
                            <View style={{ width: '45%', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              <Ionicons name="grid-outline" size={20} color="#64748B" />
                              <View>
                                <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '600' }}>Flooring</Text>
                                <Text style={{ fontSize: 13, color: '#1E293B', fontWeight: '700' }}>{property.flooring}</Text>
                              </View>
                            </View>
                          )}
                        </>
                      ) : (
                        <>
                          <View style={{ width: '45%', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Ionicons name="pricetag-outline" size={20} color="#64748B" />
                            <View>
                              <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '600' }}>Type</Text>
                              <Text style={{ fontSize: 13, color: '#1E293B', fontWeight: '700' }}>{property.sub_type || 'Open Plot'}</Text>
                            </View>
                          </View>
                          <View style={{ width: '45%', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Ionicons name="resize-outline" size={20} color="#64748B" />
                            <View>
                              <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '600' }}>Area</Text>
                              <Text style={{ fontSize: 13, color: '#1E293B', fontWeight: '700' }}>{Number(property.area_sqft).toLocaleString('en-IN')}{property.area_sqft_max ? ` - ${Number(property.area_sqft_max).toLocaleString('en-IN')}` : ''} {property.area_unit || 'Sq.ft'}</Text>
                            </View>
                          </View>
                        </>
                      )}
                    </View>

                    {/* RERA and Permission Number */}
                    {(property.rera_number || property.permission_number) && (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 16, columnGap: 12, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#E2E8F0', marginTop: 16 }}>
                        {property.rera_number && (
                          <View style={{ width: '45%', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Ionicons name="document-text-outline" size={20} color="#64748B" />
                            <View>
                              <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '600' }}>RERA Number</Text>
                              <Text style={{ fontSize: 13, color: '#1E293B', fontWeight: '700' }} numberOfLines={1}>{property.rera_number}</Text>
                            </View>
                          </View>
                        )}
                        {property.permission_number && (
                          <View style={{ width: '45%', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Ionicons name="shield-checkmark-outline" size={20} color="#64748B" />
                            <View>
                              <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '600' }}>Permission Number</Text>
                              <Text style={{ fontSize: 13, color: '#1E293B', fontWeight: '700' }} numberOfLines={1}>{property.permission_number}</Text>
                            </View>
                          </View>
                        )}
                      </View>
                    )}
                  </View>

                  {/* Property Posted By Card */}
                  <View style={{ marginTop: 16, padding: 14, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    {property.profile?.avatar_url ? (
                      <Image 
                        source={{ uri: property.profile.avatar_url }} 
                        style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#CBD5E1' }} 
                      />
                    ) : (
                      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="person" size={24} color="#94A3B8" />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 10, color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        PROPERTY POSTED BY {property.profile?.role === 'admin' ? 'REALSHARE(ADMIN)' : property.profile?.role ? property.profile.role.toUpperCase() : 'USER'}
                      </Text>
                      <Text style={{ fontSize: 15, color: '#1E293B', fontWeight: '700', marginTop: 2 }}>
                        {property.profile?.role === 'admin' ? 'RealShare Official' : property.profile?.full_name || property.developer?.name || 'Unknown User'}
                      </Text>
                    </View>
                    <Ionicons name="checkmark-circle" size={20} color="#059669" />
                  </View>
                </View>

                {/* Gallery Side */}
                <View style={{ flex: 1, width: isDesktop ? undefined : '100%' }}>
                  <TouchableOpacity 
                    activeOpacity={0.9}
                    onPress={() => { setGalleryIndex(0); setShowGallery(true); }}
                    style={{ width: '100%', height: isDesktop ? 420 : 240, borderRadius: 16, overflow: 'hidden', position: 'relative', marginBottom: 12 }}
                  >
                    <Image 
                      source={{ uri: property.images?.[0]?.image_url || 'https://via.placeholder.com/800x600' }} 
                      style={{ width: '100%', height: '100%' }} 
                      contentFit="cover"
                    />
                    <TouchableOpacity style={{ position: 'absolute', top: 16, right: 72, width: 44, height: 44, backgroundColor: '#fff', borderRadius: 22, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }}>
                      <Ionicons name="heart-outline" size={22} color="#1E293B" />
                    </TouchableOpacity>
                    <TouchableOpacity style={{ position: 'absolute', top: 16, right: 16, width: 44, height: 44, backgroundColor: '#fff', borderRadius: 22, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }}>
                      <Ionicons name="share-social-outline" size={22} color="#1E293B" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => { setGalleryIndex(0); setShowGallery(true); }}
                      style={{ position: 'absolute', bottom: 16, right: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.8)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24 }}
                    >
                      <Ionicons name="play-circle-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                      <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>View Gallery</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                  {/* Thumbnails */}
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    {property.images?.slice(1, 6).map((img: any, idx: number) => {
                      const isLast = idx === 4;
                      const extraCount = (property.images?.length || 0) - 6;
                      
                      return (
                        <TouchableOpacity 
                          key={idx} 
                          activeOpacity={0.8}
                          onPress={() => { setGalleryIndex(idx + 1); setShowGallery(true); }}
                          style={{ flex: 1, height: 80, borderRadius: 12, overflow: 'hidden', position: 'relative' }}
                        >
                          <Image source={{ uri: img.image_url }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                          {isLast && extraCount > 0 && (
                            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
                              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>+{extraCount}</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>

              {/* Tabs Section */}
              <View style={{ paddingHorizontal: isDesktop ? 0 : 16 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 8, marginBottom: 24, gap: 24 }}>
                  {['Overview', 'Property Details', 'Amenities', 'Location', 'Developer', 'Documents'].map((tab) => (
                    <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: activeTab === tab ? '#D4AF37' : '#64748B', paddingBottom: 4 }}>
                        {tab}
                      </Text>
                      {activeTab === tab && <View style={{ position: 'absolute', bottom: -9, left: 0, right: 0, height: 2, backgroundColor: '#D4AF37' }} />}
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Dynamic Tab Content */}
                
                {/* Overview Tab */}
                {activeTab === 'Overview' && (
                  <>
                    <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 24, marginBottom: 32 }}>
                      <View style={{ flex: 1, position: 'relative' }}>
                        <Text style={{ fontSize: 20, fontWeight: '800', color: '#1E293B', marginBottom: 16 }}>About this Property</Text>
                        
                        {/* Hidden text to calculate total lines accurately */}
                        <Text 
                          style={{ fontSize: 14, color: '#475569', lineHeight: 24, position: 'absolute', opacity: 0, zIndex: -10, width: '100%' }}
                          onTextLayout={(e) => setTotalDescLines(e.nativeEvent.lines.length || 0)}
                        >
                          {property.description || 'Premium property with excellent investment potential and high capital growth prospects. Located in a prime area with seamless connectivity.\n\nDesigned to serve the evolving needs of the growing urban population, the development aims to create a vibrant environment combining shopping, leisure and everyday conveniences under one destination.'}
                        </Text>

                        {/* Visible constrained text */}
                        <Text style={{ fontSize: 14, color: '#475569', lineHeight: 24 }} numberOfLines={descMaxLines}>
                          {property.description || 'Premium property with excellent investment potential and high capital growth prospects. Located in a prime area with seamless connectivity.\n\nDesigned to serve the evolving needs of the growing urban population, the development aims to create a vibrant environment combining shopping, leisure and everyday conveniences under one destination.'}
                        </Text>

                        {(totalDescLines > descMaxLines || ((property.description || 'Premium property with excellent investment potential and high capital growth prospects. Located in a prime area with seamless connectivity.\n\nDesigned to serve the evolving needs of the growing urban population, the development aims to create a vibrant environment combining shopping, leisure and everyday conveniences under one destination.').length > descMaxLines * 50 && totalDescLines === 0)) && (
                          <TouchableOpacity 
                            onPress={() => setDescMaxLines(prev => prev + 5)}
                            style={{ marginTop: 8, alignSelf: 'flex-start', paddingVertical: 4 }}
                          >
                            <Text style={{ color: '#059669', fontWeight: '700', fontSize: 14 }}>Read More ▾</Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      <View style={{ width: isDesktop ? 280 : '100%', backgroundColor: '#FAFAFA', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 16 }}>
                        <Text style={{ fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 16 }}>📋 Quick Facts</Text>
                        
                        {(property.property_type === 'Commercial' || property.property_type === 'Fractional') ? (
                          <View style={{ gap: 12 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                              <Text style={{ fontSize: 13, color: '#64748B' }}><Ionicons name="business-outline" /> Type</Text>
                              <Text style={{ fontSize: 13, color: '#1E293B', fontWeight: '700' }}>{property.sub_type || 'Office'}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                              <Text style={{ fontSize: 13, color: '#64748B' }}><Ionicons name="resize-outline" /> Area</Text>
                              <Text style={{ fontSize: 13, color: '#1E293B', fontWeight: '700' }}>{Number(property.area_sqft).toLocaleString('en-IN')} Sq.ft</Text>
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                              <Text style={{ fontSize: 13, color: '#64748B' }}><Ionicons name="bed-outline" /> Furnished</Text>
                              <Text style={{ fontSize: 13, color: '#1E293B', fontWeight: '700' }}>{property.furnished ? 'Yes' : 'No'}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                              <Text style={{ fontSize: 13, color: '#64748B' }}><Ionicons name="flash-outline" /> Plug & Play</Text>
                              <Text style={{ fontSize: 13, color: '#1E293B', fontWeight: '700' }}>{property.plug_and_play ? 'Yes' : 'No'}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                              <Text style={{ fontSize: 13, color: '#64748B' }}><Ionicons name="snow-outline" /> Central AC</Text>
                              <Text style={{ fontSize: 13, color: '#1E293B', fontWeight: '700' }}>{property.central_ac ? 'Yes' : 'No'}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
                              <Text style={{ fontSize: 13, color: '#64748B' }}><Ionicons name="construct-outline" /> Maintenance</Text>
                              <Text style={{ fontSize: 13, color: '#1E293B', fontWeight: '700' }}>{property.maintenance_avail ? 'Yes' : 'No'}</Text>
                            </View>
                          </View>
                        ) : (
                          <View style={{ gap: 12 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                              <Text style={{ fontSize: 13, color: '#64748B' }}><Ionicons name="home-outline" /> Type</Text>
                              <Text style={{ fontSize: 13, color: '#1E293B', fontWeight: '700' }}>{property.floor_type || 'Residential'}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                              <Text style={{ fontSize: 13, color: '#64748B' }}><Ionicons name="resize-outline" /> Area</Text>
                              <Text style={{ fontSize: 13, color: '#1E293B', fontWeight: '700' }}>{Number(property.area_sqft).toLocaleString('en-IN')} Sq.ft</Text>
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                              <Text style={{ fontSize: 13, color: '#64748B' }}><Ionicons name="bed-outline" /> Bedrooms</Text>
                              <Text style={{ fontSize: 13, color: '#1E293B', fontWeight: '700' }}>{property.bedrooms || 0}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                              <Text style={{ fontSize: 13, color: '#64748B' }}><Ionicons name="water-outline" /> Bathrooms</Text>
                              <Text style={{ fontSize: 13, color: '#1E293B', fontWeight: '700' }}>{property.bathrooms || 0}</Text>
                            </View>
                          </View>
                        )}
                      </View>
                    </View>
                  </>
                )}

                {/* Property Details Tab */}
                {activeTab === 'Property Details' && (
                  <View style={{ backgroundColor: '#FAFAFA', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 24, marginBottom: 32 }}>
                    <Text style={{ fontSize: 20, fontWeight: '800', color: '#1E293B', marginBottom: 20 }}>Detailed Specifications</Text>
                    
                    {(property.property_type === 'Commercial' || property.property_type === 'Fractional') ? (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 24 }}>
                        <View style={{ width: 160, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                          <Text style={{ fontSize: 13, color: '#64748B', marginBottom: 4 }}><Ionicons name="business-outline" /> Property Type</Text>
                          <Text style={{ fontSize: 14, color: '#1E293B', fontWeight: '700' }}>{property.sub_type || 'Office'}</Text>
                        </View>
                        <View style={{ width: 160, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                          <Text style={{ fontSize: 13, color: '#64748B', marginBottom: 4 }}><Ionicons name="resize-outline" /> Super Built-up Area</Text>
                          <Text style={{ fontSize: 14, color: '#1E293B', fontWeight: '700' }}>{Number(property.area_sqft).toLocaleString('en-IN')} Sq.ft</Text>
                        </View>
                        <View style={{ width: 160, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                          <Text style={{ fontSize: 13, color: '#64748B', marginBottom: 4 }}><Ionicons name="bed-outline" /> Furnishing</Text>
                          <Text style={{ fontSize: 14, color: '#1E293B', fontWeight: '700' }}>{property.furnished ? 'Fully Furnished' : 'Unfurnished'}</Text>
                        </View>
                        <View style={{ width: 160, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                          <Text style={{ fontSize: 13, color: '#64748B', marginBottom: 4 }}><Ionicons name="flash-outline" /> Plug & Play Status</Text>
                          <Text style={{ fontSize: 14, color: '#1E293B', fontWeight: '700' }}>{property.plug_and_play ? 'Available' : 'Not Available'}</Text>
                        </View>
                        <View style={{ width: 160, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                          <Text style={{ fontSize: 13, color: '#64748B', marginBottom: 4 }}><Ionicons name="snow-outline" /> HVAC / Central AC</Text>
                          <Text style={{ fontSize: 14, color: '#1E293B', fontWeight: '700' }}>{property.central_ac ? 'Provided' : 'Not Provided'}</Text>
                        </View>
                      </View>
                    ) : (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 24 }}>
                        <View style={{ width: 160, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                          <Text style={{ fontSize: 13, color: '#64748B', marginBottom: 4 }}><Ionicons name="home-outline" /> Property Type</Text>
                          <Text style={{ fontSize: 14, color: '#1E293B', fontWeight: '700' }}>{property.floor_type || 'Residential'}</Text>
                        </View>
                        <View style={{ width: 160, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                          <Text style={{ fontSize: 13, color: '#64748B', marginBottom: 4 }}><Ionicons name="resize-outline" /> Built-up Area</Text>
                          <Text style={{ fontSize: 14, color: '#1E293B', fontWeight: '700' }}>{Number(property.area_sqft).toLocaleString('en-IN')} Sq.ft</Text>
                        </View>
                        <View style={{ width: 160, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                          <Text style={{ fontSize: 13, color: '#64748B', marginBottom: 4 }}><Ionicons name="bed-outline" /> Bedrooms</Text>
                          <Text style={{ fontSize: 14, color: '#1E293B', fontWeight: '700' }}>{property.bedrooms || 0}</Text>
                        </View>
                        <View style={{ width: 160, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                          <Text style={{ fontSize: 13, color: '#64748B', marginBottom: 4 }}><Ionicons name="water-outline" /> Bathrooms</Text>
                          <Text style={{ fontSize: 14, color: '#1E293B', fontWeight: '700' }}>{property.bathrooms || 0}</Text>
                        </View>
                        <View style={{ width: 160, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                          <Text style={{ fontSize: 13, color: '#64748B', marginBottom: 4 }}><Ionicons name="car-outline" /> Parking</Text>
                          <Text style={{ fontSize: 14, color: '#1E293B', fontWeight: '700' }}>{property.parking_count || 1} Reserved</Text>
                        </View>
                      </View>
                    )}
                  </View>
                )}

                {/* Amenities Tab (or always show in Overview) */}
                {(activeTab === 'Overview' || activeTab === 'Amenities') && (
                  <View style={{ marginBottom: 32 }}>
                    <Text style={{ fontSize: 20, fontWeight: '800', color: '#1E293B', marginBottom: 16 }}>Amenities</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
                      {(property.property_type === 'Commercial' || property.property_type === 'Fractional') ? (
                        <>
                          {property.food_courts && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 16, minWidth: 160 }}><Ionicons name="fast-food-outline" size={24} color="#D4AF37" /><Text style={{ fontSize: 14, color: '#1E293B', fontWeight: '600' }}>Food Courts</Text></View>}
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 16, minWidth: 160 }}><Ionicons name="card-outline" size={24} color="#D4AF37" /><Text style={{ fontSize: 14, color: '#1E293B', fontWeight: '600' }}>ATMs</Text></View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 16, minWidth: 160 }}><Ionicons name="cart-outline" size={24} color="#D4AF37" /><Text style={{ fontSize: 14, color: '#1E293B', fontWeight: '600' }}>Retail Spaces</Text></View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 16, minWidth: 160 }}><Ionicons name="game-controller-outline" size={24} color="#D4AF37" /><Text style={{ fontSize: 14, color: '#1E293B', fontWeight: '600' }}>Entertainment</Text></View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 16, minWidth: 160 }}><Ionicons name="car-outline" size={24} color="#D4AF37" /><Text style={{ fontSize: 14, color: '#1E293B', fontWeight: '600' }}>Ample Parking</Text></View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 16, minWidth: 160 }}><Ionicons name="shield-checkmark-outline" size={24} color="#D4AF37" /><Text style={{ fontSize: 14, color: '#1E293B', fontWeight: '600' }}>24x7 Security</Text></View>
                        </>
                      ) : (
                        <>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 16, minWidth: 160 }}><Ionicons name="barbell-outline" size={24} color="#D4AF37" /><Text style={{ fontSize: 14, color: '#1E293B', fontWeight: '600' }}>Gym</Text></View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 16, minWidth: 160 }}><Ionicons name="water-outline" size={24} color="#D4AF37" /><Text style={{ fontSize: 14, color: '#1E293B', fontWeight: '600' }}>Swimming Pool</Text></View>
                          {property.club_house && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 16, minWidth: 160 }}><Ionicons name="home-outline" size={24} color="#D4AF37" /><Text style={{ fontSize: 14, color: '#1E293B', fontWeight: '600' }}>Club House</Text></View>}
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 16, minWidth: 160 }}><Ionicons name="car-outline" size={24} color="#D4AF37" /><Text style={{ fontSize: 14, color: '#1E293B', fontWeight: '600' }}>Parking</Text></View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 16, minWidth: 160 }}><Ionicons name="shield-checkmark-outline" size={24} color="#D4AF37" /><Text style={{ fontSize: 14, color: '#1E293B', fontWeight: '600' }}>Security</Text></View>
                        </>
                      )}
                    </View>
                  </View>
                )}

                {/* Location Tab */}
                {activeTab === 'Location' && (
                  <View style={{ marginBottom: 32 }}>
                    <Text style={{ fontSize: 20, fontWeight: '800', color: '#1E293B', marginBottom: 16 }}>Location Map</Text>
                    {property.lat && property.lng ? (
                      <View style={{ height: 340, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0' }}>
                        {Platform.OS === 'web' ? (
                          <div
                            style={{ width: '100%', height: '100%' }}
                            dangerouslySetInnerHTML={{
                              __html: `<iframe width="100%" height="100%" frameborder="0" style="border:0;" loading="lazy" allowfullscreen src="https://maps.google.com/maps?q=${parseFloat(property.lat)},${parseFloat(property.lng)}&z=15&output=embed"></iframe>`,
                            }}
                          />
                        ) : (
                          <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: Neutrals.gray200 }}>
                            <Ionicons name="location-outline" size={32} color="#64748B" />
                            <Text style={{ color: Neutrals.gray600, fontWeight: '600', marginTop: 8 }}>{property.locality || property.district}</Text>
                          </View>
                        )}
                      </View>
                    ) : (
                      <View style={{ height: 100, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' }}>
                        <Ionicons name="map-outline" size={32} color="#CBD5E1" />
                        <Text style={{ color: '#94A3B8', marginTop: 8 }}>Location map coordinates not provided</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Developer / Documents Tabs */}
                {activeTab === 'Developer' && (
                  <View style={{ marginBottom: 32, padding: 24, backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' }}>
                    <Text style={{ fontSize: 20, fontWeight: '800', color: '#1E293B', marginBottom: 16 }}>About the Developer</Text>
                    {property.developer ? (
                      <View style={{ gap: 16 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                          {property.developer.logo_url && (
                            <Image source={{ uri: property.developer.logo_url }} style={{ width: 64, height: 64, borderRadius: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0' }} contentFit="contain" />
                          )}
                          <View>
                            <Text style={{ fontSize: 18, fontWeight: '700', color: '#1E293B' }}>{property.developer.name}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                              <Text style={{ fontSize: 13, color: '#D4AF37', fontWeight: '700' }}>★ {property.developer.rating}</Text>
                              {property.developer.established_year && <Text style={{ fontSize: 13, color: '#64748B' }}>• Est. {property.developer.established_year}</Text>}
                              {property.developer.rera_registered && <Text style={{ fontSize: 11, color: '#16A34A', backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontWeight: '700', marginLeft: 4 }}>RERA</Text>}
                            </View>
                          </View>
                        </View>
                        <Text style={{ fontSize: 14, color: '#475569', lineHeight: 22 }}>
                          {property.developer.bio || 'Information about the developer or agent will be listed here. They specialize in high-quality commercial and residential properties.'}
                        </Text>
                      </View>
                    ) : property.profile ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                        <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' }}>
                          <Ionicons name="person" size={24} color="#94A3B8" />
                        </View>
                        <View>
                          <Text style={{ fontSize: 16, fontWeight: '700', color: '#1E293B' }}>{property.profile.full_name || 'Agent'}</Text>
                          <Text style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>{property.profile.role ? property.profile.role.charAt(0).toUpperCase() + property.profile.role.slice(1) : 'Real Estate Agent'}</Text>
                        </View>
                      </View>
                    ) : (
                      <Text style={{ fontSize: 14, color: '#475569', lineHeight: 22 }}>
                        Information about the developer or agent will be listed here. They specialize in high-quality commercial and residential properties.
                      </Text>
                    )}
                  </View>
                )}
                {activeTab === 'Documents' && (
                  <View style={{ marginBottom: 32, padding: 24, backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' }}>
                    <Ionicons name="document-text-outline" size={48} color="#CBD5E1" />
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#64748B', marginTop: 12 }}>No documents attached</Text>
                  </View>
                )}

              </View>
            </View>

            {/* Right Column (Sidebar) */}
            <View style={{ width: isDesktop ? 380 : '100%', paddingHorizontal: isDesktop ? 0 : 16 }}>
              
              {/* Pricing Card */}
              <View style={{ backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 24, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 }}>
                <Text style={{ fontSize: 14, color: '#64748B', fontWeight: '600', marginBottom: 4 }}>Estimated Price</Text>
                <Text style={{ fontSize: 32, fontWeight: '800', color: '#D4AF37', marginBottom: 20 }}>
                  ₹ {(fractionPrice || property.price_per_fraction || 0).toLocaleString('en-IN')}
                </Text>
                <TouchableOpacity 
                  style={{ backgroundColor: '#B48811', borderRadius: 8, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}
                  onPress={() => setShowInquiryModal(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="calendar-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Request Details</Text>
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Ionicons name="shield-checkmark-outline" size={14} color="#64748B" />
                  <Text style={{ fontSize: 12, color: '#64748B' }}>Your information is secure with RealShare</Text>
                </View>
              </View>

              {/* Payment Calculator Card */}
              <View style={{ backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 24, marginBottom: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                  <Ionicons name="calculator-outline" size={20} color="#1E293B" style={{ marginRight: 8 }} />
                  <Text style={{ fontSize: 18, fontWeight: '800', color: '#1E293B' }}>Payment Calculator</Text>
                </View>
                
                {(() => {
                  const initialPrice = fractionPrice;
                  const currentPriceText = calcPriceStr !== "" ? calcPriceStr : (initialPrice > 0 ? initialPrice.toString() : "0");
                  const priceNum = parseFloat(currentPriceText) || 0;
                  const downPctNum = parseFloat(calcDownPct) || 0;
                  const interestNum = parseFloat(calcInterest) || 0;
                  const yearsNum = parseFloat(calcYears) || 0;
                  
                  const down = Math.round(priceNum * (downPctNum / 100));
                  const loan = priceNum - down;
                  const r = (interestNum / 100) / 12;
                  const n = yearsNum * 12;
                  
                  let emi = 0;
                  if (loan > 0) {
                    if (r === 0) {
                      emi = n > 0 ? Math.round(loan / n) : 0;
                    } else if (n > 0) {
                      emi = Math.round(loan * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1));
                    }
                  }

                  return (
                    <>
                      <Text style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>Property Price (₹)</Text>
                      <TextInput 
                        style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, marginBottom: 16 }}
                        keyboardType="numeric"
                        value={currentPriceText}
                        onChangeText={setCalcPriceStr}
                      />
                      
                      <Text style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>Down Payment (%)</Text>
                      <TextInput 
                        style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, marginBottom: 16 }}
                        keyboardType="numeric"
                        value={calcDownPct}
                        onChangeText={setCalcDownPct}
                      />
                      
                      <Text style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>Loan Amount</Text>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#1E293B', marginBottom: 16 }}>₹ {loan.toLocaleString('en-IN')}</Text>

                      <Text style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>Interest Rate (%)</Text>
                      <TextInput 
                        style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, marginBottom: 16 }}
                        keyboardType="numeric"
                        value={calcInterest}
                        onChangeText={setCalcInterest}
                      />
                      
                      <Text style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>Loan Tenure (Years)</Text>
                      <TextInput 
                        style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, marginBottom: 20 }}
                        keyboardType="numeric"
                        value={calcYears}
                        onChangeText={setCalcYears}
                      />

                      <View style={{ backgroundColor: '#FEFCE8', borderRadius: 8, padding: 16 }}>
                        <Text style={{ fontSize: 12, color: '#854D0E', fontWeight: '600', marginBottom: 4 }}>Estimated Monthly EMI</Text>
                        <Text style={{ fontSize: 24, color: '#1E293B', fontWeight: '800' }}>₹ {emi.toLocaleString('en-IN')} <Text style={{ fontSize: 13, fontWeight: '500', color: '#B48811' }}>/ Month</Text></Text>
                      </View>
                    </>
                  );
                })()}
              </View>

              {/* Ownership Details */}
              <View style={{ backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Ionicons name="people-outline" size={20} color="#1E293B" style={{ marginRight: 8 }} />
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#1E293B' }}>Ownership Details</Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 4 }}>
                  {isOutright ? '100% Full Ownership Unit' : 'Fractional Ownership'}
                </Text>
                <Text style={{ fontSize: 13, color: '#64748B', lineHeight: 20 }}>
                  {isOutright 
                    ? 'This is a whole-property listing with dedicated title registration. No fractional subdivision.'
                    : `Invest in fractions. ${property.available_fractions ?? 100} fractions remaining in the pool.`}
                </Text>
              </View>

            </View>
          </View>
        </View>

        {isDesktop && <WebFooter />}
      </ScrollView>

      {/* Bottom Action Bar (Mobile Only) */}
      {!isDesktop && (
        <View style={styles.bottomBar}>
          {isSoldOut ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEE2E2', paddingVertical: 12, borderRadius: Radius.md }}>
              <Text style={{ ...Typography.headlineMedium, color: '#DC2626' }}>THIS PROPERTY IS SOLD OUT</Text>
            </View>
          ) : fractionPrice === 0 ? (
            <>
              <View style={styles.bottomBarText}>
                <Text style={styles.bottomLabel}>Pricing</Text>
                <Text style={styles.bottomPrice}>On Request</Text>
              </View>
              <GoldButton 
                title="Request Details"
                onPress={() => setShowInquiryModal(true)} 
                style={{ width: 160 }}
              />
            </>
          ) : (
            <>
              <View style={styles.bottomBarText}>
                <Text style={styles.bottomLabel}>
                  {isOutright ? 'Price' : 'Per Fraction'}
                </Text>
                <Text style={styles.bottomPrice}>
                  ₹{(fractionPrice || property.price_per_fraction || 0).toLocaleString('en-IN')}
                </Text>
              </View>
              <GoldButton 
                title={isOutright ? "Contact Builder" : "Invest Now"} 
                onPress={() => {
                  if (!auth.currentUser) {
                    router.push('/(auth)/sign-in' as any);
                    return;
                  }
                  isOutright ? setShowInquiryModal(true) : setShowPaymentModal(true);
                }} 
                style={{ width: 160 }}
              />
            </>
          )}
        </View>
      )}

      {/* Payment Modal */}
      <Modal visible={showPaymentModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirm Investment</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.summaryBox}>
              <Text style={styles.summaryTitle}>{property.title}</Text>
              {isOutright ? (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Ownership:</Text>
                  <Text style={styles.summaryValue}>100% (Whole Property)</Text>
                </View>
              ) : (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Fractions:</Text>
                  <Text style={styles.summaryValue}>{fractionsToBuy}</Text>
                </View>
              )}
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Value:</Text>
                <Text style={styles.summaryValue}>₹ {(fractionPrice * fractionsToBuy).toLocaleString('en-IN')}</Text>
              </View>
              <View style={[styles.summaryRow, { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Neutrals.gray200 }]}>
                <Text style={styles.summaryTotalLabel}>{isOutright ? 'Amount Payable:' : 'Booking Amount:'}</Text>
                <Text style={styles.summaryTotalValue}>₹ {(isOutright ? fractionPrice * fractionsToBuy : totalBookingAmt).toLocaleString('en-IN')}</Text>
              </View>
            </View>

            <GoldButton 
              title={`Pay ₹${totalBookingAmt.toLocaleString('en-IN')}`} 
              onPress={() => {
                setShowPaymentModal(false);
                handleInitiatePayment();
              }}
              isLoading={isProcessing}
              style={{ marginTop: 24 }}
            />
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal visible={investmentSuccess} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { alignItems: 'center', paddingVertical: 40 }]}>
            <Text style={{ fontSize: 60, marginBottom: 16 }}>🎉</Text>
            <Text style={styles.successTitle}>Investment Successful!</Text>
            <Text style={styles.successSubtitle}>Welcome to RealShare Premium.</Text>
            <View style={styles.certBox}>
              <Text style={styles.certLabel}>Certificate ID</Text>
              <Text style={styles.certValue}>{certificateId}</Text>
            </View>
            <GoldButton 
              title="View Portfolio"
              onPress={() => {
                setInvestmentSuccess(false);
                router.replace('/portfolio' as any);
              }}
              style={{ width: '100%', marginTop: 24 }}
            />
          </View>
        </View>
      </Modal>

      {/* Gallery Modal */}
      <Modal visible={showGallery} animationType="fade" transparent={false}>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 24, paddingTop: Platform.OS === 'ios' ? 60 : 24 }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>{galleryIndex + 1} / {property.images?.length || 1}</Text>
            <TouchableOpacity onPress={() => setShowGallery(false)} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 22 }}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            horizontal 
            pagingEnabled 
            showsHorizontalScrollIndicator={false}
            contentOffset={{ x: galleryIndex * width, y: 0 }}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width);
              setGalleryIndex(index);
            }}
            style={{ flex: 1 }}
          >
            {property.images?.map((img: any, idx: number) => (
              <View key={idx} style={{ width, flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Image source={{ uri: img.image_url }} style={{ width: '100%', height: '80%' }} contentFit="contain" />
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>

      <PropertyInquiryModal 
        visible={showInquiryModal} 
        onClose={() => setShowInquiryModal(false)} 
        propertyTitle={property.title} 
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Neutrals.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Neutrals.background,
  },
  imageGallery: {
    width: '100%',
    height: 400,
    position: 'relative',
  },
  heroImage: {
    width: 400, // Should be Dimensions.get('window').width ideally
    height: 400,
  },
  heroImagePlaceholder: {
    width: 400,
    height: 400,
    backgroundColor: Neutrals.gray200,
  },
  backBtn: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topRightBtns: {
    position: 'absolute',
    top: 50,
    right: 20,
    flexDirection: 'row',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  iconBtnText: {
    fontSize: 20,
    color: Neutrals.obsidian,
  },
  imageCounter: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  imageCounterText: {
    ...Typography.caption,
    color: Neutrals.white,
  },
  content: {
    padding: 20,
    marginTop: -20,
    backgroundColor: Neutrals.background,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  typeBadge: {
    backgroundColor: Neutrals.surface,
    borderWidth: 1,
    borderColor: Neutrals.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  typeText: {
    ...Typography.caption,
    color: Neutrals.obsidian,
    textTransform: 'uppercase',
  },
  title: {
    ...Typography.displayMedium,
    color: Neutrals.obsidian,
    marginBottom: 8,
  },
  location: {
    ...Typography.bodyLarge,
    color: Neutrals.textSecondary,
    marginBottom: 24,
  },
  priceCard: {
    backgroundColor: Neutrals.surface,
    borderRadius: Radius.lg,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Shadows.medium,
    marginBottom: 24,
  },
  priceLabel: {
    ...Typography.caption,
    color: Neutrals.gray500,
    marginBottom: 4,
  },
  priceValue: {
    ...Typography.displayLarge,
    color: GoldSystem.primaryGold,
  },
  scoreContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  askQuestionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: GoldSystem.primaryGold,
    borderRadius: Radius.md,
    paddingVertical: 12,
    marginBottom: 24,
  },
  askQuestionIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  askQuestionText: {
    ...Typography.labelLarge,
    color: GoldSystem.darkGold,
  },
  highlightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  highlightBox: {
    width: '48%',
    backgroundColor: Neutrals.surface,
    padding: 16,
    borderRadius: Radius.md,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: GoldSystem.paleGold,
  },
  highlightLabel: {
    ...Typography.caption,
    color: Neutrals.gray500,
    marginBottom: 4,
  },
  highlightValue: {
    ...Typography.labelLarge,
    color: Neutrals.obsidian,
  },
  sectionTitle: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
    marginBottom: 12,
  },
  description: {
    ...Typography.bodyLarge,
    color: Neutrals.textSecondary,
    lineHeight: 24,
    marginBottom: 24,
  },
  mapContainer: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadows.soft,
    marginBottom: 24,
  },
  sharesCard: {
    backgroundColor: Neutrals.surface,
    padding: 16,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Neutrals.border,
    marginBottom: 24,
  },
  sharesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  shareMetric: {
    alignItems: 'center',
  },
  shareValue: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
  },
  shareLabel: {
    ...Typography.caption,
    color: Neutrals.gray500,
  },
  progressBarBg: {
    height: 12,
    backgroundColor: Neutrals.gray200,
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: GoldSystem.primaryGold,
  },
  progressText: {
    ...Typography.caption,
    color: Neutrals.gray600,
    textAlign: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Neutrals.surface,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'web' ? 16 : 32, // Safe area for native
    ...Shadows.strong,
  },
  bottomBarText: {},
  bottomLabel: {
    ...Typography.caption,
    color: Neutrals.gray500,
  },
  bottomPrice: {
    ...Typography.headlineLarge,
    color: Neutrals.obsidian,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Neutrals.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    ...Typography.headlineLarge,
    color: Neutrals.obsidian,
  },
  closeIcon: {
    fontSize: 24,
    color: Neutrals.gray500,
  },
  summaryBox: {
    backgroundColor: Neutrals.background,
    padding: 16,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Neutrals.border,
  },
  summaryTitle: {
    ...Typography.labelLarge,
    color: Neutrals.obsidian,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    ...Typography.bodyMedium,
    color: Neutrals.gray500,
  },
  summaryValue: {
    ...Typography.labelMedium,
    color: Neutrals.obsidian,
  },
  summaryTotalLabel: {
    ...Typography.labelLarge,
    color: Neutrals.obsidian,
  },
  summaryTotalValue: {
    ...Typography.headlineMedium,
    color: GoldSystem.primaryGold,
  },
  successTitle: {
    ...Typography.displayMedium,
    color: Neutrals.obsidian,
    marginBottom: 8,
  },
  successSubtitle: {
    ...Typography.bodyLarge,
    color: Neutrals.gray500,
    marginBottom: 24,
  },
  certBox: {
    backgroundColor: GoldSystem.paleGold,
    padding: 16,
    borderRadius: Radius.md,
    alignItems: 'center',
    width: '100%',
  },
  certLabel: {
    ...Typography.caption,
    color: GoldSystem.darkGold,
    marginBottom: 4,
  },
  certValue: {
    ...Typography.labelLarge,
    color: Neutrals.obsidian,
    letterSpacing: 2,
  },
});
