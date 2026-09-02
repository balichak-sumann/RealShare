import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserProfile = {
  id: string;
  role: 'investor' | 'agent' | 'builder' | 'admin' | 'employee';
  employee_department?: string | null;
  full_name: string;
  email: string | null;
  phone_number: string | null;
  email_verified: boolean;
  phone_verified: boolean;
  created_at: string;
  updated_at: string;
  kyc_status: string;
};

type UserContextType = {
  profile: UserProfile | null;
  setProfile: (profile: UserProfile | null) => void;
  mfaVerified: boolean;
  setMfaVerified: (verified: boolean) => void;
  loading: boolean;
};

const UserContext = createContext<UserContextType>({
  profile: null,
  setProfile: () => {},
  mfaVerified: false,
  setMfaVerified: () => {},
  loading: true,
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [mfaVerified, setMfaVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  return (
    <UserContext.Provider value={{ profile, setProfile, mfaVerified, setMfaVerified, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
