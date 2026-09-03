import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';
import { TrustBadge } from '@/components/ui/TrustBadge';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ProjectCard } from '@/components/ui/ProjectCard';
import { propertyToProjectCardProps } from '@/lib/formatters';

export default function DeveloperDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [developer, setDeveloper] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com';
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/developers/${id}`);
        if (res.ok) {
          const data = await res.json();
          const properties = data.properties || [];
          const ongoing = properties.filter((p: any) => p.approval_status === 'approved').length;
          const cities = new Set(properties.map((p: any) => p.district).filter(Boolean)).size;
          setDeveloper({
            name: data.name,
            logoInitial: (data.name || '?').charAt(0).toUpperCase(),
            rating: Number(data.rating),
            projects: data._count?.properties ?? properties.length,
            ongoing,
            hasRera: data.rera_registered,
            established: data.established_year,
            cities,
            about: data.bio || `${data.name} is a real estate developer partnered with RealShare.`,
          });
          setProjects(properties.map((p: any) => propertyToProjectCardProps({ ...p, developer: data })));
        }
      } catch (e) {
        console.log('Failed to load developer', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={GoldSystem.primaryGold} />
      </View>
    );
  }

  if (!developer) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center', padding: 24 }]}>
        <Text style={{ ...Typography.bodyLarge, color: Neutrals.gray600, textAlign: 'center' }}>
          This developer couldn't be found.
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: GoldSystem.primaryGold, fontWeight: '600' }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
            <SectionHeader title="Projects" onViewAll={() => {}} />
            {projects.length === 0 ? (
              <Text style={{ ...Typography.bodyMedium, color: Neutrals.gray600 }}>
                No listed projects yet.
              </Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20, paddingHorizontal: 20 }}>
                {projects.map((project) => (
                  <ProjectCard key={project.id} {...project} />
                ))}
              </ScrollView>
            )}
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
