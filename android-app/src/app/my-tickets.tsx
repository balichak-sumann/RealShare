import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Neutrals, GoldSystem, Radius, Typography, Shadows } from '@/constants/design';
import { useUser } from '@/contexts/UserContext';
import { auth } from '@/lib/firebase';

interface Ticket {
  id: string;
  ticket_number: string;
  category: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  created_at: string;
}

export default function MyTicketsScreen() {
  const router = useRouter();
  const { profile } = useUser();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const slideAnim = useRef(new Animated.Value(20)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchTickets();
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        speed: 12,
        bounciness: 5,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const fetchTickets = async () => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not logged in');
      const token = await user.getIdToken();

      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com'}/api/tickets`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      } else {
          // Mock data if API is not fully ready
          throw new Error('API not ready');
      }
    } catch (err) {
      console.warn('Failed to fetch tickets', err);
      // Mock data for demo purposes
      setTickets([
        {
          id: '1',
          ticket_number: 'RS-20260901-4921',
          category: 'payment',
          subject: 'Wallet recharge failed',
          description: 'I tried to add ₹50,000 to my wallet using UPI but the amount was deducted from my bank and not added to the wallet.',
          priority: 'high',
          status: 'in_progress',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          ticket_number: 'RS-20260830-1033',
          category: 'kyc',
          subject: 'PAN Card verification pending',
          description: 'My PAN card has been pending review for 3 days now.',
          priority: 'medium',
          status: 'resolved',
          created_at: new Date(Date.now() - 86400000 * 2).toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return { bg: '#FEE2E2', text: '#DC2626', label: 'Open' }; // Red
      case 'in_progress': return { bg: GoldSystem.paleGold, text: GoldSystem.darkGold, label: 'In Progress' }; // Gold
      case 'resolved': return { bg: '#D1FAE5', text: '#059669', label: 'Resolved' }; // Green
      case 'closed': return { bg: Neutrals.gray200, text: Neutrals.gray600, label: 'Closed' }; // Gray
      default: return { bg: Neutrals.gray100, text: Neutrals.gray500, label: status };
    }
  };

  const getCategoryIcon = (category: string) => {
      switch(category) {
          case 'payment': return '💳';
          case 'kyc': return '📄';
          case 'property': return '🏢';
          case 'technical': return '🐛';
          case 'account': return '👤';
          default: return '❓';
      }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Support Tickets</Text>
        <View style={{ width: 36 }} />
      </View>

      <Animated.ScrollView 
        contentContainerStyle={styles.content}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={GoldSystem.primaryGold} />
          </View>
        ) : tickets.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎫</Text>
            <Text style={styles.emptyTitle}>No Support Tickets</Text>
            <Text style={styles.emptySub}>You haven't raised any support tickets yet.</Text>
          </View>
        ) : (
          tickets.map(ticket => {
            const statusStyle = getStatusColor(ticket.status);
            const isExpanded = expandedId === ticket.id;

            return (
              <TouchableOpacity 
                key={ticket.id} 
                style={[styles.ticketCard, isExpanded && styles.ticketCardExpanded]}
                onPress={() => setExpandedId(isExpanded ? null : ticket.id)}
                activeOpacity={0.7}
              >
                <View style={styles.ticketHeaderRow}>
                    <View style={styles.ticketIdBadge}>
                        <Text style={styles.ticketIdText}>{ticket.ticket_number}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                        <Text style={[styles.statusText, { color: statusStyle.text }]}>
                            {statusStyle.label}
                        </Text>
                    </View>
                </View>

                <View style={styles.ticketMainRow}>
                    <View style={styles.categoryIconBox}>
                        <Text style={styles.categoryIcon}>{getCategoryIcon(ticket.category)}</Text>
                    </View>
                    <View style={styles.ticketInfo}>
                        <Text style={styles.ticketSubject}>{ticket.subject}</Text>
                        <Text style={styles.ticketDate}>
                            {new Date(ticket.created_at).toLocaleDateString('en-IN', { 
                                day: 'numeric', month: 'short', year: 'numeric' 
                            })}
                        </Text>
                    </View>
                </View>

                {isExpanded && (
                    <View style={styles.expandedContent}>
                        <View style={styles.divider} />
                        <Text style={styles.descriptionLabel}>Description</Text>
                        <Text style={styles.descriptionText}>{ticket.description}</Text>
                        
                        <View style={styles.timelineBox}>
                            <View style={styles.timelineItem}>
                                <View style={styles.timelineDot} />
                                <View style={styles.timelineContent}>
                                    <Text style={styles.timelineTitle}>Ticket Created</Text>
                                    <Text style={styles.timelineTime}>
                                        {new Date(ticket.created_at).toLocaleString('en-IN')}
                                    </Text>
                                </View>
                            </View>
                            {ticket.status !== 'open' && (
                                <View style={styles.timelineItem}>
                                    <View style={[styles.timelineDot, { backgroundColor: GoldSystem.primaryGold }]} />
                                    <View style={styles.timelineContent}>
                                        <Text style={styles.timelineTitle}>Under Review</Text>
                                        <Text style={styles.timelineTime}>We are currently looking into your issue.</Text>
                                    </View>
                                </View>
                            )}
                            {ticket.status === 'resolved' && (
                                <View style={[styles.timelineItem, { borderLeftWidth: 0 }]}>
                                    <View style={[styles.timelineDot, { backgroundColor: '#10B981' }]} />
                                    <View style={styles.timelineContent}>
                                        <Text style={styles.timelineTitle}>Resolved</Text>
                                        <Text style={styles.timelineTime}>Issue has been fixed.</Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </Animated.ScrollView>
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
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
  },
  ticketCard: {
    backgroundColor: Neutrals.white,
    borderRadius: Radius.lg,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Neutrals.gray200,
    ...Shadows.soft,
  },
  ticketCardExpanded: {
      borderColor: GoldSystem.primaryGold,
  },
  ticketHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
  },
  ticketIdBadge: {
      backgroundColor: Neutrals.gray100,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: Radius.sm,
  },
  ticketIdText: {
      ...Typography.labelSmall,
      color: Neutrals.gray600,
  },
  statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: Radius.full,
  },
  statusText: {
      ...Typography.labelSmall,
      fontWeight: '700',
  },
  ticketMainRow: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  categoryIconBox: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: Neutrals.gray100,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
  },
  categoryIcon: {
      fontSize: 24,
  },
  ticketInfo: {
      flex: 1,
  },
  ticketSubject: {
      ...Typography.labelLarge,
      color: Neutrals.obsidian,
      marginBottom: 4,
  },
  ticketDate: {
      ...Typography.caption,
      color: Neutrals.gray500,
  },
  expandedContent: {
      marginTop: 16,
  },
  divider: {
      height: 1,
      backgroundColor: Neutrals.gray200,
      marginBottom: 16,
  },
  descriptionLabel: {
      ...Typography.labelMedium,
      color: Neutrals.gray600,
      marginBottom: 4,
  },
  descriptionText: {
      ...Typography.bodyMedium,
      color: Neutrals.obsidian,
      marginBottom: 24,
  },
  timelineBox: {
      paddingLeft: 8,
  },
  timelineItem: {
      borderLeftWidth: 2,
      borderLeftColor: Neutrals.gray200,
      paddingLeft: 20,
      paddingBottom: 24,
      position: 'relative',
  },
  timelineDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: Neutrals.gray300,
      position: 'absolute',
      left: -7,
      top: 0,
  },
  timelineContent: {
      marginTop: -4,
  },
  timelineTitle: {
      ...Typography.labelMedium,
      color: Neutrals.obsidian,
  },
  timelineTime: {
      ...Typography.caption,
      color: Neutrals.gray500,
      marginTop: 2,
  }
});
