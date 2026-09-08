import { useState, useEffect } from 'react';
import SafeStorage from '@/lib/storage';

export interface RecentViewItem {
  id: string;
  title: string;
  locality?: string;
  image_url?: string;
  viewedAt: number;
}

export interface RecentSearchItem {
  query: string;
  searchedAt: number;
}

const VIEWS_KEY = '@realshare_recent_views';
const SEARCHES_KEY = '@realshare_recent_searches';

export function useActivityHistory() {
  const [recentViews, setRecentViews] = useState<RecentViewItem[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>([]);

  // Load history on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const viewsStr = await SafeStorage.getItem(VIEWS_KEY);
        const searchesStr = await SafeStorage.getItem(SEARCHES_KEY);
        
        if (viewsStr) setRecentViews(JSON.parse(viewsStr));
        if (searchesStr) setRecentSearches(JSON.parse(searchesStr));
      } catch (error) {
        console.error("Failed to load activity history", error);
      }
    };
    loadHistory();
  }, []);

  const addView = async (property: any) => {
    try {
      const newItem: RecentViewItem = {
        id: property.id,
        title: property.title,
        locality: property.locality,
        image_url: property.images?.[0]?.image_url || property.image_url,
        viewedAt: Date.now(),
      };

      setRecentViews(prev => {
        // Remove duplicate if exists, then add to top
        const filtered = prev.filter(p => p.id !== newItem.id);
        const updated = [newItem, ...filtered].slice(0, 10); // keep last 10
        SafeStorage.setItem(VIEWS_KEY, JSON.stringify(updated)).catch(console.error);
        return updated;
      });
    } catch (e) {
      console.error(e);
    }
  };

  const addSearch = async (query: string) => {
    if (!query.trim()) return;
    try {
      const newItem: RecentSearchItem = {
        query: query.trim(),
        searchedAt: Date.now(),
      };

      setRecentSearches(prev => {
        // Remove duplicate if exists, then add to top
        const filtered = prev.filter(s => s.query.toLowerCase() !== newItem.query.toLowerCase());
        const updated = [newItem, ...filtered].slice(0, 5); // keep last 5
        SafeStorage.setItem(SEARCHES_KEY, JSON.stringify(updated)).catch(console.error);
        return updated;
      });
    } catch (e) {
      console.error(e);
    }
  };

  const clearHistory = async () => {
    try {
      await SafeStorage.multiRemove([VIEWS_KEY, SEARCHES_KEY]);
      setRecentViews([]);
      setRecentSearches([]);
    } catch (e) {
      console.error(e);
    }
  };

  return {
    recentViews,
    recentSearches,
    addView,
    addSearch,
    clearHistory
  };
}
