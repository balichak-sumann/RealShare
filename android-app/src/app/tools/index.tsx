import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';

const TOOLS = [
  { id: 'stamp-duty', icon: '📜', title: 'Stamp Duty Calculator', desc: 'State-wise registration costs' },
  { id: 'rental-yield', icon: '📈', title: 'Rental Yield', desc: 'Calculate ROI on properties' },
  { id: 'affordability', icon: '🎯', title: 'Affordability Check', desc: 'How much can you afford?' },
  { id: 'vastu', icon: '🧭', title: 'Vastu Check', desc: 'Direction & placement guide' },
  { id: 'checklist', icon: '☑️', title: 'Buying Checklist', desc: 'Step-by-step home buying guide' },
];

export default function ToolsHubScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Property Tools</Text>
          <View style={{ width: 24 }} />
        </View>
        <Text style={styles.subtitle}>Everything you need to make informed real estate decisions.</Text>
      </View>

      <ScrollView style={styles.listContainer} contentContainerStyle={styles.listContent}>
        {TOOLS.map((tool) => (
          <TouchableOpacity 
            key={tool.id} 
            style={styles.toolCard}
            onPress={() => router.push(`/tools/${tool.id}` as any)}
          >
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>{tool.icon}</Text>
            </View>
            <View style={styles.toolInfo}>
              <Text style={styles.toolTitle}>{tool.title}</Text>
              <Text style={styles.toolDesc}>{tool.desc}</Text>
            </View>
            <Text style={styles.arrowIcon}>→</Text>
          </TouchableOpacity>
        ))}
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
    padding: 16,
    paddingTop: Platform.OS === 'web' ? 18 : 50,
    backgroundColor: Neutrals.surface,
    borderBottomWidth: 1,
    borderBottomColor: Neutrals.border,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
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
  subtitle: {
    ...Typography.bodyMedium,
    color: Neutrals.textSecondary,
    paddingHorizontal: 8,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Neutrals.surface,
    padding: 16,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Neutrals.border,
    ...Shadows.soft,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: GoldSystem.paleGold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  icon: {
    fontSize: 24,
  },
  toolInfo: {
    flex: 1,
  },
  toolTitle: {
    ...Typography.labelLarge,
    color: Neutrals.obsidian,
    marginBottom: 4,
  },
  toolDesc: {
    ...Typography.caption,
    color: Neutrals.textSecondary,
  },
  arrowIcon: {
    fontSize: 20,
    color: Neutrals.gray400,
    marginLeft: 8,
  },
});
