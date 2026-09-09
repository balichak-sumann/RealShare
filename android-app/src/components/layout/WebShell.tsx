import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { usePathname } from 'expo-router';
import { Neutrals, Radius } from '@/constants/design';
import { useResponsive } from '@/hooks/useResponsive';
import { DesktopNav } from './DesktopNav';

type Tier = 'auth' | 'split-auth' | 'page';

const SPLIT_AUTH_ROUTES = /^\/sign-in|^\/sign-up/;
const AUTH_ROUTES = /(^|\/)\(auth\)|^\/verify-email|^\/verify-otp/;

const AUTH_CARD_WIDTH = 460;

function routeTier(pathname: string): Tier {
  if (SPLIT_AUTH_ROUTES.test(pathname)) return 'split-auth';
  return AUTH_ROUTES.test(pathname) ? 'auth' : 'page';
}

interface WebShellProps {
  children: React.ReactNode;
}

export function WebShell({ children }: WebShellProps) {
  const { isFramed, width, height } = useResponsive();
  const pathname = usePathname();

  if (!isFramed) {
    return <>{children}</>;
  }

  const tier = routeTier(pathname);

  if (tier === 'split-auth') {
    return <>{children}</>;
  }

  if (tier === 'auth') {
    const cardWidth = Math.min(AUTH_CARD_WIDTH, width - 48);
    const cardHeight = Math.min(780, height - 64);
    return (
      <View style={styles.backdrop}>
        <View style={styles.glow} pointerEvents="none" />
        <View style={styles.vignette} pointerEvents="none" />
        <View style={[styles.authCard, { width: cardWidth, height: cardHeight }]}>
          {children}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <DesktopNav />
      <View style={styles.bodyWide}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: Neutrals.background,
    ...(Platform.OS === 'web' ? ({ overflow: 'visible' } as any) : {}),
  },
  bodyWide: {
    flex: 1,
    ...(Platform.OS === 'web' ? ({ position: 'relative', zIndex: 1 } as any) : {}),
  },
  backdrop: {
    flex: 1,
    backgroundColor: Neutrals.obsidian,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    ...(Platform.OS === 'web'
      ? ({
          backgroundImage:
            'radial-gradient(ellipse 75% 55% at 50% 38%, rgba(212,175,55,0.20) 0%, rgba(205,163,73,0.08) 38%, rgba(26,26,46,0) 72%)',
        } as any)
      : {}),
  },
  vignette: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    ...(Platform.OS === 'web'
      ? ({
          backgroundImage:
            'radial-gradient(ellipse 100% 100% at 50% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.35) 100%)',
        } as any)
      : {}),
  },
  authCard: {
    backgroundColor: Neutrals.background,
    borderRadius: Radius.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.22)',
    ...(Platform.OS === 'web'
      ? ({
          boxShadow:
            '0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(212,175,55,0.10)',
        } as any)
      : {}),
  },
});

export default WebShell;
