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

export default function PropertyDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { profile } = useUser();

  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com'}/api/properties/${id}`)
      .then(res => res.json())
      .then(data => {
        setProperty(data);
        setLoading(false);
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
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: GoldSystem.primaryGold }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const fractionPrice = Number(property.price_per_fraction) || 500000;
  const bookingAmtPerFrac = Number(property.booking_amount) || 25000;
  const isOutright = property.listing_type === 'outright';
  const totalBookingAmt = isOutright ? fractionsToBuy * fractionPrice : fractionsToBuy * bookingAmtPerFrac;

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
      const orderResponse = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com'}/api/transactions/create-order`, {
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
          key: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_TSKXy2WO8gcwyH', 
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'RealShare',
          description: `Booking for ${property.title}`,
          order_id: orderData.orderId,
          handler: async function (response: any) {
            // 4. Verify Payment on Backend
            const verifyRes = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com'}/api/transactions/verify-payment`, {
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
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
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
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>{property.property_type}</Text>
            </View>
          </View>

          <Text style={styles.title}>{property.title}</Text>
          <Text style={styles.location}>📍 {property.locality || property.district}, {property.state}</Text>

          <View style={styles.priceCard}>
            <View>
              <Text style={styles.priceLabel}>Price / Min. Investment</Text>
              <Text style={styles.priceValue}>₹ {fractionPrice.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.scoreContainer}>
              <InvestmentScore score={92} size={50} showLabel={false} strokeWidth={4} />
            </View>
          </View>

          <View style={styles.highlightsGrid}>
            <View style={styles.highlightBox}>
              <Text style={styles.highlightLabel}>Expected ROI</Text>
              <Text style={styles.highlightValue}>{property.assured_yield}%</Text>
            </View>
            <View style={styles.highlightBox}>
              <Text style={styles.highlightLabel}>Total Area</Text>
              <Text style={styles.highlightValue}>{property.total_area} sqft</Text>
            </View>
            <View style={styles.highlightBox}>
              <Text style={styles.highlightLabel}>Status</Text>
              <Text style={styles.highlightValue}>{property.status || 'Ready'}</Text>
            </View>
            <View style={styles.highlightBox}>
              <Text style={styles.highlightLabel}>RERA</Text>
              <Text style={styles.highlightValue}>{property.rera_number ? 'Verified' : 'N/A'}</Text>
            </View>
          </View>

          {/* Graphical Shares Representation */}
          <Text style={styles.sectionTitle}>Investment Availability</Text>
          <View style={styles.sharesCard}>
            <View style={styles.sharesRow}>
              <View style={styles.shareMetric}>
                <Text style={styles.shareValue}>100</Text>
                <Text style={styles.shareLabel}>Total Shares</Text>
              </View>
              <View style={styles.shareMetric}>
                <Text style={[styles.shareValue, { color: '#059669' }]}>65</Text>
                <Text style={styles.shareLabel}>Sold Shares</Text>
              </View>
              <View style={styles.shareMetric}>
                <Text style={[styles.shareValue, { color: GoldSystem.primaryGold }]}>35</Text>
                <Text style={styles.shareLabel}>Available</Text>
              </View>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: '65%' }]} />
            </View>
            <Text style={styles.progressText}>65% Funded. Closing soon.</Text>
          </View>

          <Text style={styles.sectionTitle}>About Property</Text>
          <Text style={styles.description}>{property.description || 'Premium property with excellent investment potential and high rental yields. Located in a prime area with seamless connectivity.'}</Text>

          {/* Map View */}
          <Text style={styles.sectionTitle}>Location Details</Text>
          {property.lat && property.lng ? (
            <View style={[styles.mapContainer, { height: 200 }]}>
              {Platform.OS === 'web' ? (
                <div style={{ width: '100%', height: '100%' }}
                  dangerouslySetInnerHTML={{ __html: 
                    `<iframe width="100%" height="100%" frameborder="0" style="border:0;" loading="lazy" allowfullscreen src="https://maps.google.com/maps?q=${parseFloat(property.lat)},${parseFloat(property.lng)}&z=15&output=embed"></iframe>`
                  }}
                />
              ) : (
                <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: Neutrals.gray200 }}>
                  <Text style={{ color: Neutrals.gray500 }}>Map view available on web</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={[styles.mapContainer, { height: 100, justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ color: Neutrals.gray500 }}>Location not available</Text>
            </View>
          )}

        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarText}>
          <Text style={styles.bottomLabel}>{isOutright ? 'Full Property Price' : 'Booking Amount'}</Text>
          <Text style={styles.bottomPrice}>₹ {(isOutright ? fractionPrice : bookingAmtPerFrac).toLocaleString('en-IN')}</Text>
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
