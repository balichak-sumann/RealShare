import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';
import { auth } from '@/lib/firebase';
import { getApiUrl } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MyListingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<any[]>([]);
  const [error, setError] = useState('');
  const currentUser = auth.currentUser;

  useEffect(() => {
    const fetchMyListings = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }
      try {
        const token = await currentUser.getIdToken();
        const uid = currentUser.uid;
        const res = await fetch(`${getApiUrl()}/api/properties?posted_by=${uid}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) {
          throw new Error('Failed to fetch listings');
        }
        
        const data = await res.json();
        setProperties(data);
      } catch (err) {
        console.error("Error fetching my listings:", err);
        setError("Unable to load your listings. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchMyListings();
  }, [currentUser]);

  const getStatusDetails = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'approved': return { label: 'Live', color: '#10B981', bgColor: '#D1FAE5' };
      case 'pending_approval': return { label: 'Pending Review', color: '#F59E0B', bgColor: '#FEF3C7' };
      case 'rejected': return { label: 'Rejected', color: '#EF4444', bgColor: '#FEE2E2' };
      case 'draft': return { label: 'Draft', color: '#6B7280', bgColor: '#F3F4F6' };
      default: return { label: status || 'Unknown', color: '#6B7280', bgColor: '#F3F4F6' };
    }
  };

  if (!currentUser) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: Platform.OS === 'web' ? 18 : Math.max(insets.top, 50) }]}>
          <TouchableOpacity onPress={() => { if (router.canGoBack()) { router.back(); } else { router.replace('/'); } }} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitleBig}>My Listings</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ ...Typography.bodyLarge, color: Neutrals.gray500 }}>Please sign in to view your listings.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Platform.OS === 'web' ? 18 : Math.max(insets.top, 50) }]}>
        <TouchableOpacity onPress={() => { if (router.canGoBack()) { router.back(); } else { router.replace('/'); } }} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitleBig}>My Listings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {loading ? (
          <ActivityIndicator size="large" color={GoldSystem.primaryGold} style={{ marginTop: 40 }} />
        ) : error ? (
          <Text style={{ ...Typography.bodyLarge, color: '#EF4444', textAlign: 'center', marginTop: 40 }}>{error}</Text>
        ) : properties.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 60 }}>
            <Ionicons name="home-outline" size={64} color={Neutrals.gray300} />
            <Text style={{ ...Typography.titleLarge, color: Neutrals.obsidian, marginTop: 16 }}>No Listings Found</Text>
            <Text style={{ ...Typography.bodyMedium, color: Neutrals.gray500, textAlign: 'center', marginTop: 8 }}>
              You haven't posted any properties yet.
            </Text>
            <TouchableOpacity 
              style={styles.postBtn}
              onPress={() => router.push('/sell')}
            >
              <Text style={styles.postBtnText}>Post a Property</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            {properties.map((prop) => {
              const statusInfo = getStatusDetails(prop.approval_status);
              const imageUrl = prop.image_url || prop.images?.[0]?.image_url || 'https://via.placeholder.com/300';
              
              return (
                <View key={prop.id} style={styles.listingCard}>
                  <Image source={{ uri: imageUrl }} style={styles.listingImage} />
                  <View style={styles.listingDetails}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Text style={styles.listingTitle} numberOfLines={2}>{prop.title}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
                        <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
                      </View>
                    </View>
                    
                    <Text style={styles.listingLocation} numberOfLines={1}>
                      <Ionicons name="location-outline" size={14} color={Neutrals.gray500} /> {prop.locality}, {prop.district}
                    </Text>
                    
                    <View style={styles.listingFooter}>
                      <Text style={styles.listingPrice}>
                        ₹ {(Number(prop.price_per_fraction) || Number(prop.rental_amount) || 0).toLocaleString('en-IN')}
                        {prop.listing_type === 'rental' ? '/month' : ''}
                      </Text>
                      <Text style={styles.listingTypeBadge}>
                        {prop.listing_type.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Neutrals.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, paddingTop: 50, backgroundColor: Neutrals.surface,
    borderBottomWidth: 1, borderBottomColor: Neutrals.border,
  },
  backBtn: { padding: 8, marginLeft: -8 },
  backIcon: { fontSize: 24, color: Neutrals.obsidian },
  headerTitleBig: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
  },
  content: {
    flex: 1,
  },
  postBtn: {
    backgroundColor: GoldSystem.primaryGold,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: Radius.full,
    marginTop: 24,
  },
  postBtnText: {
    ...Typography.labelLarge,
    color: Neutrals.white,
    fontWeight: 'bold',
  },
  listingCard: {
    backgroundColor: Neutrals.white,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Neutrals.border,
    ...Shadows.soft,
  },
  listingImage: {
    width: '100%',
    height: 160,
    backgroundColor: Neutrals.gray200,
  },
  listingDetails: {
    padding: 16,
  },
  listingTitle: {
    ...Typography.titleMedium,
    color: Neutrals.obsidian,
    flex: 1,
    marginRight: 12,
  },
  listingLocation: {
    ...Typography.bodyMedium,
    color: Neutrals.gray500,
    marginTop: 8,
  },
  listingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Neutrals.border,
  },
  listingPrice: {
    ...Typography.titleLarge,
    color: GoldSystem.darkGold,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  statusText: {
    ...Typography.caption,
    fontWeight: 'bold',
  },
  listingTypeBadge: {
    ...Typography.caption,
    backgroundColor: Neutrals.gray100,
    color: Neutrals.gray600,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
});
