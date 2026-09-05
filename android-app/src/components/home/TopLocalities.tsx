import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SectionHeader } from '../ui/SectionHeader';
import { LocalityCard } from '../ui/LocalityCard';
import { formatPrice } from '@/lib/formatters';
import { useRouter } from 'expo-router';
import { ResponsiveRail } from '../layout/ResponsiveRail';

// Derived from real listed properties, grouped by locality — there's no
// separate Locality table (or tracked rent/sale-per-sqft market data), so
// "Avg. Price" and "Avg. Yield" are computed from actual property rows
// instead of a fabricated market index.
export function TopLocalities() {
  const router = useRouter();
  const [localities, setLocalities] = useState<any[]>([]);

  useEffect(() => {
    const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com';
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/properties`);
        if (!res.ok) return;
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.properties || [];

        const grouped = new Map<string, any[]>();
        for (const p of list) {
          if (!p.locality) continue;
          if (!grouped.has(p.locality)) grouped.set(p.locality, []);
          grouped.get(p.locality)!.push(p);
        }

        const derived = Array.from(grouped.entries())
          .map(([name, props]) => {
            const avgPrice = props.reduce((sum, p) => sum + Number(p.price_per_fraction) * (p.total_fractions || 1), 0) / props.length;
            const yields = props.map((p) => Number(p.assured_yield || 0)).filter((y) => y > 0);
            const avgYield = yields.length > 0 ? yields.reduce((a, b) => a + b, 0) / yields.length : 0;
            const firstImage = props[0]?.images?.[0]?.image_url
              || 'https://images.unsplash.com/photo-1519999482648-25049ddd37b1?w=800&fit=crop';
            return {
              id: encodeURIComponent(name),
              name,
              image: firstImage,
              rating: 4.5,
              avgSale: formatPrice(avgPrice),
              avgRent: avgYield > 0 ? `${avgYield.toFixed(1)}%` : 'N/A',
              propertyCount: props.length,
            };
          })
          .sort((a, b) => b.propertyCount - a.propertyCount)
          .slice(0, 10)
          .map((l, idx) => ({ ...l, rank: idx + 1 }));

        setLocalities(derived);
      } catch (e) {
        console.log('Failed to load localities', e);
      }
    })();
  }, []);

  if (localities.length === 0) return null;

  return (
    <View style={styles.container}>
      <SectionHeader title="Top Localities" onViewAll={() => router.push('/(tabs)/search')} />
      <ResponsiveRail contentContainerStyle={styles.scrollContent}>
        {localities.map((locality) => (
          <LocalityCard key={locality.id} {...locality} />
        ))}
      </ResponsiveRail>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20, // For shadow
  },
});
