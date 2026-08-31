import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Neutrals, GoldSystem, Typography, Radius } from '@/constants/design';

const MOCK_NOTIFICATIONS = [
  { id: '1', type: 'offer', title: 'New Offer Received!', desc: 'Someone offered ₹1.45 Cr for your property in Jubilee Hills.', time: '10m ago', read: false },
  { id: '2', type: 'update', title: 'Construction Update', desc: 'New photos added for Skyline Apartments (Plinth Level).', time: '2h ago', read: false },
  { id: '3', type: 'system', title: 'Welcome to RealShare Premium', desc: 'Explore the new AI assistant and property tools.', time: '1d ago', read: true },
  { id: '4', type: 'alert', title: 'Price Drop Alert', desc: 'A property in your Dream Home shortlist dropped by 5%.', time: '2d ago', read: true },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'offer': return '💰';
      case 'update': return '🏗️';
      case 'alert': return '📉';
      default: return '👋';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={markAllRead}>
          <Text style={styles.markReadText}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        {notifications.map(notification => (
          <TouchableOpacity 
            key={notification.id} 
            style={[styles.notificationCard, !notification.read && styles.notificationUnread]}
          >
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>{getIcon(notification.type)}</Text>
            </View>
            <View style={styles.infoContainer}>
              <View style={styles.titleRow}>
                <Text style={[styles.title, !notification.read && styles.titleUnread]}>{notification.title}</Text>
                <Text style={styles.time}>{notification.time}</Text>
              </View>
              <Text style={styles.desc}>{notification.desc}</Text>
            </View>
            {!notification.read && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        ))}
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
  markReadText: {
    ...Typography.labelMedium,
    color: GoldSystem.primaryGold,
  },
  content: {
    flex: 1,
  },
  notificationCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: Neutrals.surface,
    borderBottomWidth: 1,
    borderBottomColor: Neutrals.border,
    alignItems: 'flex-start',
  },
  notificationUnread: {
    backgroundColor: GoldSystem.paleGold,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: Neutrals.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  icon: {
    fontSize: 24,
  },
  infoContainer: {
    flex: 1,
    marginRight: 8,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    ...Typography.labelLarge,
    color: Neutrals.obsidian,
    flex: 1,
  },
  titleUnread: {
    fontWeight: '700',
  },
  time: {
    ...Typography.caption,
    color: Neutrals.gray500,
  },
  desc: {
    ...Typography.bodyMedium,
    color: Neutrals.gray600,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: GoldSystem.primaryGold,
    marginTop: 6,
  },
});
