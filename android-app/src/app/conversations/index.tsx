import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { auth } from '@/lib/firebase';
import { useUser } from '@/contexts/UserContext';
import { getSocket } from '@/lib/socket';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';

interface ConversationRow {
  id: string;
  type: 'advisor' | 'support' | 'property_inquiry';
  context_label: string | null;
  updated_at: string;
  last_message: { body: string; created_at: string; sender_id: string } | null;
  unread: boolean;
  staff_unclaimed: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  advisor: 'Advisor',
  support: 'Support',
  property_inquiry: 'Property',
};

const TYPE_COLORS: Record<string, string> = {
  advisor: GoldSystem.primaryGold,
  support: '#3B82F6',
  property_inquiry: '#059669',
};

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'now';
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function ConversationsInboxScreen() {
  const router = useRouter();
  const { profile } = useUser();
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isStaff = profile?.role === 'admin' || profile?.role === 'employee';

  const fetchConversations = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setConversations([]);
        return;
      }
      const token = await user.getIdToken();
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com'}/api/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const rows: ConversationRow[] = Array.isArray(data) ? data : [];
        // Support-ticket threads already have their own entry point on the
        // My Tickets screen (tapping a ticket opens its thread), so this
        // inbox stays focused on advisor + property_inquiry conversations
        // for regular users -- that avoids listing the same thread twice.
        // Staff (admin/employee) have no other place on mobile to see
        // support threads yet, including unclaimed ones, so they keep
        // seeing everything.
        const visible = isStaff ? rows : rows.filter((r) => r.type !== 'support');
        setConversations(visible);
      }
    } catch (err) {
      console.warn('Failed to fetch conversations', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isStaff]);

  useFocusEffect(
    useCallback(() => {
      fetchConversations();
    }, [fetchConversations])
  );

  // Live updates while sitting on this screen: any `new_message` event
  // (for any conversation -- the inbox doesn't know in advance which ones
  // matter) triggers a cheap refetch of the list so the last-message
  // preview and unread dot update without needing to leave and come back.
  // `connect` (initial connect + every reconnect) also triggers a refetch
  // to catch up on anything missed while disconnected.
  useEffect(() => {
    const socket = getSocket();

    const handleLiveUpdate = () => {
      fetchConversations();
    };

    socket.on('new_message', handleLiveUpdate);
    socket.on('connect', handleLiveUpdate);

    return () => {
      socket.off('new_message', handleLiveUpdate);
      socket.off('connect', handleLiveUpdate);
    };
  }, [fetchConversations]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={GoldSystem.primaryGold} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Messages</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GoldSystem.primaryGold} />
        }
      >
        {conversations.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyTitle}>No Messages Yet</Text>
            <Text style={styles.emptySub}>
              Conversations with your advisor or about a property will show up here.
            </Text>
          </View>
        ) : (
          conversations.map((conv) => {
            const color = TYPE_COLORS[conv.type] || Neutrals.gray400;
            return (
              <TouchableOpacity
                key={conv.id}
                style={styles.row}
                activeOpacity={0.7}
                onPress={() => router.push(('/conversations/' + conv.id) as any)}
              >
                <View style={styles.rowContent}>
                  <View style={styles.rowTopLine}>
                    <Text style={styles.contextLabel} numberOfLines={1}>
                      {conv.context_label || TYPE_LABELS[conv.type] || 'Conversation'}
                    </Text>
                    <Text style={styles.timeText}>
                      {formatRelativeTime(conv.last_message?.created_at || conv.updated_at)}
                    </Text>
                  </View>
                  <View style={styles.rowBottomLine}>
                    <View style={[styles.typeBadge, { borderColor: color }]}>
                      <Text style={[styles.typeBadgeText, { color }]}>
                        {TYPE_LABELS[conv.type] || conv.type}
                      </Text>
                    </View>
                    <Text
                      style={[styles.previewText, conv.unread && styles.previewTextUnread]}
                      numberOfLines={1}
                    >
                      {conv.staff_unclaimed
                        ? 'Unclaimed — tap to pick up'
                        : conv.last_message?.body || 'No messages yet'}
                    </Text>
                  </View>
                </View>
                {conv.unread && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Neutrals.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Neutrals.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: Neutrals.obsidian,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    color: Neutrals.white,
    fontSize: 24,
    lineHeight: 28,
  },
  title: {
    ...Typography.headlineMedium,
    color: Neutrals.white,
  },
  content: {
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
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
  emptySub: {
    ...Typography.bodyMedium,
    color: Neutrals.gray500,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Neutrals.white,
    borderRadius: Radius.lg,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Neutrals.gray200,
    ...Shadows.soft,
  },
  rowContent: {
    flex: 1,
    marginRight: 8,
  },
  rowTopLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  contextLabel: {
    ...Typography.labelLarge,
    color: Neutrals.obsidian,
    flex: 1,
    marginRight: 8,
  },
  timeText: {
    ...Typography.caption,
    color: Neutrals.gray500,
  },
  rowBottomLine: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeBadge: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 8,
  },
  typeBadgeText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  previewText: {
    ...Typography.bodyMedium,
    color: Neutrals.gray500,
    flex: 1,
  },
  previewTextUnread: {
    color: Neutrals.obsidian,
    fontWeight: '600',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: GoldSystem.primaryGold,
  },
});
