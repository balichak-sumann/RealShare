import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, useWindowDimensions, ScrollView } from 'react-native';
import { MOCK_HERO_SLIDES } from '@/constants/mockData';
import { Neutrals, GoldSystem, Typography } from '@/constants/design';
import { LinearGradient } from 'expo-linear-gradient';
import { GoldButton } from '../ui/GoldButton';
import { useRouter } from 'expo-router';

export function HeroCarousel() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      let nextIndex = activeIndex + 1;
      if (nextIndex >= MOCK_HERO_SLIDES.length) nextIndex = 0;
      scrollRef.current?.scrollTo({ x: nextIndex * width, animated: true });
      setActiveIndex(nextIndex);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeIndex, width]);

  const handleScroll = (event: any) => {
    const slide = Math.round(event.nativeEvent.contentOffset.x / width);
    if (slide !== activeIndex) {
      setActiveIndex(slide);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
      >
        {MOCK_HERO_SLIDES.map((slide, index) => (
          <View key={slide.id} style={[styles.slide, { width }]}>
            <Image source={{ uri: slide.image }} style={styles.image} />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={styles.gradient}
            />
            <View style={styles.content}>
              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.subtitle}>{slide.subtitle}</Text>
              {index === 0 && (
                <GoldButton
                  title="Explore Properties"
                  onPress={() => router.push('/search' as any)}
                  style={styles.button}
                />
              )}
            </View>
          </View>
        ))}
      </ScrollView>
      <View style={styles.pagination}>
        {MOCK_HERO_SLIDES.map((_, i) => (
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
