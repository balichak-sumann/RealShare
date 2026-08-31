import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';
import { GoldButton } from '@/components/ui/GoldButton';
import { InvestmentScore } from '@/components/ui/InvestmentScore';
import { TrustBadge } from '@/components/ui/TrustBadge';
import { MOCK_PROJECTS } from '@/constants/mockData';

export default function ProjectDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const project = MOCK_PROJECTS.find(p => p.id === id) || MOCK_PROJECTS[0];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: project.image }} style={styles.heroImage} />
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.iconBtnText}>←</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.badgeRow}>
            {project.hasRera && <TrustBadge type="rera" />}
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{project.possession}</Text>
            </View>
          </View>

          <Text style={styles.title}>{project.name}</Text>
          <Text style={styles.developerText}>by {project.developer}</Text>
          <Text style={styles.location}>📍 {project.location}</Text>

          <View style={styles.priceCard}>
            <View>
              <Text style={styles.priceLabel}>Price Range</Text>
              <Text style={styles.priceValue}>{project.priceRange}</Text>
            </View>
            <View style={styles.scoreContainer}>
              <InvestmentScore score={88} size={50} showLabel={false} strokeWidth={4} />
            </View>
          </View>

          {/* Configurations */}
          <Text style={styles.sectionTitle}>Configurations</Text>
          <View style={styles.configCard}>
            <View style={styles.configRow}>
              <Text style={styles.configType}>2 BHK Apartment</Text>
              <Text style={styles.configPrice}>₹1.8 Cr onwards</Text>
            </View>
            <Text style={styles.configArea}>1,250 - 1,400 sq.ft</Text>
          </View>
          <View style={styles.configCard}>
            <View style={styles.configRow}>
              <Text style={styles.configType}>3 BHK Apartment</Text>
              <Text style={styles.configPrice}>₹2.4 Cr onwards</Text>
            </View>
            <Text style={styles.configArea}>1,800 - 2,100 sq.ft</Text>
          </View>

          {/* Progress */}
          <Text style={styles.sectionTitle}>Construction Status</Text>
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Under Construction</Text>
              <Text style={styles.progressPercent}>75%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: '75%' }]} />
            </View>
            <Text style={styles.progressDesc}>Expected possession by {project.possession}</Text>
          </View>

        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarActions}>
          <TouchableOpacity style={styles.outlineBtn}>
            <Text style={styles.outlineBtnText}>Download Brochure</Text>
          </TouchableOpacity>
          <GoldButton 
            title="Enquire Now" 
            onPress={() => {}} 
            style={{ flex: 1, marginLeft: 12 }}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Neutrals.background,
  },
  heroContainer: {
    width: '100%',
    height: 300,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
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
  iconBtnText: {
    fontSize: 20,
    color: Neutrals.obsidian,
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
  statusBadge: {
    backgroundColor: Neutrals.surface,
    borderWidth: 1,
    borderColor: Neutrals.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  statusText: {
    ...Typography.caption,
    color: Neutrals.obsidian,
    textTransform: 'uppercase',
  },
  title: {
    ...Typography.displayMedium,
    color: Neutrals.obsidian,
    marginBottom: 4,
  },
  developerText: {
    ...Typography.bodyLarge,
    color: GoldSystem.primaryGold,
    marginBottom: 12,
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
  sectionTitle: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
    marginBottom: 16,
    marginTop: 8,
  },
  configCard: {
    backgroundColor: Neutrals.surface,
    padding: 16,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Neutrals.border,
    marginBottom: 12,
  },
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  configType: {
    ...Typography.labelLarge,
    color: Neutrals.obsidian,
  },
  configPrice: {
    ...Typography.labelLarge,
    color: GoldSystem.primaryGold,
  },
  configArea: {
    ...Typography.caption,
    color: Neutrals.gray500,
  },
  progressCard: {
    backgroundColor: Neutrals.surface,
    padding: 20,
    borderRadius: Radius.lg,
    ...Shadows.soft,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Neutrals.border,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  progressTitle: {
    ...Typography.labelMedium,
    color: Neutrals.obsidian,
  },
  progressPercent: {
    ...Typography.labelMedium,
    color: GoldSystem.primaryGold,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: Neutrals.gray200,
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: GoldSystem.primaryGold,
  },
  progressDesc: {
    ...Typography.caption,
    color: Neutrals.textSecondary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Neutrals.surface,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    ...Shadows.strong,
  },
  bottomBarActions: {
    flexDirection: 'row',
  },
  outlineBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: GoldSystem.primaryGold,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  outlineBtnText: {
    ...Typography.labelLarge,
    color: GoldSystem.primaryGold,
  },
});
