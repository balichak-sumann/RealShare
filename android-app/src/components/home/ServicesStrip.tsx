import React, { useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, TouchableWithoutFeedback, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { Neutrals, Radius, Typography, Shadows, GoldSystem } from '@/constants/design';
import { SectionHeader } from '../ui/SectionHeader';
import { LinearGradient } from 'expo-linear-gradient';

const SERVICES = [
  { id: '1', title: 'Interior Design', image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
  { id: '2', title: 'Property Mgmt', image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
  { id: '3', title: 'Home Loans', image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
];

const AnimatedServiceItem = ({ item, onPress }: { item: any, onPress: () => void }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      bounciness: 12,
    }).start();
  };

  return (
    <TouchableWithoutFeedback 
      onPressIn={handlePressIn} 
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <Animated.View style={[styles.serviceItem, { transform: [{ scale: scaleAnim }] }]}>
        <ImageBackground 
          source={{ uri: item.image }} 
          style={styles.imageBg}
          imageStyle={{ borderRadius: Radius.lg }}
        >
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.gradient}
          />
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        </ImageBackground>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

export function ServicesStrip() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <SectionHeader title="RealShare Services" onViewAll={() => router.push('/services')} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {SERVICES.map((service) => (
          <AnimatedServiceItem 
            key={service.id} 
            item={service} 
            onPress={() => router.push('/services')}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginBottom: 24,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  serviceItem: {
    width: 120,
    height: 140,
    borderRadius: Radius.lg,
    ...Shadows.medium,
  },
  imageBg: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
    borderRadius: Radius.lg,
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    borderRadius: Radius.lg,
  },
  title: {
    ...Typography.caption,
    color: Neutrals.surface,
    fontWeight: '700',
    padding: 12,
    zIndex: 2,
  },
});
