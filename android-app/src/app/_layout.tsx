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

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const segments = useSegments();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoaded(true);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';
    const isVerifyScreen = segments[1] === 'verify-email';

    if (user) {
      if (user.email && !user.emailVerified) {
        if (!isVerifyScreen) router.replace('/(auth)/verify-email');
      } else {
        // Sync user to DB
        user.getIdToken().then(async token => {
          let pushToken = null;
          try {
            pushToken = await registerForPushNotificationsAsync();
          } catch(e) {
            console.log(e);
          }
          fetch('http://localhost:3000/api/users/sync', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ expo_push_token: pushToken })
          }).catch(err => console.error('Failed to sync user:', err));
        });

        if (inAuthGroup && !isVerifyScreen) router.replace('/');
      }
    } else {
      if (!inAuthGroup) router.replace('/(auth)/sign-in');
    }
  }, [user, isLoaded, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="property/[id]" options={{ presentation: 'modal', headerShown: false }} />
    </Stack>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <RootLayoutNav />
    </ThemeProvider>
  );
}
