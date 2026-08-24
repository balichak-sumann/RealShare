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
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { auth } from '@/lib/firebase';

export default function PropertyDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:3000/api/properties/${id}`)
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

  const [fractionsToBuy, setFractionsToBuy] = useState(1);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking' | 'wallet'>('upi');
  const [upiId, setUpiId] = useState('user@okhdfcbank');
  const [isProcessing, setIsProcessing] = useState(false);
  const [investmentSuccess, setInvestmentSuccess] = useState(false);
  const [certificateId, setCertificateId] = useState('');

  if (loading) {
    return (
      <View style={styles.errorContainer}>
        <ActivityIndicator size="large" color="#1A56DB" />
      </View>
    );
  }

  if (!property) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Property not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const fractionPrice = Number(property.price_per_fraction) || 500000;
  const bookingAmtPerFrac = Number(property.booking_amount) || 25000;
  const totalBookingAmt = fractionsToBuy * bookingAmtPerFrac;

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
      // 1. Get Firebase Token
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        alert('Please login first');
        setIsProcessing(false);
        return;
      }

      // 2. Create Order on Backend
      const orderResponse = await fetch('http://localhost:3000/api/transactions/create-order', {
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
            const verifyRes = await fetch('http://localhost:3000/api/transactions/verify-payment', {
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
            color: '#1A56DB'
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

  const handleInvestNowClick = async () => {
    setIsProcessing(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        alert("Please login first");
        setIsProcessing(false);
        return;
      }
      
      const res = await fetch('http://localhost:3000/api/users/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.kyc_status !== 'verified') {
        alert("Please complete your KYC to invest.");
        router.push('/(protected)/kyc');
      } else {
        setShowPaymentModal(true);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to verify KYC status");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header - Mockup style */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={() => router.back()}>
          <Text style={styles.headerIconText}>&lt;</Text>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Property Details</Text>

        <TouchableOpacity style={styles.headerIconBtn}>
          <Text style={styles.headerIconText}>🔗</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header Image Gallery */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: property.images?.[0]?.image_url || 'https://via.placeholder.com/300' }} style={styles.image} />
        </View>

        {/* Property Overview */}
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{property.title}</Text>
            <TouchableOpacity><Text style={{fontSize: 20}}>♡</Text></TouchableOpacity>
          </View>
          
          <Text style={styles.location}>{property.locality || property.district}, {property.state}</Text>
          
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>NEW LAUNCH</Text>
            </View>
          </View>

          {/* Price & ROI */}
          <View style={styles.priceRow}>
            <View>
              <Text style={styles.priceValue}>₹ {Number(property.price_per_fraction).toLocaleString('en-IN')}</Text>
              <Text style={styles.priceLabel}>Min. Investment ₹ {Number(property.booking_amount).toLocaleString('en-IN')}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.roiValue}>{property.assured_yield}%</Text>
              <Text style={styles.roiLabel}>Expected ROI</Text>
            </View>
          </View>

          {/* Share Pool Allocation Bar */}
          <View style={styles.sharePoolCard}>
            <View style={styles.shareStatsRow}>
              <View>
                <Text style={styles.shareLabel}>Total Shares</Text>
                <Text style={styles.shareValue}>{property.total_fractions || 10000}</Text>
              </View>
              <View>
                <Text style={styles.shareLabel}>Available Shares</Text>
                <Text style={styles.shareValue}>{property.available_fractions || 4250}</Text>
              </View>
              <View>
                <Text style={styles.shareLabel}>Price per share</Text>
                <Text style={styles.shareValue}>₹ {Number(property.price_per_fraction).toLocaleString('en-IN')}</Text>
              </View>
            </View>
            
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${((property.sold_fractions || 1) / (property.total_fractions || 10)) * 100}%` },
                ]}
              />
            </View>
          </View>

          {/* Property Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About Property</Text>
            <Text style={styles.description}>{property.description}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Booking Bar */}
      <View style={styles.fabContainer}>
        <TouchableOpacity style={styles.investBtn} onPress={handleInvestNowClick}>
          {isProcessing ? <ActivityIndicator color="#fff" /> : <Text style={styles.investBtnText}>Invest Now</Text>}
        </TouchableOpacity>
      </View>

      {/* Modern Payment Gateway Modal */}
      <Modal visible={showPaymentModal} animationType="slide" transparent={true}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            {investmentSuccess ? (
              <View style={styles.successView}>
                <View style={styles.successIconBox}>
                  <Text style={styles.successIcon}>✓</Text>
                </View>
                <Text style={styles.successTitle}>Investment Successful!</Text>
                <Text style={styles.successText}>You now own {fractionsToBuy} fractions of {property.title}.</Text>
                
                <View style={styles.certificateBox}>
                  <Text style={styles.certTitle}>DIGITAL SHARE CERTIFICATE</Text>
                  <Text style={styles.certId}>{certificateId}</Text>
                  <Text style={styles.certProperty}>{property.title}</Text>
                </View>
                
                <TouchableOpacity style={styles.closeBtn} onPress={() => {
                  setShowPaymentModal(false);
                  router.push('/portfolio' as any);
                }}>
                  <Text style={styles.closeBtnText}>Go To My Investments</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Complete Investment</Text>
                  <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                    <Text style={styles.modalCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.paymentAmount}>₹{totalBookingAmt.toLocaleString('en-IN')}</Text>
                <Text style={styles.paymentSubtext}>Booking Token for {fractionsToBuy} Fraction(s)</Text>
                
                <Text style={styles.paymentSectionTitle}>Select Payment Method</Text>
                
                <View style={styles.paymentMethodsGrid}>
                  {['upi', 'card', 'netbanking', 'wallet'].map((method) => (
                    <TouchableOpacity
                      key={method}
                      style={[
                        styles.paymentMethodBtn,
                        paymentMethod === method && styles.paymentMethodActive,
                      ]}
                      onPress={() => setPaymentMethod(method as any)}
                    >
                      <Text style={[
                        styles.paymentMethodText,
                        paymentMethod === method && styles.paymentMethodTextActive
                      ]}>
                        {method.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                {paymentMethod === 'upi' && (
                  <View style={styles.upiInputBox}>
                    <Text style={styles.inputLabel}>Enter UPI ID</Text>
                    <TextInput 
                      style={styles.input}
                      value={upiId}
                      onChangeText={setUpiId}
                      placeholder="e.g. user@okicici"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                )}

                <TouchableOpacity 
                  style={[styles.payBtn, isProcessing && { opacity: 0.7 }]} 
                  onPress={handleInitiatePayment}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.payBtnText}>Pay ₹{totalBookingAmt.toLocaleString('en-IN')}</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerIconBtn: {
    padding: 5,
  },
  headerIconText: {
    fontSize: 20,
    color: '#111827',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  imageContainer: {
    width: '100%',
    backgroundColor: '#F3F4F6',
  },
  image: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  content: {
    padding: 20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    flex: 1,
  },
  location: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  badge: {
    backgroundColor: '#E1EFFE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  badgeText: {
    color: '#1A56DB',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  priceLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  roiValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#10B981',
  },
  roiLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  sharePoolCard: {
    marginBottom: 24,
  },
  shareStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  shareLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  shareValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  progressBarBg: {
    width: '100%',
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#1A56DB',
    borderRadius: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingBottom: 30, // for safe area
  },
  investBtn: {
    backgroundColor: '#1A56DB',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  investBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    fontSize: 18,
    color: '#111827',
    marginBottom: 16,
    fontWeight: '600',
  },
  backBtn: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#111827',
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
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
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modalCloseText: {
    fontSize: 20,
    color: '#6B7280',
  },
  paymentAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  paymentSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  paymentSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  paymentMethodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  paymentMethodBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  paymentMethodActive: {
    borderColor: '#1A56DB',
    backgroundColor: '#E1EFFE',
  },
  paymentMethodText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  paymentMethodTextActive: {
    color: '#1A56DB',
  },
  upiInputBox: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    borderRadius: 8,
    fontSize: 15,
    color: '#111827',
  },
  payBtn: {
    backgroundColor: '#1A56DB',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  payBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  successView: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successIcon: {
    fontSize: 32,
    color: '#10B981',
    fontWeight: '800',
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  successText: {
    fontSize: 15,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 32,
  },
  certificateBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
  },
  certTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 1,
    marginBottom: 8,
  },
  certId: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A56DB',
    marginBottom: 4,
  },
  certProperty: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  closeBtn: {
    backgroundColor: '#111827',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});
