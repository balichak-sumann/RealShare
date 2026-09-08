import React, { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { auth } from '@/lib/firebase';
import { useUser } from '@/contexts/UserContext';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';
import { GoldButton } from '@/components/ui/GoldButton';
import { InvestmentScore } from '@/components/ui/InvestmentScore';
import { TrustBadge } from '@/components/ui/TrustBadge';
import { PropertyInquiryModal } from '@/components/ui/PropertyInquiryModal';
import { useActivityHistory } from '@/hooks/useActivityHistory';
import { getApiUrl } from '@/lib/api';

export default function PropertyDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { profile } = useUser();
  const { addView } = useActivityHistory();

  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${getApiUrl()}/api/properties/${id}`)
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

  const fractionPrice = Number(property.price_per_fraction) || 0;
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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Full Screen Image Gallery */}
        <View style={styles.imageGallery}>
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width);
            setCurrentImageIndex(index);
          }}>
            {property.images && property.images.length > 0 ? (
              property.images.map((img: any, idx: number) => (
                <Image key={idx} source={{ uri: img.image_url }} style={styles.heroImage} />
              ))
            ) : (
              <View style={styles.heroImagePlaceholder} />
            )}
          </ScrollView>
          <TouchableOpacity style={styles.backBtn} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}>
            <Text style={styles.iconBtnText}>←</Text>
          </TouchableOpacity>
          <View style={styles.topRightBtns}>
            <TouchableOpacity style={styles.iconBtn}><Text style={styles.iconBtnText}>🔗</Text></TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn}><Text style={styles.iconBtnText}>♡</Text></TouchableOpacity>
          </View>
          <View style={styles.imageCounter}>
            <Text style={styles.imageCounterText}>{currentImageIndex + 1}/{property.images?.length || 1}</Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.badgeRow}>
            <TrustBadge type="verified" />
            <View style={[styles.typeBadge, { backgroundColor: isOutright ? '#F3E8FF' : '#EFF6FF' }]}>
              <Text style={[styles.typeText, { color: isOutright ? '#7E22CE' : '#1D4ED8' }]}>
                {isOutright ? 'BUY / OUTRIGHT' : 'INVEST / FRACTIONAL'}
              </Text>
            </View>
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>{property.property_type}</Text>
            </View>
          </View>

          <Text style={styles.title}>{property.title}</Text>
          <Text style={styles.location}>📍 {property.locality || property.district}, {property.state}</Text>
          {property.full_address ? (
            <Text style={{ fontSize: 13, color: Neutrals.gray500, marginTop: 4, marginBottom: 8 }}>
              {property.full_address}
            </Text>
          ) : null}

          <View style={styles.priceCard}>
            <View>
              {fractionPrice !== 0 && (
                <>
                  <Text style={styles.priceLabel}>{isOutright ? 'Asking Price' : 'Price / Min. Investment'}</Text>
                  <Text style={styles.priceValue}>
                    ₹ {fractionPrice.toLocaleString('en-IN')}
                    {!isOutright && <Text style={{ fontSize: 13, fontWeight: '400', color: Neutrals.gray500 }}> / fraction</Text>}
                  </Text>
                </>
              )}
            </View>
            <View style={styles.scoreContainer}>
              <InvestmentScore score={92} size={50} showLabel={false} strokeWidth={4} />
            </View>
          </View>

          {canAskQuestion && (
            <TouchableOpacity
              style={[styles.askQuestionBtn, askingQuestion && { opacity: 0.6 }]}
              onPress={handleAskQuestion}
              disabled={askingQuestion}
            >
              {askingQuestion ? (
                <ActivityIndicator size="small" color={GoldSystem.primaryGold} />
              ) : (
                <>
                  <Text style={styles.askQuestionIcon}>💬</Text>
                  <Text style={styles.askQuestionText}>Ask a question about this property</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <View style={styles.highlightsGrid}>
            <View style={styles.highlightBox}>
              <Text style={styles.highlightLabel}>Expected ROI</Text>
              <Text style={styles.highlightValue}>{property.assured_yield ? `${property.assured_yield}%` : '8.5%'}</Text>
            </View>
            <View style={styles.highlightBox}>
              <Text style={styles.highlightLabel}>Built-up Area</Text>
              <Text style={styles.highlightValue}>
                {property.area_sqft ? `${Number(property.area_sqft).toLocaleString('en-IN')} sqft` : property.total_area ? `${property.total_area} sqft` : '—'}
              </Text>
            </View>
            <View style={styles.highlightBox}>
              <Text style={styles.highlightLabel}>Target IRR</Text>
              <Text style={styles.highlightValue}>{property.target_irr ? `${property.target_irr}%` : '15.0%'}</Text>
            </View>
            <View style={styles.highlightBox}>
              <Text style={styles.highlightLabel}>Listing Mode</Text>
              <Text style={styles.highlightValue}>{isOutright ? 'Whole Unit' : 'Fractional'}</Text>
            </View>
          </View>

          {/* Graphical Shares Representation */}
          <Text style={styles.sectionTitle}>
            {isOutright ? 'Ownership Details' : 'Investment Share Pool Availability'}
          </Text>
          {!isOutright ? (
            <View style={styles.sharesCard}>
              <View style={styles.sharesRow}>
                <View style={styles.shareMetric}>
                  <Text style={styles.shareValue}>{property.total_fractions || 100}</Text>
                  <Text style={styles.shareLabel}>Total Shares</Text>
                </View>
                <View style={styles.shareMetric}>
                  <Text style={[styles.shareValue, { color: '#059669' }]}>{property.sold_fractions || 0}</Text>
                  <Text style={styles.shareLabel}>Sold Shares</Text>
                </View>
                <View style={styles.shareMetric}>
                  <Text style={[styles.shareValue, { color: GoldSystem.primaryGold }]}>
                    {property.available_fractions ?? ((property.total_fractions || 100) - (property.sold_fractions || 0))}
                  </Text>
                  <Text style={styles.shareLabel}>Available</Text>
                </View>
              </View>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${property.percentage_sold !== undefined ? property.percentage_sold : Math.min(100, Math.max(0, Math.round(((property.sold_fractions || 0) / (property.total_fractions || 100)) * 100)))}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {property.percentage_sold !== undefined ? property.percentage_sold : Math.min(100, Math.max(0, Math.round(((property.sold_fractions || 0) / (property.total_fractions || 100)) * 100)))}% Funded • {property.available_fractions ?? ((property.total_fractions || 100) - (property.sold_fractions || 0))} fractions remaining
              </Text>
            </View>
          ) : (
            <View style={[styles.sharesCard, { padding: 16 }]}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: Neutrals.obsidian, marginBottom: 4 }}>
                100% Full Ownership Unit
              </Text>
              <Text style={{ fontSize: 13, color: Neutrals.gray600, lineHeight: 18 }}>
                This is a whole-property listing with dedicated title registration. No fractional subdivision.
              </Text>
            </View>
          )}

          <Text style={styles.sectionTitle}>About Property</Text>
          <Text style={styles.description}>
            {property.description || 'Premium property with excellent investment potential and high capital growth prospects. Located in a prime area with seamless connectivity.'}
          </Text>

          {/* Map View */}
          <Text style={styles.sectionTitle}>Location Details</Text>
          {property.lat && property.lng ? (
            <View>
              <View style={[styles.mapContainer, { height: 200, borderRadius: 12, overflow: 'hidden' }]}>
                {Platform.OS === 'web' ? (
                  <div
                    style={{ width: '100%', height: '100%' }}
                    dangerouslySetInnerHTML={{
                      __html: `<iframe width="100%" height="100%" frameborder="0" style="border:0;" loading="lazy" allowfullscreen src="https://maps.google.com/maps?q=${parseFloat(property.lat)},${parseFloat(property.lng)}&z=15&output=embed"></iframe>`,
                    }}
                  />
                ) : (
                  <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: Neutrals.gray200 }}>
                    <Text style={{ color: Neutrals.gray600, fontWeight: '600' }}>📍 {property.locality || property.district}</Text>
                    <Text style={{ color: Neutrals.gray500, fontSize: 12, marginTop: 4 }}>Lat: {Number(property.lat).toFixed(4)}, Lng: {Number(property.lng).toFixed(4)}</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                onPress={() => {
                  const url = property.google_maps_url || `https://www.google.com/maps/search/?api=1&query=${property.lat},${property.lng}`;
                  if (Platform.OS === 'web') {
                    window.open(url, '_blank');
                  } else {
                    const Linking = require('react-native').Linking;
                    Linking.openURL(url);
                  }
                }}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10, paddingVertical: 8, borderRadius: 8, backgroundColor: '#EFF6FF' }}
              >
                <Text style={{ color: '#2563EB', fontWeight: '700', fontSize: 13 }}>Open in Google Maps ↗</Text>
              </TouchableOpacity>
            </View>
          ) : property.google_maps_url ? (
            <TouchableOpacity
              onPress={() => {
                if (Platform.OS === 'web') {
                  window.open(property.google_maps_url, '_blank');
                } else {
                  const Linking = require('react-native').Linking;
                  Linking.openURL(property.google_maps_url);
                }
              }}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 8, backgroundColor: '#EFF6FF' }}
            >
              <Text style={{ color: '#2563EB', fontWeight: '700', fontSize: 14 }}>📍 View Location on Google Maps ↗</Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.mapContainer, { height: 80, justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ color: Neutrals.gray500 }}>Location map coordinates not provided</Text>
            </View>
          )}

        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
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
              <Text style={styles.bottomLabel}>{isOutright ? 'Full Property Price' : 'Booking Amount'}</Text>
              <Text style={styles.bottomPrice}>
                ₹ {(isOutright ? fractionPrice : bookingAmtPerFrac).toLocaleString('en-IN')}
              </Text>
            </View>
            <GoldButton 
              title={isOutright ? 'Buy Now' : 'Invest Now'} 
              onPress={() => {
                if (!auth.currentUser) {
                  router.push('/(auth)/sign-in');
                  return;
                }
                setShowPaymentModal(true);
              }} 
              style={{ width: 160 }}
            />
          </>
        )}
      </View>

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
    paddingBottom: 32, // Safe area
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
