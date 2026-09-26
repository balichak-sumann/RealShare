import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Platform, TouchableOpacity, useWindowDimensions, Animated } from 'react-native';
import { Image } from 'expo-image';
import { Neutrals, GoldSystem, Typography, Radius } from '@/constants/design';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useResponsive } from '@/hooks/useResponsive';
import { getFullImageUrl, formatPrice } from '@/lib/formatters';
import { Ionicons } from '@expo/vector-icons';

interface Property {
  id: string | number;
  title: string;
  price_per_fraction?: number | string;
  total_fractions?: number;
  locality?: string;
  district?: string;
  bedrooms?: number;
  bathrooms?: number;
  area_sqft?: number;
  images: any[];
  [key: string]: any;
}

interface FeaturedProjectsSliderProps {
  properties: Property[];
}

export function FeaturedProjectsSlider({ properties }: FeaturedProjectsSliderProps) {
  const { isDesktop } = useResponsive();
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  
  // Use first 5 properties
  const slides = properties.slice(0, 5);
  
  const slideAnim = useRef(new Animated.Value(0)).current;
  const isAnimating = useRef(false);

  const handleNext = React.useCallback(() => {
    if (isAnimating.current) return;
    isAnimating.current = true;
    
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
      slideAnim.setValue(0);
      isAnimating.current = false;
    });
  }, [slides.length, slideAnim]);
  
  const handlePrev = React.useCallback(() => {
    if (isAnimating.current) return;
    isAnimating.current = true;
    
    Animated.timing(slideAnim, {
      toValue: -1,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length);
      slideAnim.setValue(0);
      isAnimating.current = false;
    });
  }, [slides.length, slideAnim]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      handleNext();
    }, 5000);
    return () => clearInterval(interval);
  }, [handleNext, slides.length]);

  const getImg = (prop: any) => {
    if (!prop) return '';
    const firstImg = prop.images?.[0];
    const rawImage = typeof firstImg === 'string' ? firstImg : (firstImg?.image_url || prop.image_url || '');
    return getFullImageUrl(rawImage);
  };

  const getPriceDisplay = (prop: any) => {
    if (!prop) return '';
    const amount = Number(prop.price_per_fraction || 0) * (prop.total_fractions || 1);
    return amount > 0 ? formatPrice(amount) : 'Price on Request';
  };

  if (slides.length === 0) {
    return null;
  }

  // --- DESKTOP LAYOUT ---
  if (isDesktop) {
    const activeSlide = slides[activeIndex];

    return (
      <View style={[desktopStyles.container]}>
        <View style={desktopStyles.sliderWrapper}>
          {/* Main Background Image */}
          <Image source={{ uri: getImg(activeSlide) }} style={StyleSheet.absoluteFill} contentFit="cover" />
          
          {/* Gradient Overlay for Text Readability - Only over the left content */}
          <LinearGradient 
            colors={['rgba(255, 255, 255, 1)', 'rgba(255, 255, 255, 0.85)', 'rgba(255, 255, 255, 0)']} 
            locations={[0, 0.45, 0.6]}
            start={{ x: 0, y: 0 }} 
            end={{ x: 1, y: 0 }} 
            style={StyleSheet.absoluteFill} 
          />
          {/* Subtle dark gradient at the very bottom right for thumbnail/video button contrast */}
          <LinearGradient 
            colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.4)']} 
            locations={[0.7, 1]}
            start={{ x: 0, y: 0 }} 
            end={{ x: 0, y: 1 }} 
            style={StyleSheet.absoluteFill} 
          />

          <View style={desktopStyles.contentContainer}>
            {/* Left Content */}
            <View style={desktopStyles.leftContent}>
              <View style={desktopStyles.badge}>
                <Ionicons name="star" size={14} color={Neutrals.white} style={{ marginRight: 6 }} />
                <Text style={desktopStyles.badgeText}>FEATURED PROPERTY</Text>
              </View>
              
              <Text style={desktopStyles.propertyType}>
                {(activeSlide.property_type || activeSlide.sub_type || 'LUXURY VILLA').toUpperCase()}
              </Text>
              
              <Text style={desktopStyles.mainTitle}>
                {activeSlide.title}
              </Text>

              <View style={desktopStyles.locationRow}>
                <Ionicons name="location" size={20} color="#E11D48" />
                <Text style={desktopStyles.locationText}>{activeSlide.locality}, {activeSlide.district}</Text>
              </View>

              <Text style={desktopStyles.description} numberOfLines={3}>
                {activeSlide.description || "A perfect blend of modern architecture, premium amenities and serene surroundings for an elevated lifestyle."}
              </Text>

              <View style={desktopStyles.amenitiesPanel}>
                <View style={desktopStyles.amenityItem}>
                  <View style={desktopStyles.amenityTopRow}>
                    <Ionicons name="bed-outline" size={20} color={Neutrals.obsidian} />
                    <Text style={desktopStyles.amenityValue}>{activeSlide.bedrooms || 4}</Text>
                  </View>
                  <Text style={desktopStyles.amenityLabel}>Bedrooms</Text>
                </View>
                <View style={desktopStyles.amenityItem}>
                  <View style={desktopStyles.amenityTopRow}>
                    <Ionicons name="water-outline" size={20} color={Neutrals.obsidian} />
                    <Text style={desktopStyles.amenityValue}>{activeSlide.bathrooms || 4}</Text>
                  </View>
                  <Text style={desktopStyles.amenityLabel}>Bathrooms</Text>
                </View>
                <View style={desktopStyles.amenityItem}>
                  <View style={desktopStyles.amenityTopRow}>
                    <Ionicons name="car-outline" size={20} color={Neutrals.obsidian} />
                    <Text style={desktopStyles.amenityValue}>2</Text>
                  </View>
                  <Text style={desktopStyles.amenityLabel}>Parking</Text>
                </View>
                <View style={desktopStyles.amenityItem}>
                  <View style={desktopStyles.amenityTopRow}>
                    <Ionicons name="business-outline" size={20} color={Neutrals.obsidian} />
                    <Text style={desktopStyles.amenityValue}>2</Text>
                  </View>
                  <Text style={desktopStyles.amenityLabel}>Floors</Text>
                </View>
                <View style={[desktopStyles.amenityItem, { borderRightWidth: 0 }]}>
                  <View style={desktopStyles.amenityTopRow}>
                    <Ionicons name="expand-outline" size={20} color={Neutrals.obsidian} />
                    <Text style={desktopStyles.amenityValue}>{activeSlide.area_sqft || '3,200'}</Text>
                  </View>
                  <Text style={desktopStyles.amenityLabel}>Sq.Ft.</Text>
                </View>
              </View>

              <View style={desktopStyles.pricePanel}>
                <View style={desktopStyles.priceInfo}>
                  <Text style={desktopStyles.priceAmount}>{getPriceDisplay(activeSlide)}</Text>
                  <Text style={desktopStyles.priceSub}>
                    {activeSlide.price_per_sqft ? `₹${activeSlide.price_per_sqft.toLocaleString('en-IN')} per Sq.Ft.` : 'Premium Segment'}
                  </Text>
                </View>
                <TouchableOpacity style={desktopStyles.contactBtn} onPress={() => router.push(`/property/${activeSlide.id}` as any)}>
                  <Text style={desktopStyles.contactBtnText}>Contact Agent</Text>
                  <Ionicons name="arrow-forward" size={18} color={Neutrals.obsidian} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Right Thumbnails */}
            <View style={desktopStyles.rightThumbnails}>
              {activeSlide.images?.slice(0, 4).map((img: any, i: number) => {
                const raw = typeof img === 'string' ? img : (img?.image_url || '');
                const isLast = i === 3;
                const remaining = (activeSlide.images?.length || 0) - 4;
                return (
                  <View key={i} style={desktopStyles.thumbnailWrapper}>
                    <Image source={{ uri: getFullImageUrl(raw) }} style={StyleSheet.absoluteFill} contentFit="cover" />
                    {isLast && remaining > 0 && (
                      <View style={desktopStyles.thumbnailOverlay}>
                        <Text style={desktopStyles.thumbnailOverlayText}>+{remaining}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          {/* Video Tour Button */}
          <TouchableOpacity style={desktopStyles.videoTourBtn}>
            <Ionicons name="play-circle" size={22} color={Neutrals.white} style={{ marginRight: 8 }} />
            <Text style={desktopStyles.videoTourText}>Video Tour</Text>
          </TouchableOpacity>

          {/* Left / Right Chevron Controls */}
          <TouchableOpacity onPress={handlePrev} style={[desktopStyles.floatingControlBtn, desktopStyles.floatingControlLeft]}>
            <Ionicons name="chevron-back" size={28} color={Neutrals.gray600} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleNext} style={[desktopStyles.floatingControlBtn, desktopStyles.floatingControlRight]}>
            <Ionicons name="chevron-forward" size={28} color={Neutrals.gray600} />
          </TouchableOpacity>

          {/* Pagination Dots */}
          <View style={desktopStyles.paginationDotsContainer}>
            {slides.map((_, i) => (
              <View key={i} style={[desktopStyles.paginationDot, activeIndex === i && desktopStyles.paginationDotActive]} />
            ))}
          </View>
        </View>
      </View>
    );
  }

  // --- MOBILE LAYOUT (Fallback) ---
  const activeMobileSlide = slides[activeIndex];

  return (
    <View style={styles.container}>
      <View style={{ marginBottom: 24, paddingHorizontal: 16 }}>
        <Text style={styles.mobileSuperTitle}>FEATURED PROJECTS</Text>
        <Text style={styles.mobileMainTitle}>
          Extraordinary Spaces,{'\n'}
          <Text style={{ color: GoldSystem.primaryGold }}>Real Possibilities.</Text>
        </Text>
      </View>

      <View style={[styles.slide, { marginHorizontal: 16, borderRadius: Radius.lg, overflow: 'hidden' }]}>
        <Image source={{ uri: getImg(activeMobileSlide) }} style={[StyleSheet.absoluteFill, { borderRadius: Radius.lg }]} contentFit="cover" />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.9)']} style={[StyleSheet.absoluteFill, { borderRadius: Radius.lg }]} />
        
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>FEATURED</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{activeMobileSlide.title}</Text>
          <Text style={styles.subtitle}>
            {activeMobileSlide.locality}, {activeMobileSlide.district}
          </Text>
          <Text style={styles.priceTextMobile}>{getPriceDisplay(activeMobileSlide)}</Text>
          <TouchableOpacity 
            style={styles.mobileViewBtn} 
            onPress={() => router.push(`/property/${activeMobileSlide.id}` as any)}>
            <Text style={styles.mobileViewBtnText}>View Property</Text>
            <Ionicons name="arrow-forward" size={16} color={Neutrals.obsidian} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.mobileControlsRow, { justifyContent: 'center', marginTop: 24 }]}>
        <TouchableOpacity onPress={handlePrev} style={styles.mobileControlBtn}>
          <Ionicons name="chevron-back" size={20} color={Neutrals.white} />
        </TouchableOpacity>
        <Text style={[styles.mobilePaginationText, { marginHorizontal: 16 }]}>
          <Text style={{ color: GoldSystem.primaryGold, fontWeight: '700' }}>
            {String(activeIndex + 1).padStart(2, '0')}
          </Text>
          {' '}/ {String(slides.length).padStart(2, '0')}
        </Text>
        <TouchableOpacity onPress={handleNext} style={[styles.mobileControlBtn, { backgroundColor: Neutrals.gray200 }]}>
          <Ionicons name="chevron-forward" size={20} color={Neutrals.obsidian} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 0,
    marginTop: 24,
  },
  slide: {
    height: 180,
    position: 'relative',
    ...(Platform.OS === 'web' ? { boxShadow: '0 10px 20px rgba(0,0,0,0.1)' } as any : { elevation: 5 }),
  },
  badgeContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  badgeText: {
    ...Typography.caption,
    fontWeight: 'bold',
    color: GoldSystem.primaryGold,
    letterSpacing: 1,
  },
  content: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
  },
  title: {
    ...Typography.displaySmall,
    color: Neutrals.white,
    marginBottom: 4,
  },
  subtitle: {
    ...Typography.bodyMedium,
    color: Neutrals.gray300,
    marginBottom: 12,
  },
  priceTextMobile: {
    fontSize: 24,
    fontWeight: '700',
    color: Neutrals.white,
    marginBottom: 16,
  },
  mobileSuperTitle: {
    ...Typography.labelMedium,
    color: GoldSystem.primaryGold,
    letterSpacing: 2,
    marginBottom: 8,
  },
  mobileMainTitle: {
    ...Typography.displayMedium,
    color: Neutrals.obsidian,
  },
  mobileStatsBar: {
    flexDirection: 'row',
    backgroundColor: Neutrals.white,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    justifyContent: 'space-around',
    ...(Platform.OS === 'web' ? { boxShadow: '0 8px 20px rgba(0,0,0,0.05)' } as any : { elevation: 3 }),
  },
  mobileStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mobileViewBtn: {
    backgroundColor: GoldSystem.primaryGold,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  mobileViewBtnText: {
    ...Typography.labelLarge,
    color: Neutrals.obsidian,
    fontWeight: '700',
  },
  mobileControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mobileControlBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: GoldSystem.darkGold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  mobilePaginationText: {
    ...Typography.labelLarge,
    color: Neutrals.gray400,
  },
});

