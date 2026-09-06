import { Platform } from 'react-native';

/**
 * Returns the active API base URL.
 * Automatically uses http://localhost:3000 when running on web / localhost in dev mode
 * to avoid Render free-tier cold starts (60-90s lag).
 */
export function getApiUrl(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:3000';
    }
  }
  return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
}
