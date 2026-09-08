import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '@/hooks/useResponsive';

export function PostPropertyBanner() {
  const router = useRouter();
  const { isDesktop } = useResponsive();

  return (
    <View style={[styles.container, isDesktop && styles.containerDesktop]}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="home" size={24} color={GoldSystem.primaryGold} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Sell or Rent Properties for Free</Text>
          <Text style={styles.subtitle}>List your property on RealShare and connect with millions of buyers and tenants instantly.</Text>
        </View>
      </View>
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => router.push('/sell')}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>Post Property Now</Text>
        <Ionicons name="arrow-forward" size={16} color={Neutrals.surface} style={styles.buttonIcon} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 8,
    padding: 20,
    backgroundColor: '#FFF8F0', // Very light gold/orange tint
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#FFE4C4',
    ...Shadows.soft,
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: 16,
  },
  containerDesktop: {
    marginHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...Typography.titleMedium,
    color: Neutrals.obsidian,
    marginBottom: 4,
  },
  subtitle: {
    ...Typography.bodyMedium,
    color: Neutrals.textSecondary,
  },
  button: {
    backgroundColor: GoldSystem.primaryGold,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: Radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  buttonText: {
    ...Typography.labelMedium,
    color: Neutrals.surface,
  },
  buttonIcon: {
    marginLeft: 8,
  },
});
