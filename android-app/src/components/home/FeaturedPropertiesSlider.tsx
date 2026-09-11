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

interface FeaturedPropertiesSliderProps {
  properties: Property[];
}

export function FeaturedPropertiesSlider({ properties }: FeaturedPropertiesSliderProps) {
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
      <View style={desktopStyles.container}>
        {/* Background shape */}
        <View style={desktopStyles.bgShape} />

        <View style={desktopStyles.layoutRow}>
          
          {/* LEFT COLUMN */}
          <View style={desktopStyles.leftCol}>
            <View style={desktopStyles.headerTopRow}>
              <Text style={desktopStyles.superTitle}>FEATURED PROPERTIES</Text>
              <View style={desktopStyles.superTitleLine} />
            </View>
            
            <Text style={desktopStyles.mainTitle}>
              Extraordinary{'\n'}Spaces,{'\n'}
              <Text style={{ color: GoldSystem.primaryGold }}>Real Possibilities.</Text>
            </Text>
            
            <Text style={desktopStyles.subtitle}>
              Handpicked properties that combine lifestyle, location and long-term value.
            </Text>

            <View style={desktopStyles.controlsRow}>
              <TouchableOpacity onPress={handlePrev} style={desktopStyles.controlBtn}>
                <Ionicons name="chevron-back" size={20} color={Neutrals.white} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleNext} style={desktopStyles.controlBtnWhite}>
                <Ionicons name="chevron-forward" size={20} color={Neutrals.obsidian} />
              </TouchableOpacity>
              <Text style={desktopStyles.paginationText}>
                <Text style={{ color: GoldSystem.primaryGold, fontWeight: '700' }}>
                  {String(activeIndex + 1).padStart(2, '0')}
                </Text>
                {' '}/ {String(slides.length).padStart(2, '0')}
              </Text>
            </View>

            <View style={desktopStyles.premiumLineRow}>
              <View style={desktopStyles.verticalLine} />
              <Text style={desktopStyles.premiumText}>
                Premium Homes{'\n'}in Prime Locations
              </Text>
            </View>
          </View>

          {/* CENTER COLUMN (ACTIVE CARD STACK) */}
          <View style={desktopStyles.centerCol}>
            {[3, 2, 1, 0, -1].map((offset) => {
              if (slides.length <= offset && offset !== -1) return null;
              const idx = (activeIndex + offset + slides.length) % slides.length;
              const prop = slides[idx];

              let translateX, translateY, scale, opacity, contentOpacity;
              if (offset === -1) {
                translateX = slideAnim.interpolate({ inputRange: [-1, 0, 1], outputRange: [0, 0, 0] });
                translateY = slideAnim.interpolate({ inputRange: [-1, 0, 1], outputRange: [0, -500, -500] });
                scale = slideAnim.interpolate({ inputRange: [-1, 0, 1], outputRange: [1, 1, 1] });
                opacity = slideAnim.interpolate({ inputRange: [-1, 0, 1], outputRange: [1, 0, 0] });
                contentOpacity = slideAnim.interpolate({ inputRange: [-1, 0, 1], outputRange: [1, 0, 0] });
              } else if (offset === 0) {
                translateX = slideAnim.interpolate({ inputRange: [-1, 0, 1], outputRange: [24, 0, 0] });
                translateY = slideAnim.interpolate({ inputRange: [-1, 0, 1], outputRange: [0, 0, -500] });
                scale = slideAnim.interpolate({ inputRange: [-1, 0, 1], outputRange: [0.95, 1, 1] });
                opacity = slideAnim.interpolate({ inputRange: [-1, 0, 1], outputRange: [0.85, 1, 0] });
                contentOpacity = slideAnim.interpolate({ inputRange: [-1, 0, 1], outputRange: [0, 1, 0] });
              } else if (offset === 1) {
                translateX = slideAnim.interpolate({ inputRange: [-1, 0, 1], outputRange: [48, 24, 0] });
                translateY = slideAnim.interpolate({ inputRange: [-1, 0, 1], outputRange: [0, 0, 0] });
                scale = slideAnim.interpolate({ inputRange: [-1, 0, 1], outputRange: [0.90, 0.95, 1] });
                opacity = slideAnim.interpolate({ inputRange: [-1, 0, 1], outputRange: [0.70, 0.85, 1] });
                contentOpacity = slideAnim.interpolate({ inputRange: [-1, 0, 1], outputRange: [0, 0, 1] });
              } else if (offset === 2) {
                translateX = slideAnim.interpolate({ inputRange: [-1, 0, 1], outputRange: [48, 48, 24] });
                translateY = slideAnim.interpolate({ inputRange: [-1, 0, 1], outputRange: [0, 0, 0] });
                scale = slideAnim.interpolate({ inputRange: [-1, 0, 1], outputRange: [0.90, 0.90, 0.95] });
                opacity = slideAnim.interpolate({ inputRange: [-1, 0, 1], outputRange: [0, 0.70, 0.85] });
                contentOpacity = 0;
              } else {
                translateX = slideAnim.interpolate({ inputRange: [-1, 0, 1], outputRange: [48, 48, 48] });
                translateY = slideAnim.interpolate({ inputRange: [-1, 0, 1], outputRange: [0, 0, 0] });
                scale = slideAnim.interpolate({ inputRange: [-1, 0, 1], outputRange: [0.90, 0.90, 0.90] });
                opacity = slideAnim.interpolate({ inputRange: [-1, 0, 1], outputRange: [0, 0, 0.70] });
                contentOpacity = 0;
              }

              return (
                <Animated.View 
                  key={`${prop.id}-${offset}`} 
                  style={[
                    desktopStyles.mainCard,
                    {
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      zIndex: 10 - offset,
                      transform: [{ translateX }, { translateY }, { scale }],
                      opacity
                    }
                  ]}
                >
                  <Image source={{ uri: getImg(prop) }} style={[StyleSheet.absoluteFill, { borderRadius: 32 }]} contentFit="cover" />
                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.9)']} style={[StyleSheet.absoluteFill, { borderRadius: 32 }]} />
                  
                  <Animated.View style={[StyleSheet.absoluteFill, { opacity: contentOpacity }]}>
                    <View style={desktopStyles.mainBadge}>
                        <Ionicons name="star" size={12} color={GoldSystem.primaryGold} style={{ marginRight: 4 }} />
                        <Text style={desktopStyles.mainBadgeText}>FEATURED</Text>
                      </View>

                      <View style={desktopStyles.mainCardBottom}>
                        <View style={desktopStyles.mainCardInfo}>
                          <View style={desktopStyles.locationRow}>
                            <Ionicons name="location" size={14} color={Neutrals.white} />
                            <Text style={desktopStyles.locationText}>{prop.locality}, {prop.district}</Text>
                          </View>
                          <Text style={desktopStyles.cardTitle}>{prop.title}</Text>
                          {!!prop.description && (
                            <Text style={desktopStyles.cardDesc} numberOfLines={2}>
                              {prop.description}
                            </Text>
                          )}
                          
                          <View style={desktopStyles.amenitiesRow}>
                            {!!prop.bedrooms && <View style={desktopStyles.amenityItem}><Ionicons name="bed-outline" size={16} color={Neutrals.white}/><Text style={desktopStyles.amenityText}>{prop.bedrooms} Beds</Text></View>}
                            {!!prop.bathrooms && <View style={desktopStyles.amenityItem}><Ionicons name="water-outline" size={16} color={Neutrals.white}/><Text style={desktopStyles.amenityText}>{prop.bathrooms} Baths</Text></View>}
                            {!!prop.area_sqft && <View style={desktopStyles.amenityItem}><Ionicons name="expand-outline" size={16} color={Neutrals.white}/><Text style={desktopStyles.amenityText}>{prop.area_sqft} Sq.Ft</Text></View>}
                          </View>
                        </View>

                        <View style={desktopStyles.mainCardAction}>
                          <View style={desktopStyles.thumbRowInside}>
                            {prop.images?.slice(0, 3).map((img: any, i: number) => {
                              const raw = typeof img === 'string' ? img : (img?.image_url || '');
                              return (
                                <View key={i} style={desktopStyles.thumbWrapperInside}>
                                  <Image source={{ uri: getFullImageUrl(raw) }} style={desktopStyles.thumbImage} contentFit="cover" />
                                </View>
                              );
                            })}
                          </View>
                          <Text style={desktopStyles.priceText}>{getPriceDisplay(prop)}</Text>
                          <TouchableOpacity style={desktopStyles.viewBtn} onPress={() => router.push(`/property/${prop.id}` as any)}>
                            <Text style={desktopStyles.viewBtnText}>View Property</Text>
                            <Ionicons name="arrow-forward" size={16} color={Neutrals.obsidian} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </Animated.View>
                </Animated.View>
              );
            })}
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
        <Text style={styles.mobileSuperTitle}>FEATURED PROPERTIES</Text>
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
            style={desktopStyles.viewBtn} 
            onPress={() => router.push(`/property/${activeMobileSlide.id}` as any)}>
            <Text style={desktopStyles.viewBtnText}>View Property</Text>
            <Ionicons name="arrow-forward" size={16} color={Neutrals.obsidian} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[desktopStyles.controlsRow, { justifyContent: 'center', marginTop: 24 }]}>
        <TouchableOpacity onPress={handlePrev} style={desktopStyles.controlBtn}>
          <Ionicons name="chevron-back" size={20} color={Neutrals.white} />
        </TouchableOpacity>
        <Text style={[desktopStyles.paginationText, { marginHorizontal: 16 }]}>
          <Text style={{ color: GoldSystem.primaryGold, fontWeight: '700' }}>
            {String(activeIndex + 1).padStart(2, '0')}
          </Text>
          {' '}/ {String(slides.length).padStart(2, '0')}
        </Text>
        <TouchableOpacity onPress={handleNext} style={[desktopStyles.controlBtn, { backgroundColor: Neutrals.gray200 }]}>
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
    height: 130,
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
});

