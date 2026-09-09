import React from 'react';
import { View, Text, StyleSheet, Platform, ImageBackground, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useResponsive } from '@/hooks/useResponsive';
import { LinearGradient } from 'expo-linear-gradient';
import { Neutrals, GoldSystem, Typography } from '@/constants/design';
import { DesktopNav } from './DesktopNav';

interface AuthSplitLayoutProps {
  children: React.ReactNode;
}

const BG_IMAGE = 'https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=2000&auto=format&fit=crop';

const FEATURES = [
  {
    icon: 'home-outline',
    title: 'Access your portfolio',
    desc: 'Manage listings, leads and inquiries',
  },
  {
    icon: 'bar-chart-outline',
    title: 'Get real-time insights',
    desc: 'Track performance and market trends',
  },
  {
    icon: 'people-outline',
    title: 'Connect with genuine buyers',
    desc: 'Build meaningful opportunities',
  },
];

export function AuthSplitLayout({ children }: AuthSplitLayoutProps) {
  const router = useRouter();
  const { isDesktop } = useResponsive();

  // Desktop Split Layout
  if (isDesktop && Platform.OS === 'web') {
    return (
      <View style={{ flex: 1, backgroundColor: '#FAF8F5' }}>
        <DesktopNav />
        <View style={styles.desktopContainer}>
          {/* Left Promotional Side */}
          <View style={styles.leftSide}>
          <ImageBackground source={{ uri: BG_IMAGE }} style={styles.backgroundImage}>
            <LinearGradient
              colors={['rgba(250, 248, 245, 0.95)', 'rgba(250, 248, 245, 0.8)', 'rgba(250, 248, 245, 0.3)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientOverlay}
            >
              <ScrollView contentContainerStyle={styles.leftContent} showsVerticalScrollIndicator={false}>
                <View style={styles.eyebrowContainer}>
                  <View style={styles.eyebrowLine} />
                  <Text style={styles.eyebrow}>REAL PEOPLE. REAL OPPORTUNITIES.</Text>
                </View>
                
                <Text style={styles.headline}>
                  Welcome{'\n'}to <Text style={{ color: GoldSystem.primaryGold }}>RealShare</Text>
                </Text>
                
                <Text style={styles.subtitle}>
                  Sign in to manage your properties, explore{'\n'}opportunities and grow your real estate journey.
                </Text>

                <View style={styles.featuresList}>
                  {FEATURES.map((f, i) => (
                    <View key={i} style={styles.featureItem}>
                      <View style={styles.featureIconContainer}>
                        <Ionicons name={f.icon as any} size={20} color={GoldSystem.primaryGold} />
                      </View>
                      <View>
                        <Text style={styles.featureTitle}>{f.title}</Text>
                        <Text style={styles.featureDesc}>{f.desc}</Text>
                      </View>
                    </View>
                  ))}
                </View>

                <View style={styles.quoteBox}>
                  <Text style={styles.quoteText}>"A smarter way{'\n'}to own, sell and invest."</Text>
                  <View style={styles.quoteAuthorRow}>
                    <View style={styles.quoteAuthorLine} />
                    <Text style={styles.quoteAuthor}>REALSHARE</Text>
                  </View>
                </View>

                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>50K+</Text>
                    <Text style={styles.statLabel}>Happy Users</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>1M+</Text>
                    <Text style={styles.statLabel}>Properties Listed</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>4.8 ★</Text>
                    <Text style={styles.statLabel}>User Rating</Text>
                  </View>
                </View>
              </ScrollView>
            </LinearGradient>
          </ImageBackground>
        </View>

        {/* Right Form Side */}
        <View style={styles.rightSide}>
          <View style={styles.formContainerWrapper}>
            {children}
          </View>
        </View>
        </View>
      </View>
    );
  }

  // Mobile Layout
  return (
    <View style={styles.mobileContainer}>
      <View style={styles.mobileHeader}>
        <TouchableOpacity onPress={() => router.push('/')}>
          <Image source={require('../../../assets/logo.png')} style={{ width: 120, height: 30, resizeMode: 'contain' }} />
        </TouchableOpacity>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  desktopContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FAF8F5',
  },
  headerAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    zIndex: 10,
    backgroundColor: 'rgba(250, 248, 245, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
  },
  headerNavItem: {
    fontSize: 14,
    color: Neutrals.obsidian,
    fontWeight: '500',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: GoldSystem.primaryGold,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: GoldSystem.primaryGold,
  },
  leftSide: {
    flex: 1.1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    flex: 1,
    justifyContent: 'center',
  },
  leftContent: {
    paddingLeft: '12%',
    paddingRight: '15%',
    paddingTop: 40,
    paddingBottom: 40,
    flexGrow: 1,
    justifyContent: 'center',
  },
  eyebrowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  eyebrowLine: {
    width: 20,
    height: 2,
    backgroundColor: GoldSystem.primaryGold,
    marginRight: 12,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    color: Neutrals.gray600,
  },
  headline: {
    fontSize: 52,
    fontWeight: '800',
    color: Neutrals.obsidian,
    lineHeight: 56,
    marginBottom: 12,
    fontFamily: 'serif',
  },
  subtitle: {
    fontSize: 16,
    color: Neutrals.gray600,
    lineHeight: 24,
    marginBottom: 32,
  },
  featuresList: {
    gap: 16,
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Neutrals.obsidian,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 13,
    color: Neutrals.gray500,
  },
  quoteBox: {
    marginBottom: 32,
  },
  quoteText: {
    fontSize: 20,
    fontStyle: 'italic',
    color: Neutrals.gray600,
    lineHeight: 28,
    marginBottom: 12,
    fontFamily: 'serif',
  },
  quoteAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quoteAuthorLine: {
    width: 16,
    height: 1,
    backgroundColor: GoldSystem.primaryGold,
    marginRight: 12,
  },
  quoteAuthor: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: GoldSystem.primaryGold,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 32,
  },
  statItem: {},
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: Neutrals.obsidian,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: Neutrals.gray500,
  },
  rightSide: {
    flex: 0.9,
    backgroundColor: '#FAF8F5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  formContainerWrapper: {
    width: '100%',
    maxWidth: 480,
  },
  // Mobile styles
  mobileContainer: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  mobileHeader: {
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    backgroundColor: Neutrals.white,
  },
});
