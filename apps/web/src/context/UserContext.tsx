"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type UserProfile = {
  name: string;
  email: string;
  phone: string;
  region: string;
  avatar: string;
};

type UserContextValue = {
  isReady: boolean;
  profile: UserProfile | null;
  saveProfile: (profile: UserProfile) => void;
};

const storageKey = "voidlab-user-profile";
const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        setProfile(JSON.parse(raw) as UserProfile);
      }
    } finally {
      setIsReady(true);
    }
  }, []);

  const saveProfile = (nextProfile: UserProfile) => {
    setProfile(nextProfile);
    window.localStorage.setItem(storageKey, JSON.stringify(nextProfile));
  };

  const value = useMemo(
    () => ({ isReady, profile, saveProfile }),
    [isReady, profile],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
}