const desktopStyles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 24,
    paddingHorizontal: '4%',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#FAF8F5',
  },
  bgShape: {
    position: 'absolute',
    top: 40,
    bottom: 40,
    left: -200,
    right: '40%',
    backgroundColor: Neutrals.white,
    borderTopRightRadius: 400,
    borderBottomRightRadius: 500,
    zIndex: 0,
    ...(Platform.OS === 'web' ? { boxShadow: '20px 20px 60px rgba(0,0,0,0.03)' } as any : { elevation: 1 }),
  },
  scriptFloatingText: {
    position: 'absolute',
    top: 40,
    right: '28%',
    fontFamily: Platform.OS === 'web' ? 'cursive, "Brush Script MT", "Comic Sans MS"' : undefined,
    fontStyle: 'italic',
    fontSize: 36,
    color: GoldSystem.darkGold,
    transform: [{ rotate: '-5deg' }],
    zIndex: 1,
  },
  layoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
    minHeight: 220,
  },
  leftCol: {
    width: '35%',
    paddingRight: 24,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  superTitle: {
    ...Typography.labelMedium,
    color: GoldSystem.darkGold,
    letterSpacing: 2,
    marginRight: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  superTitleLine: {
    height: 1,
    backgroundColor: GoldSystem.primaryGold,
    flex: 1,
    opacity: 0.5,
  },
  mainTitle: {
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '700',
    color: Neutrals.obsidian,
    marginBottom: 16,
    fontFamily: Platform.OS === 'web' ? 'Georgia, "Times New Roman", serif' : undefined,
  },
  subtitle: {
    ...Typography.bodyLarge,
    color: Neutrals.gray600,
    marginBottom: 24,
    lineHeight: 24,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  controlBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: GoldSystem.darkGold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  controlBtnWhite: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Neutrals.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 24,
    ...(Platform.OS === 'web' ? { boxShadow: '0 4px 12px rgba(0,0,0,0.08)' } as any : { elevation: 2 }),
  },
  paginationText: {
    ...Typography.labelLarge,
    color: Neutrals.gray400,
  },
  premiumLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  verticalLine: {
    width: 2,
    height: 40,
    backgroundColor: GoldSystem.primaryGold,
    marginRight: 16,
  },
  premiumText: {
    ...Typography.bodyMedium,
    color: Neutrals.gray600,
    fontWeight: '500',
  },
  thumbRowInside: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    alignSelf: 'flex-end',
  },
  thumbWrapperInside: {
    width: 60,
    height: 48,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: Neutrals.white,
    ...(Platform.OS === 'web' ? { boxShadow: '0 4px 8px rgba(0,0,0,0.2)' } as any : { elevation: 3 }),
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  
  centerCol: {
    width: '62%',
    height: 260,
    justifyContent: 'center',
  },
  mainCard: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    overflow: 'hidden',
    position: 'relative',
    ...(Platform.OS === 'web' ? { boxShadow: '0 24px 48px rgba(0,0,0,0.25)' } as any : { elevation: 10 }),
  },
  mainBadge: {
    position: 'absolute',
    top: 24,
    left: 24,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  mainBadgeText: {
    ...Typography.caption,
    color: Neutrals.white,
    fontWeight: '700',
    letterSpacing: 1,
  },
  playBtn: {
    position: 'absolute',
    right: 32,
    top: '50%',
    transform: [{ translateY: -40 }],
    alignItems: 'center',
  },
  playBtnCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(4px)' } as any : {}),
  },
  playText: {
    ...Typography.caption,
    color: Neutrals.white,
    marginTop: 8,
    fontWeight: '600',
  },
  mainCardBottom: {
    position: 'absolute',
    bottom: 32,
    left: 32,
    right: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  mainCardInfo: {
    flex: 1,
    paddingRight: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    ...Typography.labelMedium,
    color: Neutrals.gray200,
    marginLeft: 4,
  },
  cardTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: Neutrals.white,
    marginBottom: 8,
  },
  cardDesc: {
    ...Typography.bodyMedium,
    color: Neutrals.gray300,
    marginBottom: 20,
  },
  amenitiesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  amenityText: {
    ...Typography.labelMedium,
    color: Neutrals.white,
  },
  mainCardAction: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 28,
    fontWeight: '700',
    color: Neutrals.white,
    marginBottom: 16,
  },
  viewBtn: {
    backgroundColor: GoldSystem.primaryGold,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewBtnText: {
    ...Typography.labelLarge,
    color: Neutrals.obsidian,
    fontWeight: '700',
  },
  
  rightCol: {
    width: '23%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  cascadeCard: {
    width: '30%',
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    ...(Platform.OS === 'web' ? { boxShadow: '0 12px 24px rgba(0,0,0,0.2)' } as any : { elevation: 6 }),
  },
  cascadeContent: {
    position: 'absolute',
    top: 24,
    left: 12,
    right: 12,
  },
  cascadeTitle: {
    ...Typography.labelMedium,
    color: Neutrals.white,
    marginBottom: 4,
  },
  cascadeLocation: {
    ...Typography.caption,
    color: Neutrals.gray300,
  },
  cascadeArrowBtn: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  statsBar: {
    flexDirection: 'row',
    backgroundColor: Neutrals.white,
    borderRadius: 24,
    padding: 32,
    marginTop: 64,
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
    ...(Platform.OS === 'web' ? { boxShadow: '0 12px 30px rgba(0,0,0,0.05)' } as any : { elevation: 4 }),
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Neutrals.gray200,
  },
  statVal: {
    fontSize: 24,
    fontWeight: '700',
    color: Neutrals.obsidian,
  },
  statLabel: {
    ...Typography.caption,
    color: Neutrals.gray500,
    marginTop: 2,
  },
  statFooterDesc: {
    ...Typography.labelMedium,
    color: Neutrals.gray600,
    lineHeight: 20,
  },
});
