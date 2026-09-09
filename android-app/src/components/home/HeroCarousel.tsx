import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Animated, Platform, TextInput, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Neutrals, GoldSystem, Typography, Radius } from '@/constants/design';
import { LinearGradient } from 'expo-linear-gradient';
import { GoldButton } from '../ui/GoldButton';
import { useRouter } from 'expo-router';
import { useResponsive } from '@/hooks/useResponsive';
import { getApiUrl, resilientFetch } from '@/lib/api';
import { useLocation } from '@/contexts/LocationContext';
import { LocationPickerModal } from '@/components/ui/LocationPickerModal';
import { Ionicons } from '@expo/vector-icons';

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
    title: 'Premium Residential Homes',
    subtitle: 'Own a premium residential home, your dream home search starts here.',
    image_url: '/banners/residential.png',
    link_url: '/search',
  },
  {
    id: 'slide2',
    title: 'High-Yield Commercial Spaces',
    subtitle: 'Institutional grade assets now accessible to retail investors.',
    image_url: '/banners/commercial.png',
    link_url: '/search',
  },
  {
    id: 'slide3',
    title: 'Fractional Ownership',
    subtitle: 'Co - own a piece of Premium  Realestate, start investing in Fractional ownership today.',
    image_url: '/banners/fractional.png',
    link_url: '/search',
  },
  {
    id: 'slide4',
    title: 'Investor Exclusives',
    subtitle: 'Pre-launch and off-market deals for verified investors.',
    image_url: '/banners/investor.png',
    link_url: '/search',
  },
  {
    id: 'slide5',
    title: 'Plots & Farms',
    subtitle: 'Secure premium agricultural land and farm plots for your future.',
    image_url: '/banners/plots.png',
    link_url: '/search',
  },
  {
    id: 'slide6',
    title: 'Luxury Holiday Homes',
    subtitle: 'Earn passive income while enjoying exclusive access.',
    image_url: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=2560&auto=format&fit=crop',
    link_url: '/search',
  }
];

export function HeroCarousel() {
  const [containerWidth, setContainerWidth] = useState(Dimensions.get('window').width || 400);
  const { isDesktop } = useResponsive();
  const router = useRouter();
  const { city } = useLocation();
  const [query, setQuery] = useState('');
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [slides, setSlides] = useState<Banner[]>([]);
  const scrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const activeIndexRef = useRef(0);

  // Trigger animation on slide change — use native driver for opacity
  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [activeIndex]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await resilientFetch(`${getApiUrl()}/api/cms/banners`);
        if (res.ok && !cancelled) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setSlides(data);
            return;
          }
        }
      } catch (e) {
        // Network failure: keep the fallback slide rather than showing nothing.
      }
      if (!cancelled) {
        setSlides(FALLBACK_SLIDES);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Stable auto-scroll timer that doesn't re-create on every slide change
  useEffect(() => {
    if (slides.length === 0) return;
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

  const submitSearch = () => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}` as any);
    } else {
      router.push('/search' as any);
    }
  };

  if (slides.length === 0) {
    return <View style={[styles.container, isDesktop && styles.containerDesktop]} />;
  }

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
            <Image
              source={{ uri: slide.image_url.startsWith('/') ? `${getApiUrl()}${slide.image_url}` : slide.image_url }}
              style={styles.image}
              contentFit="cover"
              cachePolicy="memory-disk"
              priority={index === 0 ? 'high' : 'low'}
              transition={300}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.9)']}
              style={styles.gradient}
            />
            {index === activeIndex && (
              <Animated.View style={[styles.content, { 
                opacity: fadeAnim, 
                transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [15, 0] }) }] 
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

      {/* Floating Desktop Search Overlay */}
      {isDesktop && Platform.OS === 'web' && (
        <View style={styles.searchOverlay}>
          <View style={styles.webSearchBox}>
            <TouchableOpacity style={styles.webLocationDropdown} activeOpacity={0.7} onPress={() => setShowLocationPicker(true)}>
              <Ionicons name="location-outline" size={18} color={Neutrals.gray600} />
              <Text style={styles.webLocationDropdownText}>{city}</Text>
              <Ionicons name="chevron-down" size={14} color={Neutrals.gray400} />
            </TouchableOpacity>
            
            <View style={styles.webSearchInputWrapper}>
              <Ionicons name="search-outline" size={18} color={Neutrals.gray500} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={submitSearch}
                placeholder="Search properties, localities…"
                placeholderTextColor={Neutrals.gray500}
                style={styles.webSearchInput as any}
                returnKeyType="search"
              />
            </View>
            <TouchableOpacity style={styles.searchButton} onPress={submitSearch}>
              <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      <LocationPickerModal visible={showLocationPicker} onClose={() => setShowLocationPicker(false)} />
    </View>
  );
}

const HERO_H = 450;
const HERO_H_DESKTOP = 500;

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
  searchOverlay: {
    position: 'absolute',
    bottom: 30,
    right: 40,
    zIndex: 10,
    width: '45%',
    maxWidth: 500,
  },
  webSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Neutrals.white,
    borderRadius: Radius.lg,
    padding: 8,
    paddingLeft: 16,
    width: '100%',
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
        } as any)
      : {
          elevation: 8,
        }),
  },
  webLocationDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 16,
    borderRightWidth: 1,
    borderRightColor: Neutrals.gray200,
  },
  webLocationDropdownText: {
    ...Typography.labelLarge,
    fontSize: 15,
    color: Neutrals.obsidian,
  },
  webSearchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    height: 42,
  },
  webSearchInput: {
    flex: 1,
    fontSize: 15,
    color: Neutrals.text,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  searchButton: {
    backgroundColor: GoldSystem.primaryGold,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: Radius.md,
  },
  searchButtonText: {
    ...Typography.labelLarge,
    color: Neutrals.obsidian,
  },
});
