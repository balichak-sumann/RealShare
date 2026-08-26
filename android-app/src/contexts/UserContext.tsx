import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserProfile = {
  id: string;
  role: 'investor' | 'agent' | 'builder' | 'admin' | 'employee';
  employee_department?: string | null;
  full_name: string;
  email: string | null;
  phone_number?: string | null;
  avatar_url: string | null;
  kyc_status: string;
  is_active: boolean;
  wallet_balance?: number;
  created_at?: string;
};

type UserContextType = {
  profile: UserProfile | null;
  setProfile: (profile: UserProfile | null) => void;
};

const UserContext = createContext<UserContextType>({
  profile: null,
  setProfile: () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  return (
    <UserContext.Provider value={{ profile, setProfile }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
