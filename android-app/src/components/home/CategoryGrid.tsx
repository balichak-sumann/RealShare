import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { PROPERTY_CATEGORIES } from '@/constants/uiConstants';
import { CategoryPill } from '../ui/CategoryPill';

export function CategoryGrid() {
  const [activeId, setActiveId] = useState(PROPERTY_CATEGORIES[0].id);

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {PROPERTY_CATEGORIES.map((category) => (
          <CategoryPill
            key={category.id}
            label={category.label}
            icon={category.icon}
            isActive={activeId === category.id}
            onPress={() => setActiveId(category.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: -20, // Overlap the hero slightly
    zIndex: 10,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 10, // Shadow space
  },
});
