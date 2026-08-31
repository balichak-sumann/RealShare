import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SectionHeader } from '../ui/SectionHeader';
import { ProjectCard } from '../ui/ProjectCard';
import { MOCK_PROJECTS } from '@/constants/mockData';

export function HotProjects() {
  return (
    <View style={styles.container}>
      <SectionHeader title="Hot Projects" onViewAll={() => {}} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {MOCK_PROJECTS.map((project) => (
          <ProjectCard key={project.id} {...project} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20, // For shadow
  },
});
