import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Animated, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Neutrals, GoldSystem, Typography, Radius } from '@/constants/design';
import { LinearGradient } from 'expo-linear-gradient';
import { GoldButton } from '../ui/GoldButton';
import { useRouter } from 'expo-router';
import { useResponsive } from '@/hooks/useResponsive';
import { getApiUrl } from '@/lib/api';
interface Property {
  id: string | number;
  title: string;
  price: string | number;
  location: string;
  images: any[];
  [key: string]: any;
}

interface FeaturedPropertiesSliderProps {
  properties: Property[];
}

export function FeaturedPropertiesSlider({ properties }: FeaturedPropertiesSliderProps) {
  const [containerWidth, setContainerWidth] = useState(Dimensions.get('window').width || 400);
  const { isDesktop } = useResponsive();
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const activeIndexRef = useRef(0);

  // Use only first 4 properties
  const slides = properties.slice(0, 4);

  // Trigger animation on slide change
  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [activeIndex]);

  // Auto-scroll timer
  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      let nextIndex = activeIndexRef.current + 1;
      if (nextIndex >= slides.length) nextIndex = 0;
      scrollRef.current?.scrollTo({ x: nextIndex * containerWidth, animated: true });
      activeIndexRef.current = nextIndex;
      setActiveIndex(nextIndex);
    }, 5000);
    return () => clearInterval(interval);
  }, [containerWidth, slides.length]);

  const handleScroll = useCallback((event: any) => {
    const slide = Math.round(event.nativeEvent.contentOffset.x / containerWidth);
    if (slide !== activeIndexRef.current && slide >= 0 && slide < slides.length) {
      activeIndexRef.current = slide;
      setActiveIndex(slide);
    }
  }, [containerWidth, slides.length]);

  if (slides.length === 0) {
    return null;
  }

  const getImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    // For relative URLs like /uploads/xxx.png, resolve to the admin dashboard
    const isLocalhost = Platform.OS === 'web' && typeof window !== 'undefined' && window.location.hostname === 'localhost';
    const base = isLocalhost ? 'http://localhost:3000' : getApiUrl();
    return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  return (
    <View style={[styles.container, isDesktop && styles.containerDesktop]} onLayout={(e) => {
      const { width } = e.nativeEvent.layout;
      if (width > 0) setContainerWidth(width);
    }}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
      >
        {slides.map((prop, index) => {
          const image = prop.images?.[0]?.image_url || prop.image_url || '';
          return (
            <View key={prop.id} style={[styles.slide, isDesktop && styles.slideDesktop, { width: containerWidth }]}>
              {image ? (
                Platform.OS === 'web' ? (
                  <img
                    src={getImageUrl(image)}
                    alt={prop.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center',
                      display: 'block',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                    }}
                  />
                ) : (
                  <Image
                    source={{ uri: getImageUrl(image) }}
                    style={styles.image}
                    contentFit="cover"
                    priority={index === 0 ? 'high' : 'low'}
                    transition={300}
                  />
                )
              ) : (
                <View style={[styles.image, { backgroundColor: Neutrals.gray200 }]} />
              )}
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.75)']}
                style={styles.gradient}
              />
              
              {/* Featured Badge */}
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>FEATURED PROPERTY</Text>
              </View>

              {index === activeIndex && (
                <Animated.View style={[styles.content, { 
                  opacity: fadeAnim, 
                  transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [15, 0] }) }] 
                }]}>
                  <Text style={[styles.title, isDesktop && styles.titleDesktop]}>{prop.title}</Text>
                  <Text style={[styles.subtitle, isDesktop && styles.subtitleDesktop]}>
                    {prop.locality}, {prop.district} • {prop.listing_type === 'outright' ? 'Outright' : 'Fractional'}
                  </Text>
                  <GoldButton
                    title="View Details"
                    onPress={() => router.push(`/property/${prop.id}` as any)}
                    style={styles.button}
                  />
                </Animated.View>
              )}
            </View>
          );
        })}
      </ScrollView>
      <View style={styles.pagination}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === activeIndex && styles.activeDot,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const HERO_H = 300;
const HERO_H_DESKTOP = 500;

const styles = StyleSheet.create({
  container: {
    height: HERO_H,
    width: '100%',
    marginBottom: 32,
  },
  containerDesktop: {
    height: HERO_H_DESKTOP,
    borderRadius: 20,
    overflow: 'hidden',
    marginHorizontal: 24,
    marginTop: 0,
    width: 'auto',
  },
  slide: {
    height: HERO_H,
    position: 'relative',
  },
  slideDesktop: {
    height: HERO_H_DESKTOP,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 180,
  },
  badgeContainer: {
    position: 'absolute',
    top: 24,
    left: 24,
    backgroundColor: GoldSystem.primaryGold,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  badgeText: {
    ...Typography.caption,
    fontWeight: 'bold',
    color: '#000',
    letterSpacing: 1,
  },
  content: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
  },
  title: {
    ...Typography.displayMedium,
    color: Neutrals.white,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  titleDesktop: {
    fontSize: 40,
    lineHeight: 48,
  },
  subtitle: {
    ...Typography.bodyLarge,
    color: Neutrals.gray200,
    marginBottom: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitleDesktop: {
    fontSize: 18,
    marginBottom: 24,
  },
  button: {
    width: 200,
  },
  pagination: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: GoldSystem.primaryGold,
    width: 24,
  },
});
