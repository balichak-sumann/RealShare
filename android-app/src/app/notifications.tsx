import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Neutrals, GoldSystem, Typography, Radius } from '@/constants/design';
import { auth } from '@/lib/firebase';

interface Notification {
  id: string;
  title: string;
  body: string;
  audience: string;
  created_at: string;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setError(null);
      const user = auth.currentUser;
      if (!user) {
        setError('Please sign in to view notifications.');
        setLoading(false);
        return;
      }
      const token = await user.getIdToken();
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com'}/api/notifications/feed`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
      } else if (res.status === 401) {
        setError('Session expired. Please sign in again.');
      } else {
        setError('Failed to load notifications.');
      }
    } catch (err) {
      console.warn('Failed to fetch notifications:', err);
      setError('Network error — could not load notifications.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const getIcon = (audience: string) => {
    switch (audience) {
      case 'investors': return '📈';
      case 'agents': return '🤝';
      case 'builders': return '🏗️';
      default: return '🔔';
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={GoldSystem.primaryGold} />
          <Text style={styles.loadingText}>Loading notifications…</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchNotifications}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyIcon}>🔔</Text>
          <Text style={styles.emptyTitle}>No notifications yet</Text>
          <Text style={styles.emptyDesc}>When there are updates, you'll see them here.</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GoldSystem.primaryGold} />
          }
        >
          {notifications.map((notification) => (
            <View key={notification.id} style={styles.notificationCard}>
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>{getIcon(notification.audience)}</Text>
              </View>
              <View style={styles.infoContainer}>
                <View style={styles.titleRow}>
                  <Text style={styles.title} numberOfLines={1}>{notification.title}</Text>
                  <Text style={styles.time}>{formatTime(notification.created_at)}</Text>
                </View>
                <Text style={styles.desc}>{notification.body}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
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
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    ...Typography.bodyMedium,
    color: Neutrals.gray500,
    marginTop: 12,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    ...Typography.bodyLarge,
    color: Neutrals.gray600,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: GoldSystem.primaryGold,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: Radius.md,
  },
  retryText: {
    ...Typography.labelLarge,
    color: Neutrals.obsidian,
    fontWeight: '700',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
    marginBottom: 8,
  },
  emptyDesc: {
    ...Typography.bodyMedium,
    color: Neutrals.gray500,
    textAlign: 'center',
  },
  notificationCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: Neutrals.surface,
    borderBottomWidth: 1,
    borderBottomColor: Neutrals.border,
    alignItems: 'flex-start',
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
});
