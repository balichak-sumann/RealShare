import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';
import { propertyToProjectCardProps } from '@/lib/formatters';

// Construction-stage and progress tracking isn't captured anywhere in the
// schema yet (no ConstructionUpdate model, no admin flow to post one), so
// this screen shows the real project header and an honest "not available
// yet" state instead of fabricated milestone dates and a made-up % complete.
export default function ConstructionTrackingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com';
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/properties/${id}`);
        if (res.ok) setProject(propertyToProjectCardProps(await res.json()));
      } catch (e) {
        console.log('Failed to load project', e);
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Construction Tracker</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {project ? (
          <View style={styles.projectCard}>
            <Image source={{ uri: project.image }} style={styles.projectImage} />
            <View style={styles.projectInfo}>
              <Text style={styles.projectTitle}>{project.name}</Text>
              <Text style={styles.projectLocation}>{project.developer}</Text>
            </View>
          </View>
        ) : (
          <Text style={{ ...Typography.bodyMedium, color: Neutrals.gray600, padding: 16 }}>
            This project couldn't be found.
          </Text>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          <Text style={{ ...Typography.bodyMedium, color: Neutrals.gray600 }}>
            Live construction milestones aren't available for this project yet. Check back soon.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Latest Updates</Text>
          <Text style={{ ...Typography.bodyMedium, color: Neutrals.gray600 }}>
            No updates have been posted yet.
          </Text>
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
  projectCard: {
    backgroundColor: Neutrals.surface,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Neutrals.border,
    marginBottom: 24,
    ...Shadows.soft,
  },
  projectImage: {
    width: '100%',
    height: 160,
  },
  projectInfo: {
    padding: 16,
  },
  projectTitle: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
    marginBottom: 4,
  },
  projectLocation: {
    ...Typography.bodyMedium,
    color: Neutrals.textSecondary,
    marginBottom: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: Neutrals.gray200,
    borderRadius: Radius.full,
    marginRight: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: GoldSystem.primaryGold,
  },
  progressText: {
    ...Typography.labelMedium,
    color: Neutrals.obsidian,
  },
  section: {
    marginBottom: 32,
    backgroundColor: Neutrals.surface,
    padding: 20,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Neutrals.border,
    ...Shadows.soft,
  },
  sectionTitle: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
    marginBottom: 20,
  },
  timeline: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  timelineNodeContainer: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineNode: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Neutrals.gray300,
    borderWidth: 4,
    borderColor: Neutrals.surface,
    zIndex: 1,
  },
  timelineNodeCompleted: {
    backgroundColor: GoldSystem.primaryGold,
  },
  timelineNodeCurrent: {
    backgroundColor: Neutrals.surface,
    borderColor: GoldSystem.primaryGold,
    borderWidth: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    marginLeft: -2, // to align with 16px nodes
  },
  timelineLine: {
    position: 'absolute',
    top: 16,
    bottom: -24,
    width: 2,
    backgroundColor: Neutrals.gray200,
  },
  timelineLineCompleted: {
    backgroundColor: GoldSystem.primaryGold,
  },
  timelineContent: {
    flex: 1,
    paddingTop: -2,
  },
  timelineTitle: {
    ...Typography.labelMedium,
    color: Neutrals.gray500,
    marginBottom: 4,
  },
  timelineTitleActive: {
    color: Neutrals.obsidian,
  },
  timelineDate: {
    ...Typography.caption,
    color: Neutrals.gray500,
  },
  updateCard: {
    padding: 16,
    backgroundColor: Neutrals.gray100,
    borderRadius: Radius.md,
    marginBottom: 12,
  },
  updateDate: {
    ...Typography.caption,
    color: Neutrals.gray600,
    marginBottom: 8,
    fontWeight: '700',
  },
  updateText: {
    ...Typography.bodyMedium,
    color: Neutrals.obsidian,
  },
});
