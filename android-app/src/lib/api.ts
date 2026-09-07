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
  return process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com';
}

export function getFullImageUrl(url: string | null | undefined): string {
  if (!url) return 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&fit=crop';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  
  const baseUrl = getApiUrl();
  return url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
}
