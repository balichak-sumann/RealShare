import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';
import { TrustBadge } from '@/components/ui/TrustBadge';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ProjectCard } from '@/components/ui/ProjectCard';
import { MOCK_PROJECTS } from '@/constants/mockData';

export default function DeveloperDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  // Mock Developer Data
  const developer = {
    name: 'Prestige Group',
    logoInitial: 'P',
    rating: 4.8,
    projects: 124,
    ongoing: 12,
    hasRera: true,
    established: 1986,
    cities: 7,
    about: 'Prestige Group has firmly established itself as one of the leading and most successful developers of real estate in India by imprinting its indelible mark across all asset classes.',
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.iconBtnText}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn}><Text style={styles.iconBtnText}>🔗</Text></TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Profile Header */}
        <View style={styles.profileSection}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>{developer.logoInitial}</Text>
          </View>
          <Text style={styles.name}>{developer.name}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>Est. {developer.established}</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.metaText}>{developer.cities} Cities</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.rating}>⭐ {developer.rating}</Text>
          </View>
          {developer.hasRera && <TrustBadge type="rera" />}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{developer.projects}</Text>
            <Text style={styles.statLabel}>Total Projects</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{developer.ongoing}</Text>
            <Text style={styles.statLabel}>Ongoing</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{developer.projects - developer.ongoing}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>About Developer</Text>
          <Text style={styles.aboutText}>{developer.about}</Text>

          <View style={{ marginTop: 24 }}>
            <SectionHeader title="Ongoing Projects" onViewAll={() => {}} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20, paddingHorizontal: 20 }}>
              {MOCK_PROJECTS.map((project) => (
                <ProjectCard key={project.id} {...project} />
              ))}
            </ScrollView>
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
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 50,
    backgroundColor: Neutrals.surface,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Neutrals.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Neutrals.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnText: {
    fontSize: 20,
    color: Neutrals.obsidian,
  },
  profileSection: {
    backgroundColor: Neutrals.surface,
    padding: 20,
    paddingBottom: 32,
    alignItems: 'center',
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Neutrals.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Neutrals.border,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '700',
    color: GoldSystem.primaryGold,
  },
  name: {
    ...Typography.displayMedium,
    color: Neutrals.obsidian,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  metaText: {
    ...Typography.caption,
    color: Neutrals.textSecondary,
  },
  dot: {
    marginHorizontal: 8,
    color: Neutrals.gray400,
  },
  rating: {
    ...Typography.labelMedium,
    color: Neutrals.obsidian,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: -20,
    marginBottom: 24,
  },
  statBox: {
    width: '31%',
    backgroundColor: Neutrals.surface,
    padding: 16,
    borderRadius: Radius.lg,
    alignItems: 'center',
    ...Shadows.medium,
    borderWidth: 1,
    borderColor: Neutrals.border,
  },
  statValue: {
    ...Typography.headlineMedium,
    color: GoldSystem.primaryGold,
    marginBottom: 4,
  },
  statLabel: {
    ...Typography.caption,
    color: Neutrals.gray500,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
    marginBottom: 12,
  },
  aboutText: {
    ...Typography.bodyLarge,
    color: Neutrals.textSecondary,
    lineHeight: 24,
  },
});
