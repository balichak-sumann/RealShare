import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Neutrals, GoldSystem, Typography, Radius } from '@/constants/design';

export default function SettingsScreen() {
  const router = useRouter();

  const SETTINGS_SECTIONS = [
    {
      title: 'Preferences',
      items: [
        { id: '1', title: 'Push Notifications', type: 'toggle', value: true },
        { id: '2', title: 'Email Alerts', type: 'toggle', value: false },
        { id: '3', title: 'Dark Mode', type: 'toggle', value: false },
      ]
    },
    {
      title: 'Security',
      items: [
        { id: '4', title: 'Change Password', type: 'link' },
        { id: '5', title: 'Two-Factor Authentication', type: 'link' },
        { id: '6', title: 'Biometric Login', type: 'toggle', value: true },
      ]
    },
    {
      title: 'Support & Legal',
      items: [
        { id: '7', title: 'Help Center', type: 'link' },
        { id: '8', title: 'Privacy Policy', type: 'link' },
        { id: '9', title: 'Terms of Service', type: 'link' },
      ]
    }
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {SETTINGS_SECTIONS.map((section, idx) => (
          <View key={idx} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, itemIdx) => (
                <View key={item.id}>
                  <TouchableOpacity style={styles.settingItem} disabled={item.type === 'toggle'}>
                    <Text style={styles.settingTitle}>{item.title}</Text>
                    {item.type === 'toggle' ? (
                      <Switch 
                        value={item.value} 
                        trackColor={{ false: Neutrals.gray300, true: GoldSystem.primaryGold }}
                        thumbColor={Neutrals.surface}
                      />
                    ) : (
                      <Text style={styles.arrowIcon}>→</Text>
                    )}
                  </TouchableOpacity>
                  {itemIdx < section.items.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.logoutBtn}>
          <Text style={styles.logoutBtnText}>Log Out</Text>
        </TouchableOpacity>

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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...Typography.labelMedium,
    color: Neutrals.gray500,
    marginBottom: 12,
    paddingHorizontal: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionCard: {
    backgroundColor: Neutrals.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Neutrals.border,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingTitle: {
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
    marginLeft: 16,
  },
  logoutBtn: {
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  logoutBtnText: {
    ...Typography.labelLarge,
    color: '#EF4444', // Red for destructive action
  },
});
