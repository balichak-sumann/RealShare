import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Neutrals, GoldSystem, Typography, Radius } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '@/hooks/useResponsive';
import { LinearGradient } from 'expo-linear-gradient';

const FEATURES = [
  { icon: '📝', label: '100% Free\nListing' },
  { icon: '👥', label: 'Reach\nVerified Users' },
  { icon: '⚡', label: 'Get Faster\nResponses' },
  { icon: '🔒', label: 'Safe & Secure\nPlatform' },
];

export function PostPropertyBanner() {
  const router = useRouter();
  const { isDesktop } = useResponsive();

  return (
    <View style={[styles.container, isDesktop && styles.containerDesktop]}>
      <LinearGradient
        colors={['#FFF9F0', '#FFF3E0', '#FFECD2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={[styles.inner, isDesktop && styles.innerDesktop]}>
          {/* Left Content */}
          <View style={[styles.leftContent, isDesktop && styles.leftContentDesktop]}>
            <Text style={styles.eyebrow}>SELL SMARTER</Text>
            <Text style={[styles.headline, isDesktop && styles.headlineDesktop]}>
              List Your Property{' '}
              <Text style={styles.headlineGold}>for Free</Text>
            </Text>
            <Text style={styles.description}>
              Reach thousands of genuine buyers and tenants on RealShare.{'\n'}
              Quick. Easy. No hidden charges.
            </Text>

            {/* Feature Pills */}
            <View style={styles.featuresRow}>
              {FEATURES.map((f, i) => (
                <View key={i} style={styles.featureItem}>
                  <View style={styles.featureIconCircle}>
                    <Text style={styles.featureEmoji}>{f.icon}</Text>
                  </View>
                  <Text style={styles.featureLabel}>{f.label}</Text>
                </View>
              ))}
            </View>

            {/* CTA Row */}
            <View style={styles.ctaRow}>
              <TouchableOpacity
                style={styles.ctaButton}
                onPress={() => router.push('/sell')}
                activeOpacity={0.85}
              >
                <Text style={styles.ctaText}>Post Property Now</Text>
                <Ionicons name="arrow-forward" size={16} color={Neutrals.white} style={{ marginLeft: 8 }} />
              </TouchableOpacity>

              <View style={styles.socialProof}>
                <View style={styles.avatarStack}>
                  {['👤', '👤', '👤'].map((_, i) => (
                    <View key={i} style={[styles.avatarCircle, { marginLeft: i > 0 ? -8 : 0, zIndex: 3 - i }]}>
                      <LinearGradient colors={['#D4A574', '#C4956A']} style={styles.avatarGradient}>
                        <Ionicons name="person" size={12} color={Neutrals.white} />
                      </LinearGradient>
                    </View>
                  ))}
                </View>
                <View>
                  <Text style={styles.socialProofBold}>Join 50,000+ property owners</Text>
                  <Text style={styles.socialProofSub}>who trust RealShare</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Right Image — desktop web only */}
          {isDesktop && Platform.OS === 'web' && (
            <View style={styles.rightImage}>
              <Image
                source={require('../../../assets/images/post-property-bg.jpg')}
                style={styles.propertyImage}
                contentFit="cover"
                transition={300}
              />
              {/* Floating Badges */}
              <View style={[styles.badge, styles.badgeTopRight]}>
                <Ionicons name="trending-up" size={16} color={GoldSystem.primaryGold} />
                <View style={{ marginLeft: 8 }}>
                  <Text style={styles.badgeTitle}>More Visibility</Text>
                  <Text style={styles.badgeSub}>More Opportunities</Text>
                </View>
              </View>
              <View style={[styles.badge, styles.badgeBottomRight]}>
                <Ionicons name="people" size={16} color={GoldSystem.primaryGold} />
                <View style={{ marginLeft: 8 }}>
                  <Text style={styles.badgeTitle}>Connect with</Text>
                  <Text style={styles.badgeSub}>Serious Buyers</Text>
                </View>
              </View>
              <View style={[styles.badge, styles.badgeBottomLeft]}>
                <View style={styles.soldBadge}>
                  <Text style={styles.soldText}>SOLD</Text>
                </View>
                <View style={{ marginLeft: 8 }}>
                  <Text style={styles.badgeTitle}>Happy Owners</Text>
                  <Text style={styles.badgeSub}>Real Results</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 8,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  containerDesktop: {
    marginHorizontal: 24,
  },
  gradient: {
    width: '100%',
  },
  inner: {
    padding: 24,
  },
  innerDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 40,
    gap: 40,
  },
  leftContent: {
    flex: 1,
  },
  leftContentDesktop: {
    flex: 1,
    maxWidth: '55%',
  },
  eyebrow: {
    ...Typography.caption,
    color: GoldSystem.primaryGold,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  headline: {
    fontSize: 24,
    fontWeight: '800',
    color: Neutrals.obsidian,
    marginBottom: 8,
    lineHeight: 32,
  },
  headlineDesktop: {
    fontSize: 32,
    lineHeight: 42,
  },
  headlineGold: {
    color: GoldSystem.primaryGold,
    fontStyle: 'italic',
  },
  description: {
    ...Typography.bodyMedium,
    color: Neutrals.textSecondary,
    lineHeight: 22,
    marginBottom: 20,
  },
  featuresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(191, 155, 48, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureEmoji: {
    fontSize: 16,
  },
  featureLabel: {
    ...Typography.caption,
    color: Neutrals.obsidian,
    fontWeight: '600',
    lineHeight: 16,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 20,
  },
  ctaButton: {
    backgroundColor: GoldSystem.primaryGold,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: Radius.full,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ctaText: {
    ...Typography.labelLarge,
    color: Neutrals.white,
    fontWeight: '700',
  },
  socialProof: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarStack: {
    flexDirection: 'row',
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Neutrals.white,
    overflow: 'hidden',
  },
  avatarGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialProofBold: {
    ...Typography.caption,
    fontWeight: '700',
    color: Neutrals.obsidian,
  },
  socialProofSub: {
    ...Typography.caption,
    color: Neutrals.gray500,
    fontSize: 11,
  },
  // Right image section
  rightImage: {
    flex: 1,
    height: 280,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  propertyImage: {
    width: '100%',
    height: '100%',
    borderRadius: Radius.lg,
  },
  badge: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0 4px 12px rgba(0,0,0,0.1)' } as any)
      : { elevation: 4 }),
  },
  badgeTopRight: {
    top: 20,
    right: 20,
  },
  badgeBottomRight: {
    bottom: 20,
    right: 20,
  },
  badgeBottomLeft: {
    bottom: 60,
    left: 20,
  },
  badgeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Neutrals.obsidian,
  },
  badgeSub: {
    fontSize: 11,
    color: Neutrals.gray500,
  },
  soldBadge: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  soldText: {
    fontSize: 10,
    fontWeight: '800',
    color: Neutrals.white,
    letterSpacing: 0.5,
  },
});
