import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import KycBanner from '../../components/KycBanner';
import { useUser } from '@/contexts/UserContext';

export default function TabLayout() {
  const { profile } = useUser();
  const kycStatus = profile?.kyc_status as 'not_submitted' | 'pending' | 'verified' | 'rejected' || 'not_submitted';

  return (
    <View style={{ flex: 1 }}>
      <KycBanner kycStatus={kycStatus} />
      <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#1A56DB', tabBarStyle: { height: 60, paddingBottom: 10, paddingTop: 10 } }}>
        <Tabs.Screen 
          name="index" 
          options={{ 
            title: 'Home', 
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏠</Text> 
          }} 
        />
        <Tabs.Screen 
          name="explore" 
          options={{ 
            title: 'Explore', 
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🔍</Text> 
          }} 
        />
        <Tabs.Screen 
          name="portfolio" 
          options={{ 
            title: 'Investments', 
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📈</Text> 
          }} 
        />
        <Tabs.Screen 
          name="kyc" 
          options={{ 
            title: 'KYC', 
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🪪</Text> 
          }} 
        />
        <Tabs.Screen 
          name="profile" 
          options={{ 
            title: 'Profile', 
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>👤</Text> 
          }} 
        />
      </Tabs>
    </View>
  );
}
