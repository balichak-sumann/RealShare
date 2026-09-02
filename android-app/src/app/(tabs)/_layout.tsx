import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { useUser } from '@/contexts/UserContext';
import { TabBar } from '@/components/navigation/TabBar';
import { FloatingHelpButton } from '@/components/help/FloatingHelpButton';

export default function TabLayout() {
  const { profile } = useUser();

  return (
    <View style={{ flex: 1 }}>
      <Tabs 
        tabBar={(props) => <TabBar {...props as any} />}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="search" options={{ title: 'Search', href: null }} />
        <Tabs.Screen name="portfolio" options={{ title: 'Portfolio' }} />
        <Tabs.Screen name="shortlist" options={{ title: 'Shortlist' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile', href: null }} />
        
        {/* Accessible via drawer */}
        <Tabs.Screen name="explore" options={{ title: 'Explore' }} />
      </Tabs>
      <FloatingHelpButton />
    </View>
  );
}
