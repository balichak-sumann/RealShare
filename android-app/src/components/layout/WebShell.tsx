import React from 'react';
import { View, StyleSheet } from 'react-native';
import { usePathname } from 'expo-router';
import { Neutrals, Radius } from '@/constants/design';
import { useResponsive } from '@/hooks/useResponsive';
import { DesktopNav } from './DesktopNav';
import { Platform } from 'react-native';

/**
 * Web layout shell.
 *
 *   native / narrow web -> children untouched (the phone app, zero wrapping)
 *   web, auth routes    -> centered auth card on a branded backdrop (no nav)
 *   web, everything else-> DesktopNav + full-bleed page, same as Home
 *
 * There used to be a separate "content" tier that boxed non-browse routes into
 * a centered column with a cream backdrop and hairline borders. That read as
 * dead space / a broken layout rather than a deliberate one, so it's gone —
 * every route now gets the exact same full-width treatment Home uses. A route
 * that wants a narrower reading measure caps its OWN inner content (the way
 * Home caps its scroll content at 1240px) rather than being boxed by the shell.
 */

type Tier = 'auth' | 'page';

/** Sign-in / sign-up / verification — a centered card is the correct web pattern. */
const AUTH_ROUTES =
  /(^|\/)\(auth\)|^\/sign-in|^\/sign-up|^\/verify-email|^\/verify-otp/;

const AUTH_CARD_WIDTH = 460;

function routeTier(pathname: string): Tier {
  return AUTH_ROUTES.test(pathname) ? 'auth' : 'page';
}

interface WebShellProps {
  children: React.ReactNode;
}

export function WebShell({ children }: WebShellProps) {
  const { isFramed, width, height } = useResponsive();
  const pathname = usePathname();

  // Native + narrow web: pass straight through, no wrapper node at all.
  if (!isFramed) {
    return <>{children}</>;
  }

  const tier = routeTier(pathname);

  // Auth: a centered card on the branded backdrop. No nav — signing in is its
  // own moment, and this is how login pages are built on the web.
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

  // Every other route: desktop nav + full-bleed page, uniform background.
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
  },
  bodyWide: {
    flex: 1,
  },

  // ---- auth backdrop ----
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
