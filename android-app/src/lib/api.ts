import { Platform } from 'react-native';

const PRODUCTION_API_URL = 'https://realshare-5l24.onrender.com';

/**
 * Returns the active API base URL.
 * On web localhost, uses http://localhost:3000 for fast dev.
 * On all other platforms (Android/iOS), always uses the production URL.
 */
export function getApiUrl(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:3000';
    }
  }
  return PRODUCTION_API_URL;
}

export function getFullImageUrl(url: string | null | undefined): string {
  if (!url) return 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&fit=crop';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  
  const baseUrl = getApiUrl();
  return url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
}

/**
 * Fetch wrapper with retry logic for Render free-tier cold starts.
 * Retries up to `maxRetries` times with increasing delays.
 * Timeout per attempt is generous (30s) to allow Render to wake up.
 */
export async function resilientFetch(
  url: string,
  options?: RequestInit & { maxRetries?: number },
): Promise<Response> {
  const maxRetries = options?.maxRetries ?? 3;
  const { maxRetries: _, ...fetchOptions } = options ?? {};

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30_000); // 30s timeout

      const res = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // If backend returned a server error (502/503/504), retry
      if (res.status >= 502 && res.status <= 504 && attempt < maxRetries) {
        await delay(2000 * (attempt + 1)); // 2s, 4s, 6s
        continue;
      }

      return res;
    } catch (err: any) {
      lastError = err;
      if (attempt < maxRetries) {
        await delay(2000 * (attempt + 1));
      }
    }
  }

  throw lastError;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

