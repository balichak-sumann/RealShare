import { DarkTheme, DefaultTheme, ThemeProvider, Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme, View, Text, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

import { getApiUrl } from '@/lib/api';

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
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
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
      if (finalStatus !== 'granted') return undefined;
      try {
        token = (await Notifications.getExpoPushTokenAsync({
          projectId: 'a786e55d-d4ef-40bd-8d1c-844f5dff4a81',
        })).data;
      } catch (e) {
        console.log('Push token error (non-fatal):', e);
      }
    }
  } catch (e) {
    console.log('Notification setup error (non-fatal):', e);
  }
  return token;
}

import { AnimatedSplashOverlay } from '@/components/animated-icon';

import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { UserProvider, useUser } from '@/contexts/UserContext';

SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore — splash may have already been hidden
});

function RootLayoutNav() {
  const segments = useSegments();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const { setProfile } = useUser();

  useEffect(() => {
    // Guard: if Firebase auth failed to initialize, skip the listener
    if (!auth) {
      setIsLoaded(true);
      return;
    }
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
    const isSignUp = (segments[1] as string) === 'sign-up';

    if (user) {
      // Prevent race condition: If the user is currently signing up, let the sign-up 
      // form handle the sync so it can pass the correct role to the backend.
      if (inAuthGroup && isSignUp) {
        return;
      }

      // Check email verification gate
      if (!user.emailVerified && !user.email?.endsWith('@realshare.test')) {
        const currentRoute = segments[1] as string;
        if (currentRoute !== 'verify-email' && currentRoute !== 'sign-up') {
          router.replace('/verify-email');
        }
        return; // Halt further sync/routing until verified
      }

      // Sync user to DB
      user.getIdToken().then(async token => {
        let pushToken = null;
        try {
          pushToken = await registerForPushNotificationsAsync();
        } catch(e) {
          console.log(e);
        }
        fetch(`${getApiUrl()}/api/users/sync`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ expo_push_token: pushToken })
        })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.success && data?.profile) {
            setProfile(data.profile);
            const isSignUp = (segments[1] as string) === 'sign-up';
            if (inAuthGroup && !isSignUp) {
              if (data.profile.role === 'builder') {
                router.replace('/builder-portal');
              } else if (data.profile.role === 'agent') {
                router.replace('/');
              } else if (data.profile.role === 'employee') {
                router.replace('/employee-portal');
              } else {
                router.replace('/');
              }
            } else if (!segments[0] || (segments[0] === '(tabs)' && (!segments[1] || (segments[1] as string) === 'index'))) {
              if (data.profile.role === 'builder') {
                router.replace('/builder-portal');
              } else if (data.profile.role === 'agent') {
                // Let it stay on / (which renders tabs/index which embeds agent portal)
              }
            }
          } else if (inAuthGroup && (segments[1] as string) !== 'sign-up') {
            router.replace('/');
          }
        })
        .catch(err => {
          console.warn('Failed to sync user:', err.message);
          if (inAuthGroup && (segments[1] as string) !== 'sign-up') router.replace('/');
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
import { WebShell } from '@/components/layout/WebShell';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AppThemeProvider>
        <LocationProvider>
          <UserProvider>
            <DrawerProvider>
              <ShortlistProvider>
                <WebShell>
                  <DrawerWrapper>
                    <RootLayoutNav />
                  </DrawerWrapper>
                </WebShell>
                {/* Outside WebShell so the splash always covers the whole
                    viewport, not just a route's centred content column. */}
                <AnimatedSplashOverlay />
              </ShortlistProvider>
            </DrawerProvider>
          </UserProvider>
        </LocationProvider>
      </AppThemeProvider>
    </ThemeProvider>
    </SafeAreaProvider>
  );
}
