import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, ActivityIndicator, TextInput, Animated, Easing, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GoldSystem, Neutrals, Typography } from '@/constants/design';
import { getApiUrl } from '@/lib/api';

interface Plan {
  id: string;
  role_type: string;
  tier: string;
  price: string;
  postings_limit: number;
  post_listing_days: number;
  support_level: string;
  post_assistance: string;
  referral_program: boolean;
  renewal: boolean;
  validity_days: number;
  tagline: string;
  features: any;
}

interface PlanSelectorProps {
  role: 'agent' | 'builder';
  onSelectPlan: (planId: string, couponCode: string | null) => void;
  currentPlanId?: string;
  isUpgrade?: boolean;
}

export default function PlanSelector({ role, onSelectPlan, currentPlanId, isUpgrade = false }: PlanSelectorProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');
  
  // To handle the shine animation
  const [shineAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    fetchPlans();
    
    // Shine animation loop for recommended plan
    Animated.loop(
      Animated.sequence([
        Animated.timing(shineAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: Platform.OS !== 'web', // Web doesn't support all native driver features for background positions, but we'll adapt
        }),
        Animated.delay(3000)
      ])
    ).start();
  }, [role]);

  const fetchPlans = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/plans?role=${role}`);
      if (res.ok) {
        const data = await res.json();
        if (data.enabled && data.plans) {
           setPlans(data.plans);
        }
      }
    } catch (e) {
      console.error('Failed to load plans:', e);
    } finally {
      setLoading(false);
    }
  };

  const validateCoupon = async (planId: string) => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code.');
      return;
    }
    
    setValidatingCoupon(true);
    setCouponError('');
    setAppliedCoupon(null);

    // In signup flow, we might not have auth token yet to validate coupon via protected API
    // If it's signup (no auth), we just pass the coupon code to the signup payload and validate there
    // But since PlanSelector allows applying it visually, we need a public or semi-public way to validate.
    // For now, if we are in signup, we might rely on the backend validation during the actual subscribe call.
    // However, to show the discount *before* payment, we'd need an endpoint.
    // Assuming /api/plans/validate-coupon requires auth, we might just pass the code if not logged in.
    // Let's try calling it. If it fails due to 401, we just set the code and let backend handle it during checkout.
    
    try {
      const authHeaderStr = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null; // simplified for web
      // In a real app we'd use getAuthHeader, but this might be in signup where no token exists.
      
      const res = await fetch(`${getApiUrl()}/api/plans/validate-coupon`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': authHeader // Only if available
        },
        body: JSON.stringify({ code: couponCode, planId })
      });
      
      if (res.status === 401) {
         // Not logged in. We'll just trust it for now and pass to checkout.
         setAppliedCoupon({ code: couponCode, valid_but_unverified: true, planId });
         setCouponError('Coupon will be applied at checkout.');
      } else {
        const data = await res.json();
        if (data.valid && data.planId === planId) { // Check if it applies to this specific plan if we want to bind it visually to one plan
           setAppliedCoupon(data);
        } else {
           setCouponError(data.error || 'Invalid coupon');
        }
      }
    } catch (e) {
      setCouponError('Failed to validate coupon.');
    } finally {
      setValidatingCoupon(false);
    }
  };

  if (loading) {
    return (
      <View style={{ padding: 40, alignItems: 'center' }}>
        <ActivityIndicator size="large" color={GoldSystem.primaryGold} />
      </View>
    );
  }

  if (plans.length === 0) {
    return null; // Plans disabled or none found
  }

  const getTierColors = (tier: string) => {
    switch (tier.toUpperCase()) {
      case 'GOLD': return { bg: ['#D4AF37', '#F3E5AB'], text: '#92400E', border: '#D4AF37' };
      case 'PLATINUM': return { bg: ['#E2E8F0', '#FFFFFF'], text: '#475569', border: '#CBD5E1' };
      case 'TITANIUM': return { bg: ['#1E293B', '#334155'], text: '#F8FAFC', border: '#475569' };
      default: return { bg: ['#F8FAFC', '#F1F5F9'], text: '#64748B', border: '#E2E8F0' }; // REGULAR
    }
  };

  const isDesktopWeb = Platform.OS === 'web' && (typeof window !== 'undefined' ? window.innerWidth >= 768 : false);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isUpgrade ? 'Upgrade Your Plan' : 'Select a Plan'}</Text>
      <Text style={styles.subtitle}>Choose the plan that best fits your {role} needs.</Text>

      <ScrollView 
        horizontal={!isDesktopWeb} 
        showsHorizontalScrollIndicator={!isDesktopWeb}
        contentContainerStyle={isDesktopWeb ? styles.desktopGrid : styles.mobileScroll}
        style={{ marginHorizontal: -20, paddingHorizontal: 20 }}
      >
        {plans.map((plan, index) => {
          const colors = getTierColors(plan.tier);
          const isCurrent = currentPlanId === plan.id;
          const isRecommended = plan.tier === 'PLATINUM'; // Example
          
          return (
            <View key={plan.id} style={[styles.card, { borderColor: colors.border, width: isDesktopWeb ? 300 : 280, backgroundColor: colors.bg[0] }]}>
              {isRecommended && (
                 <View style={styles.recommendedBadge}>
                   <Text style={styles.recommendedText}>Most Popular</Text>
                 </View>
              )}
              
              <Text style={[styles.tierName, { color: colors.text }]}>{plan.tier}</Text>
              <Text style={styles.tagline}>{plan.tagline}</Text>
              
              <View style={styles.priceContainer}>
                <Text style={[styles.price, { color: colors.text }]}>₹{plan.price}</Text>
                <Text style={styles.validity}> / {plan.validity_days} days</Text>
              </View>

              <View style={styles.features}>
                <FeatureItem text={`${plan.postings_limit} Property Postings`} active={true} colors={colors} />
                <FeatureItem text={`Listings active for ${plan.post_listing_days} days`} active={true} colors={colors} />
                <FeatureItem text={`${plan.support_level} Support`} active={true} colors={colors} />
                <FeatureItem text={`Post Assistance: ${plan.post_assistance}`} active={plan.post_assistance !== 'No'} colors={colors} />
                {plan.referral_program && <FeatureItem text={`Referral Program`} active={true} colors={colors} />}
                
                {plan.features && Object.keys(plan.features).map(f => (
                  <FeatureItem key={f} text={`${f}: ${plan.features[f]}`} active={true} colors={colors} />
                ))}
              </View>

              {isCurrent ? (
                <View style={styles.currentBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.currentText}>Current Plan</Text>
                </View>
              ) : (
                <TouchableOpacity 
                  style={[styles.selectBtn, { backgroundColor: colors.text }]}
                  onPress={() => onSelectPlan(plan.id, appliedCoupon?.code || null)}
                >
                  <Text style={{ color: colors.bg[0], fontWeight: '700', textAlign: 'center' }}>
                    {Number(plan.price) === 0 ? 'Start for Free' : 'Select Plan'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Coupon Section (Optional, shown below plans or in a modal during checkout) */}
      {!isUpgrade && plans.some(p => Number(p.price) > 0) && (
        <View style={styles.couponSection}>
           <Text style={styles.couponTitle}>Have a discount coupon?</Text>
           <View style={styles.couponInputRow}>
             <TextInput 
               style={styles.couponInput} 
               placeholder="Enter Code" 
               placeholderTextColor="#94A3B8"
               value={couponCode}
               onChangeText={setCouponCode}
               autoCapitalize="characters"
             />
             <TouchableOpacity style={styles.couponBtn} onPress={() => validateCoupon(plans[1]?.id)} disabled={validatingCoupon}>
               {validatingCoupon ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.couponBtnText}>Apply</Text>}
             </TouchableOpacity>
           </View>
           {couponError ? <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{couponError}</Text> : null}
           {appliedCoupon && appliedCoupon.valid_but_unverified && (
             <Text style={{ color: '#10B981', fontSize: 12, marginTop: 4 }}>Coupon attached. Discount applied at checkout.</Text>
           )}
        </View>
      )}
    </View>
  );
}

const FeatureItem = ({ text, active, colors }: { text: string, active: boolean, colors: any }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 }}>
    <Ionicons name={active ? "checkmark-circle" : "close-circle"} size={16} color={active ? colors.text : '#94A3B8'} opacity={active ? 1 : 0.5} />
    <Text style={{ fontSize: 13, color: active ? colors.text : '#94A3B8', fontWeight: active ? '500' : '400' }}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  title: {
    ...Typography.titleLarge,
    color: Neutrals.obsidian,
    marginBottom: 4,
  },
  subtitle: {
    ...Typography.bodyMedium,
    color: Neutrals.gray500,
    marginBottom: 20,
  },
  desktopGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 20,
    paddingBottom: 20,
  },
  mobileScroll: {
    flexDirection: 'row',
    gap: 16,
    paddingRight: 40, // extra padding at end
    paddingBottom: 20,
  },
  card: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  recommendedBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomLeftRadius: 12,
  },
  recommendedText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  tierName: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 12,
    color: Neutrals.gray500,
    marginBottom: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  price: {
    fontSize: 32,
    fontWeight: '800',
  },
  validity: {
    fontSize: 14,
    opacity: 0.7,
  },
  features: {
    marginBottom: 24,
    flex: 1,
  },
  selectBtn: {
    padding: 14,
    borderRadius: 12,
  },
  currentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 14,
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
  },
  currentText: {
    color: '#065F46',
    fontWeight: '700',
  },
  couponSection: {
    marginTop: 24,
    padding: 16,
    backgroundColor: Neutrals.gray50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Neutrals.gray200,
  },
  couponTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Neutrals.gray700,
    marginBottom: 8,
  },
  couponInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  couponInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: Neutrals.gray300,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    fontSize: 14,
  },
  couponBtn: {
    backgroundColor: Neutrals.obsidian,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  couponBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  }
});
