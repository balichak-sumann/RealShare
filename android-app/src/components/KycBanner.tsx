import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

interface KycBannerProps {
  kycStatus: 'not_submitted' | 'pending' | 'verified' | 'rejected';
}

export default function KycBanner({ kycStatus }: KycBannerProps) {
  const router = useRouter();

  if (kycStatus === 'verified') return null;

  const config = {
    not_submitted: {
      bg: '#FEF3C7',
      border: '#F59E0B',
      icon: '⚠️',
      text: 'Complete your KYC to start investing',
      btnText: 'Complete KYC',
      btnBg: '#F59E0B',
    },
    pending: {
      bg: '#DBEAFE',
      border: '#2563EB',
      icon: '⏳',
      text: 'KYC verification in progress',
      btnText: 'View Status',
      btnBg: '#2563EB',
    },
    rejected: {
      bg: '#FEE2E2',
      border: '#DC2626',
      icon: '❌',
      text: 'KYC was rejected. Please resubmit.',
      btnText: 'Resubmit',
      btnBg: '#DC2626',
    },
  };

  const c = config[kycStatus];

  return (
    <View style={[styles.banner, { backgroundColor: c.bg, borderColor: c.border }]}>
      <View style={styles.bannerContent}>
        <Text style={styles.bannerIcon}>{c.icon}</Text>
        <Text style={styles.bannerText}>{c.text}</Text>
      </View>
      <TouchableOpacity
        style={[styles.bannerBtn, { backgroundColor: c.btnBg }]}
        onPress={() => router.push('/kyc' as any)}
      >
        <Text style={styles.bannerBtnText}>{c.btnText}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 2,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  bannerIcon: {
    fontSize: 16,
  },
  bannerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
  },
  bannerBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    marginLeft: 8,
  },
  bannerBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
});
