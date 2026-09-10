import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, TouchableWithoutFeedback, ImageBackground, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Neutrals, Radius, Typography, Shadows, GoldSystem } from '@/constants/design';
import { SectionHeader } from '../ui/SectionHeader';
import { LinearGradient } from 'expo-linear-gradient';
import { useResponsive } from '@/hooks/useResponsive';
// expo-av removed due to RN 0.86 JSI mismatch causing startup crashes
import { getApiUrl } from '@/lib/api';

const DEFAULT_SERVICES = [
  { 
    id: '3', 
    title: 'Home Loans & Finance', 
    video: require('../../../assets/videos/home_loan.mp4'),
    image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  },
  { 
    id: '1', 
    title: 'Interior Design', 
    video: require('../../../assets/videos/interior_design.mp4'),
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  },
  { 
    id: '2', 
    title: 'Property Management', 
    video: require('../../../assets/videos/property_mgnt.mp4'),
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  },
];

const AnimatedServiceItem = ({ item, onPress, isDesktop }: { item: any, onPress: () => void, isDesktop: boolean }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
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
      <Animated.View style={[
        styles.serviceItem, 
        isDesktop && styles.serviceItemDesktop, 
        { transform: [{ scale: scaleAnim }], overflow: 'hidden', borderRadius: isDesktop ? Radius.xl : Radius.lg }
      ]}>
        {isDesktop && item.video ? (
          <ImageBackground 
            source={{ uri: item.image || item.image_url }} 
            style={styles.imageBg}
            imageStyle={{ borderRadius: isDesktop ? Radius.xl : Radius.lg }}
          >
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.85)']}
              style={[styles.gradient, isDesktop && styles.gradientDesktop]}
            />
            <Text style={[styles.title, isDesktop && styles.titleDesktop]}>{item.title}</Text>
          </ImageBackground>
        ) : (
          <ImageBackground 
            source={{ uri: item.image || item.image_url }} 
            style={styles.imageBg}
            imageStyle={{ borderRadius: isDesktop ? Radius.xl : Radius.lg }}
          >
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.85)']}
              style={styles.gradient}
            />
            <Text style={styles.title}>{item.title}</Text>
          </ImageBackground>
        )}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

export function ServicesStrip() {
  const router = useRouter();
  const { isDesktop } = useResponsive();
  const [services, setServices] = useState<any[]>(DEFAULT_SERVICES);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${getApiUrl()}/api/services/catalog?active=true`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setServices(data.map((s) => ({
              id: s.id,
              title: s.title,
              image: s.image_url,
              video: DEFAULT_SERVICES.find(ds => ds.title === s.title)?.video,
            })));
          }
        }
      } catch (err) {
        console.warn('Failed to fetch services strip catalog', err);
      }
    })();
  }, []);

  return (
    <View style={styles.container}>
      <SectionHeader title="Premium Services" onViewAll={() => router.push('/services')} />
      
      {isDesktop ? (
        <View style={styles.desktopGrid}>
          {services.map((service) => (
            <AnimatedServiceItem 
              key={service.id} 
              item={service} 
              isDesktop={isDesktop}
              onPress={() => router.push('/services')}
            />
          ))}
        </View>
      ) : (
        <View style={styles.mobileGrid}>
          {services.map((service) => (
            <AnimatedServiceItem 
              key={service.id} 
              item={service} 
              isDesktop={isDesktop}
              onPress={() => router.push('/services')}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    marginBottom: 40,
  },
  mobileGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    justifyContent: 'space-between',
  },
  desktopGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    paddingHorizontal: 24,
  },
  serviceItem: {
    flex: 1,
    height: 140,
    borderRadius: Radius.lg,
    ...Shadows.medium,
  },
  serviceItemDesktop: {
    flex: 1,
    minWidth: 220,
    height: 320,
    borderRadius: Radius.xl,
    ...Shadows.strong,
  },
  imageBg: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    borderRadius: Radius.lg,
  },
  gradientDesktop: {
    height: '70%',
    borderRadius: Radius.xl,
  },
  title: {
    ...Typography.labelMedium,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    color: Neutrals.surface,
    padding: 8,
    zIndex: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  titleDesktop: {
    ...Typography.headlineMedium,
    padding: 24,
    textShadowRadius: 4,
  },
});