const desktopStyles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 24,
    paddingHorizontal: '4%',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
  },
  sliderWrapper: {
    width: '100%',
    maxWidth: 1400,
    height: 384,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    ...(Platform.OS === 'web' ? { boxShadow: '0 20px 40px rgba(0,0,0,0.1)' } as any : { elevation: 8 }),
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 32,
    zIndex: 2,
  },
  leftContent: {
    width: '55%',
    maxWidth: 600,
    justifyContent: 'center',
  },
  badge: {
    backgroundColor: '#C59A5C',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  badgeText: {
    ...Typography.caption,
    color: Neutrals.white,
    fontWeight: '700',
    letterSpacing: 1.2,
    fontSize: 10,
  },
  propertyType: {
    ...Typography.labelSmall,
    color: Neutrals.obsidian,
    letterSpacing: 3,
    marginBottom: 4,
  },
  mainTitle: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700',
    color: '#112233',
    fontFamily: Platform.OS === 'web' ? 'Georgia, "Times New Roman", serif' : undefined,
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationText: {
    ...Typography.bodyMedium,
    color: Neutrals.obsidian,
    fontWeight: '600',
    marginLeft: 6,
  },
  description: {
    ...Typography.bodySmall,
    color: Neutrals.gray600,
    lineHeight: 20,
    marginBottom: 20,
    maxWidth: '90%',
  },
  amenitiesPanel: {
    backgroundColor: Neutrals.white,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    ...(Platform.OS === 'web' ? { boxShadow: '0 10px 20px rgba(0,0,0,0.05)' } as any : { elevation: 2 }),
  },
  amenityItem: {
    alignItems: 'center',
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: Neutrals.gray200,
  },
  amenityTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    gap: 4,
  },
  amenityValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Neutrals.obsidian,
  },
  amenityLabel: {
    fontSize: 10,
    color: Neutrals.gray500,
  },
  pricePanel: {
    backgroundColor: 'rgba(30, 30, 30, 0.85)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(10px)' } as any : {}),
  },
  priceInfo: {
    flex: 1,
  },
  priceAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#E8D4A2',
    marginBottom: 2,
  },
  priceSub: {
    fontSize: 12,
    color: '#A0A0A0',
  },
  contactBtn: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contactBtnText: {
    ...Typography.labelMedium,
    color: Neutrals.obsidian,
    fontWeight: '700',
  },
  rightThumbnails: {
    width: 100,
    justifyContent: 'space-between',
    paddingVertical: 0,
  },
  thumbnailWrapper: {
    width: '100%',
    height: 70,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    marginBottom: 8,
  },
  thumbnailOverlay: {
    ...(StyleSheet.absoluteFill as any),
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailOverlayText: {
    fontSize: 18,
    fontWeight: '700',
    color: Neutrals.white,
  },
  videoTourBtn: {
    position: 'absolute',
    bottom: 32,
    right: 150, // Just to the left of the thumbnails
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(8px)' } as any : {}),
    zIndex: 10,
  },
  videoTourText: {
    ...Typography.labelMedium,
    color: Neutrals.white,
  },
  floatingControlBtn: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Neutrals.white,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    ...(Platform.OS === 'web' ? { boxShadow: '0 4px 16px rgba(0,0,0,0.2)' } as any : { elevation: 6 }),
  },
  floatingControlLeft: {
    left: 16,
  },
  floatingControlRight: {
    right: 16,
  },
  paginationDotsContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    zIndex: 10,
  },
  paginationDot: {
    width: 12,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  paginationDotActive: {
    width: 24,
    backgroundColor: '#D4AF37',
  }
});
