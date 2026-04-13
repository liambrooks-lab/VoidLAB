"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiBaseUrl } from "@/lib/api";
import { buildAuthHeaders, clearStoredSessionToken, storeSessionToken } from "@/lib/session";

export type UserSocialLinks = {
  github: string;
  instagram: string;
  linkedin: string;
  x: string;
};

export type UserProfile = {
  avatar: string;
  bio: string;
  email: string;
  githubConnected: boolean;
  githubLogin: string;
  id: string;
  name: string;
  phone: string;
  providers: {
    github: boolean;
    google: boolean;
    x: boolean;
  };
  region: string;
  socials: UserSocialLinks;
};

export type UserActivity = {
  createdAt: string;
  detail: string;
  id: string;
  title: string;
  type: "ai" | "command" | "profile" | "run" | "save" | "workspace";
};

type UserContextValue = {
  activities: UserActivity[];
  isReady: boolean;
  logout: () => Promise<void>;
  profile: UserProfile | null;
  recordActivity: (activity: Omit<UserActivity, "createdAt" | "id">) => void;
  refreshProfile: () => Promise<UserProfile | null>;
  saveProfile: (profile: Partial<Pick<UserProfile, "bio" | "phone" | "region" | "socials">>) => Promise<UserProfile | null>;
};

const activityStorageKey = "voidlab-user-activities";
const storageLimit = 40;

const emptySocials: UserSocialLinks = {
  github: "",
  instagram: "",
  linkedin: "",
  x: "",
};

const normalizeProfile = (value: Partial<UserProfile> | null | undefined): UserProfile | null => {
  if (!value?.id || !value.name) {
    return null;
  }

  return {
    avatar: value.avatar ?? "",
    bio: value.bio ?? "",
    email: value.email ?? "",
    githubConnected: Boolean(value.githubConnected),
    githubLogin: value.githubLogin ?? "",
    id: value.id,
    name: value.name,
    phone: value.phone ?? "",
    providers: {
      github: Boolean(value.providers?.github),
      google: Boolean(value.providers?.google),
      x: Boolean(value.providers?.x),
    },
    region: value.region ?? "Global",
    socials: {
      ...emptySocials,
      ...(value.socials ?? {}),
    },
  };
};

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [isReady, setIsReady] = useState(false);

  const refreshProfile = async () => {
    try {
      const authHeaders = buildAuthHeaders();
      const response = await fetch(`${apiBaseUrl}/api/auth/me`, {
        headers: authHeaders,
        credentials: "include",
      });

      if (!response.ok) {
        setProfile(null);
        return null;
      }

      const data = await response.json();
      const nextProfile = normalizeProfile(data.profile);
      setProfile(nextProfile);
      return nextProfile;
    } catch {
      setProfile(null);
      return null;
    }
  };

  useEffect(() => {
    try {
      const currentUrl = new URL(window.location.href);
      const sessionToken = currentUrl.searchParams.get("sessionToken");

      if (sessionToken) {
        storeSessionToken(sessionToken);
        currentUrl.searchParams.delete("sessionToken");
        currentUrl.searchParams.delete("auth");
        window.history.replaceState({}, "", currentUrl.toString());
      }

      const rawActivities = window.localStorage.getItem(activityStorageKey);
      if (rawActivities) {
        setActivities(JSON.parse(rawActivities) as UserActivity[]);
      }
    } finally {
      void refreshProfile().finally(() => setIsReady(true));
    }
  }, []);

  const recordActivity = (activity: Omit<UserActivity, "createdAt" | "id">) => {
    const entry: UserActivity = {
      ...activity,
      createdAt: new Date().toISOString(),
      id: `activity-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    };

    setActivities((current) => {
      const nextActivities = [entry, ...current].slice(0, storageLimit);
      window.localStorage.setItem(activityStorageKey, JSON.stringify(nextActivities));
      return nextActivities;
    });
  };

  const saveProfile = async (
    nextProfile: Partial<Pick<UserProfile, "bio" | "phone" | "region" | "socials">>,
  ) => {
    const response = await fetch(`${apiBaseUrl}/api/auth/profile`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...buildAuthHeaders(),
      },
      credentials: "include",
      body: JSON.stringify(nextProfile),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "VoidLAB could not save your profile.");
    }

    if (data.token) {
      storeSessionToken(String(data.token));
    }

    const normalizedProfile = normalizeProfile(data.profile);
    setProfile(normalizedProfile);

    return normalizedProfile;
  };

  const logout = async () => {
    await fetch(`${apiBaseUrl}/api/auth/logout`, {
      method: "POST",
      headers: buildAuthHeaders(),
      credentials: "include",
    });
    clearStoredSessionToken();
    setProfile(null);
  };

  const value = useMemo(
    () => ({ activities, isReady, logout, profile, recordActivity, refreshProfile, saveProfile }),
    [activities, isReady, profile],
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
