import React from 'react';
import { View, StyleSheet } from 'react-native';
import { PropertyCard } from '@/components/ui/PropertyCard';

interface AIRecommendationProps {
  property: any;
}

export function AIRecommendation({ property }: AIRecommendationProps) {
  return (
    <View style={styles.container}>
      <PropertyCard {...property} compact />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginLeft: 32,
    marginBottom: 16,
  },
});
