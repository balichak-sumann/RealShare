import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';
import { useUser } from '@/contexts/UserContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile } = useUser();

  const QUICK_LINKS = [
    { id: '1', title: 'Edit Profile', icon: '✏️', route: '/edit-profile' },
    { id: '2', title: 'My Properties', icon: '🏠', route: '/owner-dashboard' },
    { id: '3', title: 'Saved Searches', icon: '🔍', route: '/saved-searches' },
    { id: '4', title: 'Payment History', icon: '💳', route: '/payments' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity onPress={() => router.push('/settings' as any)}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{profile?.full_name?.charAt(0) || 'U'}</Text>
          </View>
          <Text style={styles.name}>{profile?.full_name || 'User'}</Text>
          <Text style={styles.phone}>{profile?.phone_number || '+91 - Add Phone'}</Text>
          <Text style={styles.email}>{profile?.email || 'user@example.com'}</Text>
          
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>Premium Member</Text>
          </View>
        </View>

        {/* RealShare Elite Banner */}
        <LinearGradient colors={GoldSystem.goldGradient} style={styles.eliteBanner}>
          <View style={styles.eliteContent}>
            <Text style={styles.eliteTitle}>RealShare Elite</Text>
            <Text style={styles.eliteDesc}>You have 12,500 points available.</Text>
          </View>
          <TouchableOpacity 
            style={styles.eliteBtn}
            onPress={() => router.push('/rewards' as any)}
          >
            <Text style={styles.eliteBtnText}>Redeem</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Quick Links */}
        <View style={styles.linksContainer}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.linksCard}>
            {QUICK_LINKS.map((link, idx) => (
              <View key={link.id}>
                <TouchableOpacity 
                  style={styles.linkItem}
                  onPress={() => {
                    if (link.route === '/owner-dashboard') {
                      router.push(link.route as any);
                    } else {
                      alert('Coming soon!');
                    }
                  }}
                >
                  <View style={styles.linkLeft}>
                    <Text style={styles.linkIcon}>{link.icon}</Text>
                    <Text style={styles.linkTitle}>{link.title}</Text>
                  </View>
                  <Text style={styles.arrowIcon}>→</Text>
                </TouchableOpacity>
                {idx < QUICK_LINKS.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
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
  settingsIcon: {
    fontSize: 24,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  profileCard: {
    backgroundColor: Neutrals.surface,
    borderRadius: Radius.lg,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Neutrals.border,
    marginBottom: 24,
    ...Shadows.soft,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Neutrals.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: GoldSystem.primaryGold,
  },
  avatarText: {
    ...Typography.displayMedium,
    color: GoldSystem.primaryGold,
  },
  name: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
    marginBottom: 4,
  },
  phone: {
    ...Typography.bodyMedium,
    color: Neutrals.gray600,
    marginBottom: 2,
  },
  email: {
    ...Typography.bodyMedium,
    color: Neutrals.gray600,
    marginBottom: 16,
  },
  badgeContainer: {
    backgroundColor: Neutrals.obsidian,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  badgeText: {
    ...Typography.caption,
    color: GoldSystem.primaryGold,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  eliteBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: Radius.lg,
    marginBottom: 32,
    ...Shadows.strong,
  },
  eliteContent: {
    flex: 1,
  },
  eliteTitle: {
    ...Typography.labelLarge,
    color: Neutrals.obsidian,
    marginBottom: 4,
  },
  eliteDesc: {
    ...Typography.caption,
    color: Neutrals.obsidian,
    opacity: 0.8,
  },
  eliteBtn: {
    backgroundColor: Neutrals.obsidian,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
  },
  eliteBtnText: {
    ...Typography.labelMedium,
    color: Neutrals.surface,
  },
  linksContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
    marginBottom: 16,
  },
  linksCard: {
    backgroundColor: Neutrals.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Neutrals.border,
    overflow: 'hidden',
    ...Shadows.soft,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  linkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  linkTitle: {
    ...Typography.bodyLarge,
    color: Neutrals.obsidian,
  },
  arrowIcon: {
    fontSize: 20,
    color: Neutrals.gray400,
  },
  divider: {
    height: 1,
    backgroundColor: Neutrals.border,
    marginLeft: 48,
  },
});
