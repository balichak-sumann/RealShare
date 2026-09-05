import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { PROPERTY_CATEGORIES } from '@/constants/uiConstants';
import { CategoryPill } from '../ui/CategoryPill';

interface CategoryGridProps {
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

export function CategoryGrid({ activeCategory, onCategoryChange }: CategoryGridProps) {
  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {PROPERTY_CATEGORIES.map((category) => (
          <CategoryPill
            key={category.id}
            label={category.label}
            icon={category.icon}
            isActive={activeCategory === category.id}
            onPress={() => onCategoryChange(category.id)}
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
