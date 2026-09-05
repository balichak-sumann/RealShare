import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Share, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';
import { GoldButton } from '@/components/ui/GoldButton';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '@/contexts/UserContext';
import { auth } from '@/lib/firebase';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com';

function formatCurrency(n: number) {
  return `\u20b9${n.toLocaleString('en-IN')}`;
}

export default function RewardsScreen() {
  const router = useRouter();
  const { profile } = useUser();
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referredCount, setReferredCount] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalPending, setTotalPending] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        const token = await user.getIdToken();
        const res = await fetch(`${API_URL}/api/me/referral`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setReferralCode(data.referral_code);
          setReferredCount(data.referred_count || 0);
          setTotalEarned(data.total_earned || 0);
          setTotalPending(data.total_pending || 0);
        }
      } catch (e) {
        console.warn('Failed to load referral info', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleShare = async () => {
    if (!referralCode) return;
    try {
      await Share.share({
        message: `Join me on RealShare and start investing in fractional real estate! Use my referral code ${referralCode} when you sign up.`,
      });
    } catch (e) {
      // user cancelled or share failed silently
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>\u2190</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rewards & Referrals</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={GoldSystem.primaryGold} />
        </View>
      ) : (
        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>

          {/* Earnings Card */}
          <LinearGradient colors={GoldSystem.goldGradient} style={styles.pointsCard}>
            <Text style={styles.pointsLabel}>Total Referral Earnings</Text>
            <View style={styles.pointsRow}>
              <Text style={styles.pointsValue}>{formatCurrency(totalEarned)}</Text>
            </View>
            <Text style={styles.pointsDesc}>
              {totalPending > 0
                ? `${formatCurrency(totalPending)} pending clearance`
                : `${referredCount} ${referredCount === 1 ? 'person' : 'people'} referred`}
            </Text>
          </LinearGradient>

          {/* Refer Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Refer & Earn</Text>
            <View style={styles.referCard}>
              <Text style={styles.referOffer}>Earn commission on every investment</Text>
              <Text style={styles.referDesc}>
                Share your referral code. When someone signs up with it and invests, you earn a
                commission on their transaction.
              </Text>
              <View style={styles.codeContainer}>
                <Text style={styles.codeText}>{referralCode || '—'}</Text>
              </View>
              <GoldButton title="Share Referral Code" onPress={handleShare} style={{ marginTop: 16 }} />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Referred Users</Text>
            <View style={styles.referCard}>
              <Text style={styles.referDesc}>
                {referredCount > 0
                  ? `${referredCount} ${referredCount === 1 ? 'person has' : 'people have'} signed up using your referral code.`
                  : 'No one has signed up with your referral code yet. Share it to start earning.'}
              </Text>
            </View>
          </View>

        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Neutrals.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: Platform.OS === 'web' ? 18 : 50,
    backgroundColor: Neutrals.surface,
    borderBottomWidth: 1,
    borderBottomColor: Neutrals.border,
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  backIcon: {
    fontSize: 24,
    color: Neutrals.obsidian,
  },
  headerTitle: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointsCard: {
    padding: 24,
    borderRadius: Radius.lg,
    marginBottom: 32,
    alignItems: 'center',
    ...Shadows.strong,
  },
  pointsLabel: {
    ...Typography.labelMedium,
    color: Neutrals.obsidian,
    marginBottom: 8,
    opacity: 0.8,
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pointsValue: {
    ...Typography.displayLarge,
    color: Neutrals.obsidian,
    marginRight: 8,
  },
  pointsDesc: {
    ...Typography.bodyMedium,
    color: Neutrals.obsidian,
    opacity: 0.8,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
    marginBottom: 16,
  },
  referCard: {
    backgroundColor: Neutrals.surface,
    padding: 20,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Neutrals.border,
    ...Shadows.soft,
  },
  referOffer: {
    ...Typography.headlineMedium,
    color: GoldSystem.primaryGold,
    marginBottom: 8,
  },
  referDesc: {
    ...Typography.bodyMedium,
    color: Neutrals.gray600,
    marginBottom: 20,
  },
  codeContainer: {
    flexDirection: 'row',
    backgroundColor: Neutrals.gray100,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Neutrals.border,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  codeText: {
    ...Typography.labelLarge,
    color: Neutrals.obsidian,
    letterSpacing: 2,
  },
  copyBtn: {
    backgroundColor: Neutrals.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Neutrals.border,
  },
  copyBtnText: {
    ...Typography.caption,
    color: Neutrals.obsidian,
    fontWeight: '700',
  },
});
