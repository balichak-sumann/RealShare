import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';
import { SearchBar } from '@/components/ui/SearchBar';
import { ProjectCard } from '@/components/ui/ProjectCard';
import { propertyToProjectCardProps } from '@/lib/formatters';

const TABS = ['All Projects', 'New Launch', 'Under Construction', 'Ready to Move', 'Luxury'];

export default function ProjectsScreen() {
  const router = useRouter();
  const { agent: agentId, agentName } = useLocalSearchParams<{ agent?: string; agentName?: string }>();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com';
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/properties`);
        if (res.ok) {
          const data = await res.json();
          let list = Array.isArray(data) ? data : data.properties || [];
          if (agentId) {
            list = list.filter((p: any) => p.posted_by === agentId);
          }
          setProjects(list.map(propertyToProjectCardProps));
        }
      } catch (e) {
        console.log('Failed to load projects', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [agentId]);

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.location.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{agentName ? String(agentName) : 'New Projects'}</Text>
          <View style={{ width: 24 }} />
        </View>

        <SearchBar
          value={query}
          onChangeText={setQuery}
          onVoicePress={() => {}}
        />
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, activeTab === tab && styles.activeTabBtn]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.resultsContainer} contentContainerStyle={styles.scrollContent}>
        <View style={styles.resultsHeader}>
          <Text style={styles.resultCount}>{loading ? 'Loading…' : `${filteredProjects.length} projects found`}</Text>
        </View>

        {filteredProjects.map((project) => (
          <TouchableOpacity 
            key={project.id} 
            activeOpacity={0.9} 
            onPress={() => router.push(`/project/${project.id}` as any)}
            style={{ marginBottom: 24 }} // Added wrapper for spacing
          >
             <ProjectCard {...project} />
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
    paddingTop: 50,
    backgroundColor: Neutrals.surface,
    borderBottomWidth: 1,
    borderBottomColor: Neutrals.border,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
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
  tabsContainer: {
    marginTop: 16,
    flexDirection: 'row',
  },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Neutrals.gray100,
    marginRight: 8,
  },
  activeTabBtn: {
    backgroundColor: Neutrals.obsidian,
  },
  tabText: {
    ...Typography.labelMedium,
    color: Neutrals.gray600,
  },
  activeTabText: {
    color: Neutrals.surface,
  },
  resultsContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  resultsHeader: {
    marginBottom: 16,
  },
  resultCount: {
    ...Typography.bodyMedium,
    color: Neutrals.textSecondary,
  },
});
