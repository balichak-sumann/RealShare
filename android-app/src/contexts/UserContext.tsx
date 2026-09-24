import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserProfile = {
  id: string;
  role: 'buyer' | 'agent' | 'builder' | 'admin' | 'superadmin' | 'employee';
  employee_department?: string | null;
  full_name: string;
  expo_push_token?: string | null;
  bank_name?: string | null;
  bank_account_name?: string | null;
  email: string | null;
  phone_number: string | null;
  full_address?: string | null;
  email_verified: boolean;
  phone_verified: boolean;
  created_at: string;
  updated_at: string;
  kyc_status: string;
  avatar_url?: string | null;
  wallet_balance?: number | string | null;
  kyc_documents?: Array<{
    document_type: string;
    verification_status: string;
  }>;
  is_approved?: boolean;
  subscription?: {
    id?: string;
    tier: string;
    plan_name: string;
    postings_limit: number;
    postings_used: number;
    expires_at: string;
    status: string;
  } | null;
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
