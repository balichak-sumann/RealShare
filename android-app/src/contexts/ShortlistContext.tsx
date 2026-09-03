import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth } from '@/lib/firebase';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com';

type ShortlistContextType = {
  savedProperties: string[];
  toggleShortlist: (id: string) => void;
  isShortlisted: (id: string) => boolean;
  loading: boolean;
};

const ShortlistContext = createContext<ShortlistContextType | undefined>(undefined);

export function ShortlistProvider({ children }: { children: React.ReactNode }) {
  // Starts empty — no fake pre-seeded favorites. Loaded per-user from the
  // backend once they're signed in, and every toggle persists there too, so
  // it survives app restarts and isn't shared across accounts on one device.
  const [savedProperties, setSavedProperties] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const loadShortlist = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) {
      setSavedProperties([]);
      setLoading(false);
      return;
    }
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_URL}/api/shortlist`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const ids = await res.json();
        setSavedProperties(Array.isArray(ids) ? ids : []);
      }
    } catch (e) {
      console.log('Failed to load shortlist', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(() => {
      loadShortlist();
    });
    return unsubscribe;
  }, [loadShortlist]);

  const toggleShortlist = async (id: string) => {
    const user = auth.currentUser;
    if (!user) return;
    // Optimistic update, corrected if the request fails.
    const wasShortlisted = savedProperties.includes(id);
    setSavedProperties((prev) =>
      wasShortlisted ? prev.filter((p) => p !== id) : [...prev, id]
    );
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_URL}/api/shortlist`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ property_id: id }),
      });
      if (!res.ok) throw new Error('Request failed');
    } catch (e) {
      console.log('Failed to update shortlist, reverting', e);
      setSavedProperties((prev) =>
        wasShortlisted ? [...prev, id] : prev.filter((p) => p !== id)
      );
    }
  };

  const isShortlisted = (id: string) => savedProperties.includes(id);

  return (
    <ShortlistContext.Provider value={{ savedProperties, toggleShortlist, isShortlisted, loading }}>
      {children}
    </ShortlistContext.Provider>
  );
}

export function useShortlist() {
  const context = useContext(ShortlistContext);
  if (context === undefined) {
    throw new Error('useShortlist must be used within a ShortlistProvider');
  }
  return context;
}
