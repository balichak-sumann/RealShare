import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';
import { MOCK_PROJECTS } from '@/constants/mockData';

export default function ConstructionTrackingScreen() {
  const router = useRouter();
  const project = MOCK_PROJECTS[0]; // Example project

  const STAGES = [
    { id: '1', title: 'Excavation & Foundation', date: 'Jan 2024', completed: true },
    { id: '2', title: 'Plinth Level', date: 'Mar 2024', completed: true },
    { id: '3', title: 'Structural Framework (50%)', date: 'Jun 2024', completed: true },
    { id: '4', title: 'Structural Framework (100%)', date: 'Oct 2024', completed: false, current: true },
    { id: '5', title: 'Brickwork & Plastering', date: 'Jan 2025', completed: false },
    { id: '6', title: 'Finishing & Handover', date: 'Aug 2025', completed: false },
  ];

  const LATEST_UPDATES = [
    { id: '1', date: '15 Oct 2024', text: 'Slab casting for 12th floor completed. Curing in progress.' },
    { id: '2', date: '28 Sep 2024', text: 'Blockwork initiated on 5th floor.' },
  ];

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
        
        <View style={styles.projectCard}>
          <Image source={{ uri: project.image }} style={styles.projectImage} />
          <View style={styles.projectInfo}>
            <Text style={styles.projectTitle}>{project.name}</Text>
            <Text style={styles.projectLocation}>{project.developer}</Text>
            <View style={styles.progressContainer}>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `65%` }]} />
              </View>
              <Text style={styles.progressText}>65% Completed</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          
          <View style={styles.timeline}>
            {STAGES.map((stage, idx) => (
              <View key={stage.id} style={styles.timelineItem}>
                <View style={styles.timelineNodeContainer}>
                  <View style={[
                    styles.timelineNode, 
                    stage.completed && styles.timelineNodeCompleted,
                    stage.current && styles.timelineNodeCurrent
                  ]} />
                  {idx < STAGES.length - 1 && (
                    <View style={[styles.timelineLine, stage.completed && styles.timelineLineCompleted]} />
                  )}
                </View>
                <View style={styles.timelineContent}>
                  <Text style={[
                    styles.timelineTitle,
                    (stage.completed || stage.current) && styles.timelineTitleActive
                  ]}>{stage.title}</Text>
                  <Text style={styles.timelineDate}>{stage.date}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Latest Updates</Text>
          {LATEST_UPDATES.map(update => (
            <View key={update.id} style={styles.updateCard}>
              <Text style={styles.updateDate}>{update.date}</Text>
              <Text style={styles.updateText}>{update.text}</Text>
            </View>
          ))}
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
