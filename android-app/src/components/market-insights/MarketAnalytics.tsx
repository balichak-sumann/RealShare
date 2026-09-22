import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, useWindowDimensions } from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { Neutrals, Typography, Radius, Shadows } from '@/constants/design';

// Mock Data for MVP Analytics
const highCostData = {
  labels: ['Mumbai', 'Delhi', 'Bengaluru', 'Pune', 'Hyderabad', 'Chennai'],
  datasets: [
    {
      data: [15000, 11500, 9500, 7800, 6500, 7200],
    },
  ],
};

const popularLandsData = {
  labels: ['Gachibowli', 'Whitefield', 'Bandra', 'Koregaon Pk', 'Gurugram'],
  datasets: [
    {
      data: [85, 76, 92, 65, 88], // Demand index / views (in thousands)
      color: (opacity = 1) => `rgba(184, 134, 11, ${opacity})`, // Gold color
      strokeWidth: 2,
    },
  ],
};

export default function MarketAnalytics() {
  // Was a module-scope Dimensions.get() snapshot: frozen at bundle load, so the
  // charts kept their original width after a resize, rotation or foldable
  // unfold. useWindowDimensions re-renders on each of those.
  const { width } = useWindowDimensions();
  // Charts sit inside a padded card. Subtracting the padding alone made the
  // chart as wide as the viewport on a desktop browser, so cap it too.
  const chartWidth = Math.max(260, Math.min(width - 64, 720));
  const chartConfig = {
    backgroundGradientFrom: Neutrals.surface,
    backgroundGradientTo: Neutrals.surface,
    color: (opacity = 1) => `rgba(15, 23, 42, ${opacity})`, // Obsidian
    strokeWidth: 2,
    barPercentage: 0.6,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    propsForLabels: {
      fontSize: 10,
    },
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Avg Premium Property</Text>
          <Text style={styles.summaryValue}>₹11,500<Text style={styles.summarySub}>/sqft</Text></Text>
          <Text style={styles.trendUp}>+4.2% YoY</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Top Trending City</Text>
          <Text style={styles.summaryValue}>Hyderabad</Text>
          <Text style={styles.trendUp}>+12% Demand</Text>
        </View>
      </View>

      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>High Cost Areas (Avg ₹/sqft)</Text>
          <Text style={styles.chartSubtitle}>Top tier Indian cities by real estate value</Text>
        </View>
        <BarChart
          data={highCostData}
          width={chartWidth}
          height={240}
          yAxisLabel="₹"
          yAxisSuffix=""
          chartConfig={chartConfig}
          verticalLabelRotation={30}
          style={styles.chartStyle}
          showValuesOnTopOfBars={Platform.OS !== 'web'}
        />
      </View>

      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Popular Lands (Demand Index)</Text>
          <Text style={styles.chartSubtitle}>Areas with highest inquiries this month</Text>
        </View>
        <LineChart
          data={popularLandsData}
          width={chartWidth}
          height={240}
          withDots={Platform.OS !== 'web'}
          chartConfig={{
            ...chartConfig,
            color: (opacity = 1) => `rgba(184, 134, 11, ${opacity})`, // Gold
          }}
          bezier
          style={styles.chartStyle}
          yAxisLabel=""
          yAxisSuffix="k"
        />
      </View>
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: Neutrals.surface,
    padding: 16,
    borderRadius: Radius.lg,
    width: '48%',
    ...Platform.select({
      ios: Shadows.soft,
      android: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 4 } as any,
      web: Shadows.soft,
    }),
  },
  summaryTitle: {
    ...Typography.labelMedium,
    color: Neutrals.gray600,
    marginBottom: 8,
  },
  summaryValue: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
  },
  summarySub: {
    ...Typography.bodySmall,
    color: Neutrals.gray500,
  },
  trendUp: {
    ...Typography.labelSmall,
    color: '#10B981', // Emerald green
    marginTop: 4,
    fontWeight: '600',
  },
  chartCard: {
    backgroundColor: Neutrals.surface,
    borderRadius: Radius.xl,
    padding: 16,
    marginBottom: 24,
    ...Platform.select({
      ios: Shadows.soft,
      android: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 4 } as any,
      web: Shadows.soft,
    }),
  },
  chartHeader: {
    marginBottom: 16,
  },
  chartTitle: {
    ...Typography.titleLarge,
    color: Neutrals.obsidian,
    marginBottom: 4,
  },
  chartSubtitle: {
    ...Typography.bodySmall,
    color: Neutrals.gray600,
  },
  chartStyle: {
    marginVertical: 8,
    borderRadius: Radius.lg,
    alignSelf: 'center',
  },
});
