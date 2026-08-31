import React, { createContext, useContext, useState, useEffect } from 'react';

type ShortlistContextType = {
  savedProperties: string[];
  toggleShortlist: (id: string) => void;
  isShortlisted: (id: string) => boolean;
};

const ShortlistContext = createContext<ShortlistContextType | undefined>(undefined);

export function ShortlistProvider({ children }: { children: React.ReactNode }) {
  const [savedProperties, setSavedProperties] = useState<string[]>(['p1', 'p3']);

  const toggleShortlist = (id: string) => {
    setSavedProperties(prev => 
      prev.includes(id) 
        ? prev.filter(p => p !== id)
        : [...prev, id]
    );
  };

  const isShortlisted = (id: string) => savedProperties.includes(id);

  return (
    <ShortlistContext.Provider value={{ savedProperties, toggleShortlist, isShortlisted }}>
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
