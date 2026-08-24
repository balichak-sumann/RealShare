import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();
  const [featuredProperties, setFeaturedProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In production, this would point to the deployed Next.js API or backend URL
    fetch('http://localhost:3000/api/properties?featured=true')
      .then(res => res.json())
      .then(data => {
        setFeaturedProperties(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch featured properties:', err);
        setLoading(false);
      });
  }, []);

  return (
    <View style={styles.container}>
      {/* Top Header - Mockup style */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconBtn}>
          <Text style={styles.headerIconText}>☰</Text>
        </TouchableOpacity>
        
        <View style={styles.logoRow}>
          <View style={styles.logoIconBox}>
            <Text style={styles.logoIcon}>🏢</Text>
          </View>
          <Text style={styles.headerTitle}>
            <Text style={{fontWeight: '800'}}>REALSHARE</Text> PROPERTIES
          </Text>
        </View>

        <TouchableOpacity style={styles.headerIconBtn}>
          <Text style={styles.headerIconText}>🔔</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Hi, Rahul 👋</Text>
          <Text style={styles.welcomeSubtitle}>Smart investments, Stronger Future</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput 
            style={styles.searchInput}
            placeholder="Search properties, locations..."
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Blue Hero Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>Invest In Premium Properties & Earn Best Returns</Text>
            <TouchableOpacity style={styles.heroBtn} onPress={() => router.push('/explore' as any)}>
              <Text style={styles.heroBtnText}>Explore Now</Text>
            </TouchableOpacity>
          </View>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=500' }} 
            style={styles.heroImage} 
          />
        </View>

        {/* 4 Icon Grid Actions */}
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/explore' as any)}>
            <View style={styles.actionIconBox}>
              <Text style={styles.actionIcon}>🏢</Text>
            </View>
            <Text style={styles.actionText}>Browse{'\n'}Properties</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/portfolio' as any)}>
            <View style={styles.actionIconBox}>
              <Text style={styles.actionIcon}>📈</Text>
            </View>
            <Text style={styles.actionText}>My{'\n'}Investments</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/agent-portal' as any)}>
            <View style={styles.actionIconBox}>
              <Text style={styles.actionIcon}>💰</Text>
            </View>
            <Text style={styles.actionText}>Earnings{'\n'}Report</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/kyc' as any)}>
            <View style={styles.actionIconBox}>
              <Text style={styles.actionIcon}>💳</Text>
            </View>
            <Text style={styles.actionText}>Transactions</Text>
          </TouchableOpacity>
        </View>

        {/* Featured Properties */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Featured Properties</Text>
            <TouchableOpacity onPress={() => router.push('/explore' as any)}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cardsScroll}>
            {loading ? (
              <View style={{ width: 280, height: 140, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#1A56DB" />
              </View>
            ) : (
              featuredProperties.map((prop) => (
                <TouchableOpacity
                  key={prop.id}
                  style={styles.card}
                  onPress={() => router.push(`/property/${prop.id}` as any)}
                >
                  <Image source={{ uri: prop.images?.[0]?.image_url || 'https://via.placeholder.com/300' }} style={styles.cardImage} />
                  <View style={styles.cardContent}>
                    
                    <Text style={styles.cardTitle}>{prop.title}</Text>
                    <Text style={styles.cardLocation}>{prop.district}, {prop.state}</Text>

                    <View style={styles.cardFooter}>
                      <View>
                        <Text style={styles.footerValue}>₹ {Number(prop.price_per_fraction).toLocaleString('en-IN')}</Text>
                        <Text style={styles.footerLabel}>Min. Investment</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.yieldValue}>{prop.assured_yield}%</Text>
                        <Text style={styles.footerLabel}>Expected ROI</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>

        {/* Developer Shortcut to other portals */}
        <View style={styles.devShortcuts}>
          <Text style={{textAlign: 'center', color: '#6B7280', marginBottom: 10, fontSize: 12}}>Developer Workspaces</Text>
          <View style={{flexDirection: 'row', justifyContent: 'center', gap: 10, flexWrap: 'wrap'}}>
            <TouchableOpacity onPress={() => router.push('/builder-portal' as any)}><Text style={{color: '#1A56DB', fontWeight: '600'}}>Builder Portal</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/employee-portal' as any)}><Text style={{color: '#1A56DB', fontWeight: '600'}}>Employee Desk</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/services' as any)}><Text style={{color: '#1A56DB', fontWeight: '600'}}>Services</Text></TouchableOpacity>
          </View>
        </View>

      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerIconBtn: {
    padding: 5,
  },
  headerIconText: {
    fontSize: 20,
    color: '#111827',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIconBox: {
    padding: 4,
  },
  logoIcon: {
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 12,
    color: '#1A56DB',
    textAlign: 'center',
  },
  scrollContent: {
    flex: 1,
  },
  welcomeSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#4B5563',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  heroBanner: {
    marginHorizontal: 20,
    backgroundColor: '#1A56DB',
    borderRadius: 16,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#1A56DB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  heroContent: {
    flex: 1,
    zIndex: 2,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    marginBottom: 16,
    width: '80%',
  },
  heroBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  heroBtnText: {
    color: '#1A56DB',
    fontWeight: '700',
    fontSize: 12,
  },
  heroImage: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    width: 140,
    height: 140,
    opacity: 0.6,
    borderRadius: 70,
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  actionBtn: {
    alignItems: 'center',
    width: '23%',
  },
  actionIconBox: {
    width: 56,
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  actionIcon: {
    fontSize: 24,
  },
  actionText: {
    fontSize: 11,
    color: '#4B5563',
    textAlign: 'center',
    fontWeight: '500',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  viewAllText: {
    color: '#1A56DB',
    fontWeight: '600',
    fontSize: 13,
  },
  cardsScroll: {
    paddingLeft: 20,
  },
  card: {
    width: 280,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
    marginBottom: 10,
  },
  cardImage: {
    width: '100%',
    height: 140,
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  cardLocation: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  footerValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  yieldValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
  },
  footerLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  devShortcuts: {
    padding: 20,
    marginTop: 20,
    backgroundColor: '#F3F4F6',
  },
  bottomTab: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingBottom: 20,
  },
  tabBtn: {
    alignItems: 'center',
    width: 60,
  },
  tabIcon: {
    fontSize: 22,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  tabText: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
  }
});
