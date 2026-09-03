import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Dimensions } from 'react-native';
import { Neutrals, GoldSystem, Typography } from '@/constants/design';
import { LinearGradient } from 'expo-linear-gradient';
import { GoldButton } from '../ui/GoldButton';
import { useRouter } from 'expo-router';

type Banner = {
  id: string;
  title: string;
  subtitle?: string | null;
  image_url: string;
  link_url?: string | null;
};

const FALLBACK_SLIDE: Banner = {
  id: 'fallback',
  title: 'Own a Piece of Premium Real Estate',
  subtitle: 'Start investing in fractional property ownership today',
  image_url: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&fit=crop',
  link_url: '/search',
};

export function HeroCarousel() {
  const [containerWidth, setContainerWidth] = useState(Dimensions.get('window').width || 400);
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const [slides, setSlides] = useState<Banner[]>([FALLBACK_SLIDE]);
  const scrollRef = useRef<ScrollView>(null);

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
    <View style={styles.container} onLayout={(e) => {
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
          <View key={slide.id} style={[styles.slide, { width: containerWidth }]}>
            <Image source={{ uri: slide.image_url }} style={styles.image} />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={styles.gradient}
            />
            <View style={styles.content}>
              <Text style={styles.title}>{slide.title}</Text>
              {!!slide.subtitle && <Text style={styles.subtitle}>{slide.subtitle}</Text>}
              {index === 0 && (
                <GoldButton
                  title="Explore Properties"
                  onPress={() => router.push((slide.link_url || '/search') as any)}
                  style={styles.button}
                />
              )}
            </View>
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

const styles = StyleSheet.create({
  container: {
    height: 450,
    width: '100%',
  },
  slide: {
    height: 450,
    position: 'relative',
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
    height: 250,
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
  },
  subtitle: {
    ...Typography.bodyLarge,
    color: Neutrals.gray300,
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
