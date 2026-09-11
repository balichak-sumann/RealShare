import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Platform, TouchableOpacity, useWindowDimensions } from 'react-native';
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
  
  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % slides.length);
  };
  
  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

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
    
    const getNextIndices = () => {
      if (slides.length <= 1) return [];
      if (slides.length === 2) return [(activeIndex + 1) % slides.length];
      if (slides.length === 3) return [(activeIndex + 1) % slides.length, (activeIndex + 2) % slides.length];
      return [
        (activeIndex + 1) % slides.length,
        (activeIndex + 2) % slides.length,
        (activeIndex + 3) % slides.length
      ];
    };
    const nextIndices = getNextIndices();

    return (
      <View style={desktopStyles.container}>
        {/* Background shape */}
        <View style={desktopStyles.bgShape} />

        {/* Script floating text */}
        <Text style={desktopStyles.scriptFloatingText}>
          Find More{'\n'}Than a Home
        </Text>

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

            {/* Thumbnail previews */}
            <View style={desktopStyles.thumbRow}>
              {activeSlide.images?.slice(0, 3).map((img: any, i: number) => {
                const raw = typeof img === 'string' ? img : (img?.image_url || '');
                return (
                  <View key={i} style={desktopStyles.thumbWrapper}>
                    <Image source={{ uri: getFullImageUrl(raw) }} style={desktopStyles.thumbImage} contentFit="cover" />
                  </View>
                );
              })}
            </View>
          </View>

          {/* CENTER COLUMN (ACTIVE CARD) */}
          <View style={desktopStyles.centerCol}>
            <View style={desktopStyles.mainCard}>
              <Image source={{ uri: getImg(activeSlide) }} style={StyleSheet.absoluteFill} contentFit="cover" />
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.9)']} style={StyleSheet.absoluteFill} />
              
              <View style={desktopStyles.mainBadge}>
                <Ionicons name="star" size={12} color={GoldSystem.primaryGold} style={{ marginRight: 4 }} />
                <Text style={desktopStyles.mainBadgeText}>FEATURED</Text>
              </View>

              <TouchableOpacity style={desktopStyles.playBtn}>
                <View style={desktopStyles.playBtnCircle}>
                  <Ionicons name="play" size={24} color={Neutrals.white} style={{ marginLeft: 4 }} />
                </View>
                <Text style={desktopStyles.playText}>Watch Tour</Text>
              </TouchableOpacity>

              <View style={desktopStyles.mainCardBottom}>
                <View style={desktopStyles.mainCardInfo}>
                  <View style={desktopStyles.locationRow}>
                    <Ionicons name="location" size={14} color={Neutrals.white} />
                    <Text style={desktopStyles.locationText}>{activeSlide.locality}, {activeSlide.district}</Text>
                  </View>
                  <Text style={desktopStyles.cardTitle}>{activeSlide.title}</Text>
                  <Text style={desktopStyles.cardDesc} numberOfLines={2}>
                    A stunning property with world-class amenities and breathtaking views.
                  </Text>
                  
                  <View style={desktopStyles.amenitiesRow}>
                    <View style={desktopStyles.amenityItem}><Ionicons name="bed-outline" size={16} color={Neutrals.white}/><Text style={desktopStyles.amenityText}>{activeSlide.bedrooms || 3} Beds</Text></View>
                    <View style={desktopStyles.amenityItem}><Ionicons name="water-outline" size={16} color={Neutrals.white}/><Text style={desktopStyles.amenityText}>{activeSlide.bathrooms || 3} Baths</Text></View>
                    <View style={desktopStyles.amenityItem}><Ionicons name="expand-outline" size={16} color={Neutrals.white}/><Text style={desktopStyles.amenityText}>{activeSlide.area_sqft || 2500} Sq.Ft</Text></View>
                  </View>
                </View>

                <View style={desktopStyles.mainCardAction}>
                  <Text style={desktopStyles.priceText}>{getPriceDisplay(activeSlide)}</Text>
                  <TouchableOpacity style={desktopStyles.viewBtn} onPress={() => router.push(`/property/${activeSlide.id}` as any)}>
                    <Text style={desktopStyles.viewBtnText}>View Property</Text>
                    <Ionicons name="arrow-forward" size={16} color={Neutrals.obsidian} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* RIGHT COLUMN (CASCADING CARDS) */}
          <View style={desktopStyles.rightCol}>
            {nextIndices.map((idx, offset) => {
              const prop = slides[idx];
              const hPercent = 95 - (offset * 15); // 95%, 80%, 65%
              return (
                <View key={prop.id} style={[desktopStyles.cascadeCard, { height: `${hPercent}%` }]}>
                  <Image source={{ uri: getImg(prop) }} style={StyleSheet.absoluteFill} contentFit="cover" />
                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={StyleSheet.absoluteFill} />
                  
                  <View style={desktopStyles.cascadeContent}>
                    <Text style={desktopStyles.cascadeTitle} numberOfLines={2}>{prop.title}</Text>
                    <Text style={desktopStyles.cascadeLocation} numberOfLines={1}>{prop.locality}</Text>
                  </View>

                  <TouchableOpacity style={desktopStyles.cascadeArrowBtn} onPress={() => setActiveIndex(idx)}>
                    <Ionicons name="arrow-forward" size={16} color={Neutrals.white} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>

        {/* BOTTOM STATS BAR */}
        <View style={desktopStyles.statsBar}>
          <View style={desktopStyles.statItem}>
            <Ionicons name="people" size={24} color={GoldSystem.primaryGold} style={{ marginRight: 12 }} />
            <View>
              <Text style={desktopStyles.statVal}>1000+</Text>
              <Text style={desktopStyles.statLabel}>Happy Families</Text>
            </View>
          </View>
          <View style={desktopStyles.statDivider} />
          
          <View style={desktopStyles.statItem}>
            <Ionicons name="location" size={24} color={GoldSystem.primaryGold} style={{ marginRight: 12 }} />
            <View>
              <Text style={desktopStyles.statVal}>20+</Text>
              <Text style={desktopStyles.statLabel}>Prime Locations</Text>
            </View>
          </View>
          <View style={desktopStyles.statDivider} />

          <View style={desktopStyles.statItem}>
            <Ionicons name="home" size={24} color={GoldSystem.primaryGold} style={{ marginRight: 12 }} />
            <View>
              <Text style={desktopStyles.statVal}>500+</Text>
              <Text style={desktopStyles.statLabel}>Properties Listed</Text>
            </View>
          </View>
          <View style={desktopStyles.statDivider} />

          <View style={desktopStyles.statItem}>
            <Ionicons name="star" size={24} color={GoldSystem.primaryGold} style={{ marginRight: 12 }} />
            <View>
              <Text style={desktopStyles.statVal}>4.8/5</Text>
              <Text style={desktopStyles.statLabel}>Customer Rating</Text>
            </View>
          </View>
          <View style={desktopStyles.statDivider} />

          <View style={[desktopStyles.statItem, { flex: 1.2 }]}>
            <Text style={desktopStyles.statFooterDesc}>
              <Text style={{ fontWeight: '700' }}>More Than Properties.</Text>{'\n'}Better Lives.
            </Text>
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
        <Image source={{ uri: getImg(activeMobileSlide) }} style={StyleSheet.absoluteFill} contentFit="cover" />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.9)']} style={StyleSheet.absoluteFill} />
        
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

      {/* Mobile Stats Bar (Stacked) */}
      <View style={styles.mobileStatsBar}>
        <View style={styles.mobileStatItem}>
          <Ionicons name="people" size={24} color={GoldSystem.primaryGold} style={{ marginRight: 12 }} />
          <View>
            <Text style={desktopStyles.statVal}>1000+</Text>
            <Text style={desktopStyles.statLabel}>Happy Families</Text>
          </View>
        </View>
        <View style={styles.mobileStatItem}>
          <Ionicons name="home" size={24} color={GoldSystem.primaryGold} style={{ marginRight: 12 }} />
          <View>
            <Text style={desktopStyles.statVal}>500+</Text>
            <Text style={desktopStyles.statLabel}>Properties Listed</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 48,
    marginTop: 24,
  },
  slide: {
    height: 450,
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
    paddingVertical: 64,
    paddingHorizontal: '4%',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#FAF8F5',
  },
  bgShape: {
    position: 'absolute',
    top: 40,
    bottom: 120,
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
    height: 560,
  },
  leftCol: {
    width: '28%',
    paddingRight: 24,
    justifyContent: 'center',
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
    fontSize: 46,
    lineHeight: 52,
    fontWeight: '700',
    color: Neutrals.obsidian,
    marginBottom: 24,
    fontFamily: Platform.OS === 'web' ? 'Georgia, "Times New Roman", serif' : undefined,
  },
  subtitle: {
    ...Typography.bodyLarge,
    color: Neutrals.gray600,
    marginBottom: 40,
    lineHeight: 24,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 48,
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
    marginBottom: 24,
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
  thumbRow: {
    flexDirection: 'row',
    gap: 12,
  },
  thumbWrapper: {
    width: 72,
    height: 90,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: GoldSystem.primaryGold,
    ...(Platform.OS === 'web' ? { boxShadow: '0 4px 8px rgba(0,0,0,0.1)' } as any : { elevation: 2 }),
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  
  centerCol: {
    width: '46%',
    height: '100%',
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
