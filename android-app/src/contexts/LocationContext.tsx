import React, { createContext, useContext, useState } from 'react';

type LocationContextType = {
  city: string;
  setCity: (city: string) => void;
  availableCities: string[];
};

const LocationContext = createContext<LocationContextType>({
  city: 'All India',
  setCity: () => {},
  availableCities: ['All India', 'Hyderabad', 'Bengaluru', 'Mumbai', 'Pune', 'Delhi NCR', 'Chennai'],
});

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [city, setCity] = useState('All India');
  const availableCities = ['All India', 'Hyderabad', 'Bengaluru', 'Mumbai', 'Pune', 'Delhi NCR', 'Chennai'];

  return (
    <LocationContext.Provider value={{ city, setCity, availableCities }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  return useContext(LocationContext);
}
