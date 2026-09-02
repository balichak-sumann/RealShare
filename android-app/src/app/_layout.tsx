import { DarkTheme, DefaultTheme, ThemeProvider, Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme, View, Text, Platform } from 'react-native';
import { useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function registerForPushNotificationsAsync() {
  let token;
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return;
    try {
      token = (await Notifications.getExpoPushTokenAsync({ projectId: 'realshare-mock' })).data;
    } catch(e) {
      console.log('Error getting push token', e);
    }
  }
  return token;
}

import { AnimatedSplashOverlay } from '@/components/animated-icon';

import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { UserProvider, useUser } from '@/contexts/UserContext';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const segments = useSegments();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const { setProfile } = useUser();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setProfile(null);
      }
      setIsLoaded(true);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (user) {
      // Sync user to DB
      user.getIdToken().then(async token => {
        let pushToken = null;
        try {
          pushToken = await registerForPushNotificationsAsync();
        } catch(e) {
          console.log(e);
        }
        fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com'}/api/users/sync`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ expo_push_token: pushToken })
        })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.profile) {
            setProfile(data.profile);
            if (inAuthGroup) {
              if (data.profile.role === 'builder') {
                router.replace('/builder-portal');
              } else if (data.profile.role === 'agent') {
                router.replace('/agent-portal');
              } else if (data.profile.role === 'employee') {
                router.replace('/employee-portal');
              } else {
                router.replace('/');
              }
            }
          } else if (inAuthGroup) {
            router.replace('/');
          }
        })
        .catch(err => {
          console.warn('Failed to sync user:', err.message);
          if (inAuthGroup) router.replace('/');
        });
      });
    }
  }, [user, isLoaded, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="property/[id]" options={{ presentation: 'modal', headerShown: false }} />
      <Stack.Screen name="builder-portal" options={{ headerShown: false }} />
      <Stack.Screen name="agent-portal" options={{ headerShown: false }} />
      <Stack.Screen name="employee-portal" options={{ headerShown: false }} />
    </Stack>
  );
}

import { ThemeProvider as AppThemeProvider } from '@/contexts/ThemeContext';
import { LocationProvider } from '@/contexts/LocationContext';
import { ShortlistProvider } from '@/contexts/ShortlistContext';
import { DrawerProvider } from '@/contexts/DrawerContext';
import { DrawerWrapper } from '@/components/navigation/DrawerMenu';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AppThemeProvider>
        <LocationProvider>
          <UserProvider>
            <DrawerProvider>
              <DrawerWrapper>
                <ShortlistProvider>
                  <AnimatedSplashOverlay />
                  <RootLayoutNav />
                </ShortlistProvider>
              </DrawerWrapper>
            </DrawerProvider>
          </UserProvider>
        </LocationProvider>
      </AppThemeProvider>
    </ThemeProvider>
  );
}
