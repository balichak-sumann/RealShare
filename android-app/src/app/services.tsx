import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';
import { LinearGradient } from 'expo-linear-gradient';

const SERVICES = [
  { id: '1', title: 'Packers & Movers', image: 'https://images.unsplash.com/photo-1600518464441-9154a4dea21b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', desc: 'Verified professionals for a hassle-free move.', price: 'Starts ₹3,500' },
  { id: '2', title: 'Interior Design', image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', desc: 'Premium design consultations and execution.', price: 'Free Consultation' },
  { id: '3', title: 'Legal Assistance', image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', desc: 'Title checks, drafting, and registration.', price: 'Starts ₹4,999' },
  { id: '4', title: 'Deep Cleaning', image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', desc: 'Pre-move in deep cleaning services.', price: 'Starts ₹1,200' },
  { id: '5', title: 'Property Mgmt', image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', desc: 'Full lifecycle tenant & property management.', price: 'Starts ₹800/mo' },
  { id: '6', title: 'Painting', image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', desc: 'Professional painting services.', price: 'Get a Quote' },
];

export default function ServicesScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Home Services</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        
        {/* Banner */}
        <LinearGradient colors={GoldSystem.goldGradient} style={styles.banner}>
          <Text style={styles.bannerTitle}>RealShare Concierge</Text>
          <Text style={styles.bannerDesc}>End-to-end services to make your house a home.</Text>
          <TouchableOpacity style={styles.bannerBtn}>
            <Text style={styles.bannerBtnText}>Talk to an Expert</Text>
          </TouchableOpacity>
        </LinearGradient>

        <Text style={styles.sectionTitle}>Browse Services</Text>
        
        <View style={styles.servicesGrid}>
          {SERVICES.map(service => (
            <TouchableOpacity key={service.id} style={styles.serviceCard} activeOpacity={0.9}>
              <ImageBackground 
                source={{ uri: service.image }} 
                style={styles.serviceImage}
              >
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.8)']}
                  style={styles.imageGradient}
                />
              </ImageBackground>
              <View style={styles.serviceContent}>
                <Text style={styles.serviceTitle}>{service.title}</Text>
                <Text style={styles.serviceDesc}>{service.desc}</Text>
                <View style={{ flex: 1 }} />
                <View style={styles.serviceFooter}>
                  <Text style={styles.servicePrice}>{service.price}</Text>
                  <Text style={styles.arrowIcon}>→</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Neutrals.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 50,
    backgroundColor: Neutrals.surface,
    borderBottomWidth: 1,
    borderBottomColor: Neutrals.border,
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  backIcon: {
    fontSize: 24,
    color: Neutrals.obsidian,
  },
  headerTitle: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  banner: {
    padding: 24,
    borderRadius: Radius.lg,
    marginBottom: 32,
    ...Shadows.strong,
  },
  bannerTitle: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
    marginBottom: 8,
  },
  bannerDesc: {
    ...Typography.bodyMedium,
    color: Neutrals.obsidian,
    opacity: 0.9,
    marginBottom: 20,
    maxWidth: '80%',
  },
  bannerBtn: {
    backgroundColor: Neutrals.obsidian,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  bannerBtnText: {
    ...Typography.labelMedium,
    color: Neutrals.surface,
  },
  sectionTitle: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
    marginBottom: 16,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  serviceCard: {
    width: '47.5%',
    backgroundColor: Neutrals.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Neutrals.border,
    minHeight: 220,
    ...Shadows.soft,
    overflow: 'hidden',
  },
  serviceImage: {
    width: '100%',
    height: 100,
    justifyContent: 'flex-end',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  serviceContent: {
    padding: 12,
    flex: 1,
  },
  serviceTitle: {
    ...Typography.labelLarge,
    color: Neutrals.obsidian,
    marginBottom: 4,
  },
  serviceDesc: {
    ...Typography.caption,
    color: Neutrals.gray600,
    marginBottom: 12,
    lineHeight: 16,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Neutrals.border,
  },
  servicePrice: {
    ...Typography.caption,
    color: GoldSystem.primaryGold,
    fontWeight: '700',
    fontSize: 11,
  },
  arrowIcon: {
    color: Neutrals.gray400,
    fontSize: 16,
  },
});
