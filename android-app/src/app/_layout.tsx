import { DarkTheme, DefaultTheme, ThemeProvider, Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme, View, Text } from 'react-native';
import { useEffect, useState } from 'react';

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
        user.getIdToken().then(token => {
          fetch('http://localhost:3000/api/users/sync', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            }
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
