import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { useUser } from '@/contexts/UserContext';
import { TabBar } from '@/components/navigation/TabBar';

export default function TabLayout() {
  const { profile } = useUser();

  return (
    <View style={{ flex: 1 }}>
      <Tabs 
        tabBar={(props) => <TabBar {...props as any} />}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="search" options={{ title: 'Search' }} />
        <Tabs.Screen name="portfolio" options={{ title: 'Portfolio' }} />
        <Tabs.Screen name="shortlist" options={{ title: 'Shortlist' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
        
        {/* Hidden from tab bar but accessible via code */}
        <Tabs.Screen name="explore" options={{ href: null }} />
      </Tabs>
    </View>
  );
}
