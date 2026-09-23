import { DarkTheme, DefaultTheme, ThemeProvider, Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme, View, Text, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

import { getApiUrl, resilientFetch } from '@/lib/api';

// Cursor pointer style injection moved into TabLayout useEffect to avoid hydration mismatch

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
        const vapidKey = process.env.EXPO_PUBLIC_FIREBASE_VAPID_KEY || undefined;
        token = (await Notifications.getExpoPushTokenAsync({
          projectId: 'a786e55d-d4ef-40bd-8d1c-844f5dff4a81',
          ...(Platform.OS === 'web' && vapidKey ? { vapidKey } : {}),
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
import { useInactivityTimer } from '@/hooks/useInactivityTimer';

SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore — splash may have already been hidden
});

function RootLayoutNav() {
  const segments = useSegments();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const { setProfile } = useUser();

  // Wake up the Render backend immediately on app launch.
  // This runs during the splash screen so that by the time
  // the home screen mounts and fetches properties/banners,
  // the backend is already warm and responds instantly.
  useEffect(() => {
    resilientFetch(`${getApiUrl()}/api/properties?limit=1`).catch(() => {});
  }, []);

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

      // Email verification gate removed

      // Sync user to DB
      user.getIdToken().then(async token => {
        let pushToken = null;
        try {
          pushToken = await registerForPushNotificationsAsync();
        } catch(e) {
          console.log(e);
        }
        resilientFetch(`${getApiUrl()}/api/users/sync`, {
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
            // Admin Approval Check
            if (data.profile.is_approved === false && data.profile.role !== 'admin' && data.profile.role !== 'employee') {
              import('firebase/auth').then(({ signOut }) => signOut(auth));
              setProfile(null);
              if (Platform.OS === 'web') {
                window.alert("Your account is pending admin approval. Please try again later.");
              } else {
                import('react-native').then(({ Alert }) => {
                  Alert.alert("Pending Approval", "Your account is pending admin approval. Please try again later.");
                });
              }
              if (inAuthGroup && (segments[1] as string) !== 'sign-up') router.replace('/sign-in');
              return;
            }

            setProfile(data.profile);
            const isSignUp = (segments[1] as string) === 'sign-up';
            if (inAuthGroup && !isSignUp) {
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
          }
        })
        .catch(err => {
          console.warn('Failed to sync user:', err.message);
        });
      });
    }
  }, [user, isLoaded, segments]);

  const isRelevantRole = profile?.role === 'admin' || profile?.role === 'superadmin' || profile?.role === 'employee';

  const panResponder = useInactivityTimer(
    isRelevantRole,
    () => {
      console.log('Logging out due to inactivity');
      import('firebase/auth').then(({ signOut }) => signOut(auth));
      setProfile(null);
      if (Platform.OS === 'web') {
        window.alert("You have been logged out due to inactivity.");
      } else {
        import('react-native').then(({ Alert }) => {
          Alert.alert("Session Expired", "You have been logged out due to inactivity.");
        });
      }
      router.replace('/sign-in');
    },
    30 * 60 * 1000 // 30 minutes
  );

  return (
    <View style={{ flex: 1 }} {...(panResponder ? panResponder.panHandlers : {})}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="property/[id]" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="builder-portal" options={{ headerShown: false }} />
        <Stack.Screen name="agent-portal" options={{ headerShown: false }} />
        <Stack.Screen name="employee-portal" options={{ headerShown: false }} />
      </Stack>
    </View>
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

  // Inject cursor:pointer styles after hydration (client-side only) to avoid #418
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const id = '__realshare_cursor_style';
      if (!document.getElementById(id)) {
        const style = document.createElement('style');
        style.id = id;
        style.textContent = `
          [role="button"], a, [role="link"], [role="menuitem"], [tabindex="0"] {
            cursor: pointer !important;
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, []);

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
