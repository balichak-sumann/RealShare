// Icon names reference Ionicons (used via CategoryPill, QuickActions, etc.)
export const PROPERTY_CATEGORIES = [
  { id: 'All', label: 'All', icon: 'search-outline' },
  { id: 'Commercial', label: 'Commercial', icon: 'business-outline' },
  { id: 'Fractional', label: 'Fractional', icon: 'pie-chart-outline' },
  { id: 'Residential', label: 'Residential', icon: 'home-outline' },
  { id: 'Holiday', label: 'Holiday', icon: 'airplane-outline' },
  { id: 'Investor', label: 'Investor', icon: 'trending-up-outline' },
];


export const QUICK_ACTIONS = [
  { id: 'q1', title: 'Sell Property', subtitle: 'Zero brokerage', icon: 'pricetag-outline', route: '/sell' },
  { id: 'q2', title: 'Home Services', subtitle: 'Interiors & more', icon: 'construct-outline', route: '/services' },
  { id: 'q3', title: 'Investment', subtitle: 'High ROI', icon: 'trending-up-outline', route: '/(tabs)/search?filter=investment' },
  { id: 'q4', title: 'Market Insights', subtitle: 'Trends & Data', icon: 'bar-chart-outline', route: '/market-insights' },
];
