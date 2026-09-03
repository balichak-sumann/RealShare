import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com';

type Agent = { id: string; type: 'agent'; name: string; locality: string | null; listings: number };
type Developer = {
  id: string;
  type: 'developer';
  name: string;
  locality: string | null;
  listings: number;
  rating: number;
  rera_registered: boolean;
};

export default function AgentsScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState('All');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/professionals`);
        if (res.ok) {
          const data = await res.json();
          setAgents(data.agents || []);
          setDevelopers(data.developers || []);
        }
      } catch (e) {
        console.log('Failed to load professionals', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const items: (Agent | Developer)[] =
    filter === 'Agents' ? agents : filter === 'Developers' ? developers : [...agents, ...developers];

  const handleViewListings = (item: Agent | Developer) => {
    if (item.type === 'developer') {
      router.push(`/developer/${item.id}` as any);
    } else {
      router.push({ pathname: '/projects', params: { agent: item.id, agentName: item.name } } as any);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>\u2190</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find Professionals</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>

        <View style={styles.filterRow}>
          {['All', 'Agents', 'Developers'].map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterPill, filter === f && styles.filterPillActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator color={GoldSystem.primaryGold} style={{ marginTop: 40 }} />
        ) : items.length === 0 ? (
          <Text style={styles.emptyText}>No professionals with active listings found yet.</Text>
        ) : (
          items.map((item) => (
            <View key={`${item.type}-${item.id}`} style={styles.agentCard}>
              <View style={styles.agentHeader}>
                <View style={styles.agentAvatar}>
                  <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
                </View>
                <View style={styles.agentInfo}>
                  <Text style={styles.agentName}>{item.name}</Text>
                  <View style={styles.badgeContainer}>
                    <Text style={styles.badgeText}>
                      {item.type === 'developer' ? 'Developer' : 'Agent'}
                    </Text>
                  </View>
                </View>
              </View>

              {item.locality && (
                <View style={styles.locationRow}>
                  <Text style={styles.locationIcon}>\ud83d\udccd</Text>
                  <Text style={styles.locationText}>{item.locality}</Text>
                </View>
              )}

              <View style={styles.metricsRow}>
                {item.type === 'developer' && (
                  <>
                    <View style={styles.metric}>
                      <Text style={styles.metricValue}>\u2605 {item.rating.toFixed(1)}</Text>
                      <Text style={styles.metricLabel}>Rating</Text>
                    </View>
                    <View style={styles.divider} />
                  </>
                )}
                <View style={styles.metric}>
                  <Text style={styles.metricValue}>{item.listings}</Text>
                  <Text style={styles.metricLabel}>Active Listings</Text>
                </View>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.primaryBtn} onPress={() => handleViewListings(item)}>
                  <Text style={styles.primaryBtnText}>View Listings</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
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
  filterRow: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Neutrals.surface,
    borderWidth: 1,
    borderColor: Neutrals.border,
  },
  filterPillActive: {
    backgroundColor: Neutrals.obsidian,
    borderColor: Neutrals.obsidian,
  },
  filterText: {
    ...Typography.labelMedium,
    color: Neutrals.obsidian,
  },
  filterTextActive: {
    color: Neutrals.surface,
  },
  emptyText: {
    ...Typography.bodyMedium,
    color: Neutrals.gray500,
    textAlign: 'center',
    marginTop: 40,
  },
  agentCard: {
    backgroundColor: Neutrals.surface,
    borderRadius: Radius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: Neutrals.border,
    marginBottom: 16,
    ...Shadows.soft,
  },
  agentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  agentAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: GoldSystem.paleGold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    ...Typography.headlineMedium,
    color: GoldSystem.darkGold,
  },
  agentInfo: {
    flex: 1,
  },
  agentName: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
    marginBottom: 4,
  },
  badgeContainer: {
    backgroundColor: '#DEF7EC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    alignSelf: 'flex-start',
  },
  badgeText: {
    ...Typography.caption,
    color: '#03543F',
    fontWeight: '700',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  locationText: {
    ...Typography.bodyMedium,
    color: Neutrals.gray600,
  },
  metricsRow: {
    flexDirection: 'row',
    backgroundColor: Neutrals.gray100,
    borderRadius: Radius.md,
    padding: 16,
    marginBottom: 20,
  },
  metric: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    backgroundColor: Neutrals.border,
  },
  metricValue: {
    ...Typography.labelLarge,
    color: Neutrals.obsidian,
    marginBottom: 4,
  },
  metricLabel: {
    ...Typography.caption,
    color: Neutrals.gray500,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: Neutrals.obsidian,
    paddingVertical: 12,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  primaryBtnText: {
    ...Typography.labelMedium,
    color: Neutrals.surface,
  },
});
