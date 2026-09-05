import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Dimensions, Animated } from 'react-native';
import { Neutrals, GoldSystem, Typography } from '@/constants/design';
import { LinearGradient } from 'expo-linear-gradient';
import { GoldButton } from '../ui/GoldButton';
import { useRouter } from 'expo-router';
import { useResponsive } from '@/hooks/useResponsive';

type Banner = {
  id: string;
  title: string;
  subtitle?: string | null;
  image_url: string;
  link_url?: string | null;
};

const FALLBACK_SLIDES: Banner[] = [
  {
    id: 'slide1',
    title: 'Own a Piece of Premium Real Estate',
    subtitle: 'Start investing in fractional property ownership today',
    image_url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&fit=crop',
    link_url: '/search',
  },
  {
    id: 'slide2',
    title: 'Luxury Holiday Homes, Simplified',
    subtitle: 'Earn passive income while enjoying exclusive access.',
    image_url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1600&fit=crop',
    link_url: '/search',
  },
  {
    id: 'slide3',
    title: 'High-Yield Commercial Spaces',
    subtitle: 'Institutional grade assets now accessible to retail investors.',
    image_url: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1600&fit=crop',
    link_url: '/search',
  }
];

export function HeroCarousel() {
  const [containerWidth, setContainerWidth] = useState(Dimensions.get('window').width || 400);
  const { isDesktop } = useResponsive();
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const [slides, setSlides] = useState<Banner[]>(FALLBACK_SLIDES);
  const scrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Trigger animation on slide change
  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: false, // fallback to false for web layout compatibility
    }).start();
  }, [activeIndex]);

  useEffect(() => {
    const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com';
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/cms/banners`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setSlides(data);
          }
        }
      } catch (e) {
        // Network failure: keep the fallback slide rather than showing nothing.
      }
    })();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      let nextIndex = activeIndex + 1;
      if (nextIndex >= slides.length) nextIndex = 0;
      scrollRef.current?.scrollTo({ x: nextIndex * containerWidth, animated: true });
      setActiveIndex(nextIndex);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeIndex, containerWidth, slides.length]);

  const handleScroll = (event: any) => {
    const slide = Math.round(event.nativeEvent.contentOffset.x / containerWidth);
    if (slide !== activeIndex) {
      setActiveIndex(slide);
    }
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
        {slides.map((slide, index) => (
          <View key={slide.id} style={[styles.slide, isDesktop && styles.slideDesktop, { width: containerWidth }]}>
            <Image source={{ uri: slide.image_url }} style={styles.image} />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.9)']}
              style={styles.gradient}
            />
            {index === activeIndex && (
              <Animated.View style={[styles.content, { 
                opacity: fadeAnim, 
                transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] 
              }]}>
                <Text style={[styles.title, isDesktop && styles.titleDesktop]}>{slide.title}</Text>
                {!!slide.subtitle && <Text style={[styles.subtitle, isDesktop && styles.subtitleDesktop]}>{slide.subtitle}</Text>}
                <GoldButton
                  title="Explore Properties"
                  onPress={() => router.push((slide.link_url || '/search') as any)}
                  style={styles.button}
                />
              </Animated.View>
            )}
          </View>
        ))}
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

const HERO_H = 450;
const HERO_H_DESKTOP = 400;

const styles = StyleSheet.create({
  container: {
    height: HERO_H,
    width: '100%',
  },
  containerDesktop: {
    height: HERO_H_DESKTOP,
    borderRadius: 20,
    overflow: 'hidden',
    marginHorizontal: 24,
    marginTop: 20,
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
    height: 350,
  },
  content: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
  },
  title: {
    ...Typography.displayLarge,
    color: Neutrals.white,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  titleDesktop: {
    fontSize: 48,
    lineHeight: 56,
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
    fontSize: 20,
    marginBottom: 32,
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
