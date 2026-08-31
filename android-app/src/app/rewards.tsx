import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';
import { GoldButton } from '@/components/ui/GoldButton';
import { LinearGradient } from 'expo-linear-gradient';

export default function RewardsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rewards & Referrals</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Points Card */}
        <LinearGradient colors={GoldSystem.goldGradient} style={styles.pointsCard}>
          <Text style={styles.pointsLabel}>Available Points</Text>
          <View style={styles.pointsRow}>
            <Text style={styles.pointsValue}>12,500</Text>
            <Text style={styles.pointsIcon}>✨</Text>
          </View>
          <Text style={styles.pointsDesc}>Equals ₹12,500 off brokerage</Text>
        </LinearGradient>

        {/* Refer Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Refer & Earn</Text>
          <View style={styles.referCard}>
            <Text style={styles.referOffer}>Earn 5,000 Points</Text>
            <Text style={styles.referDesc}>For every friend who successfully buys or sells a property through RealShare.</Text>
            <View style={styles.codeContainer}>
              <Text style={styles.codeText}>RS-GOLD-482</Text>
              <TouchableOpacity style={styles.copyBtn}>
                <Text style={styles.copyBtnText}>Copy</Text>
              </TouchableOpacity>
            </View>
            <GoldButton title="Share via WhatsApp" onPress={() => alert('Sharing...')} style={{ marginTop: 16 }} />
          </View>
        </View>

        {/* Redeem Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Redeem Rewards</Text>
          
          <View style={styles.rewardCard}>
            <View style={styles.rewardIconContainer}>
              <Text style={styles.rewardIcon}>🏷️</Text>
            </View>
            <View style={styles.rewardInfo}>
              <Text style={styles.rewardTitle}>Zero Brokerage Pass</Text>
              <Text style={styles.rewardPoints}>10,000 Points</Text>
            </View>
            <TouchableOpacity style={styles.redeemBtn}>
              <Text style={styles.redeemBtnText}>Redeem</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.rewardCard}>
            <View style={styles.rewardIconContainer}>
              <Text style={styles.rewardIcon}>📸</Text>
            </View>
            <View style={styles.rewardInfo}>
              <Text style={styles.rewardTitle}>Pro Photoshoot for Listing</Text>
              <Text style={styles.rewardPoints}>2,500 Points</Text>
            </View>
            <TouchableOpacity style={styles.redeemBtn}>
              <Text style={styles.redeemBtnText}>Redeem</Text>
            </TouchableOpacity>
          </View>

        </View>

      </ScrollView>
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
    paddingTop: 50,
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
  pointsIcon: {
    fontSize: 32,
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
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Neutrals.surface,
    padding: 16,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Neutrals.border,
    marginBottom: 12,
    ...Shadows.soft,
  },
  rewardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: GoldSystem.paleGold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  rewardIcon: {
    fontSize: 24,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardTitle: {
    ...Typography.labelLarge,
    color: Neutrals.obsidian,
    marginBottom: 4,
  },
  rewardPoints: {
    ...Typography.caption,
    color: GoldSystem.primaryGold,
    fontWeight: '700',
  },
  redeemBtn: {
    backgroundColor: Neutrals.obsidian,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
  },
  redeemBtnText: {
    ...Typography.labelMedium,
    color: Neutrals.surface,
  },
});
