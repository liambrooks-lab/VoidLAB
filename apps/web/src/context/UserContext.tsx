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
  saveAvatar: (avatar: string) => void;
  saveProfile: (profile: Partial<Pick<UserProfile, "bio" | "phone" | "region" | "socials">>) => Promise<UserProfile | null>;
};

const activityStorageKey = "voidlab-user-activities";
const avatarStoragePrefix = "voidlab-avatar-";
const storageLimit = 40;
const activityRetentionMs = 7 * 24 * 60 * 60 * 1000;

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

const getAvatarStorageKey = (userId: string) => `${avatarStoragePrefix}${userId}`;

const readStoredAvatar = (userId: string) => {
  if (typeof window === "undefined" || !userId) return "";
  return window.localStorage.getItem(getAvatarStorageKey(userId)) ?? "";
};

const pruneActivities = (entries: UserActivity[]) => {
  const cutoff = Date.now() - activityRetentionMs;

  return entries
    .filter((entry) => {
      const createdAt = new Date(entry.createdAt).getTime();
      return Number.isFinite(createdAt) && createdAt >= cutoff;
    })
    .slice(0, storageLimit);
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
      const normalizedProfile = normalizeProfile(data.profile);
      const nextProfile =
        normalizedProfile && normalizedProfile.id
          ? {
              ...normalizedProfile,
              avatar: readStoredAvatar(normalizedProfile.id) || normalizedProfile.avatar,
            }
          : normalizedProfile;
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
        const prunedActivities = pruneActivities(JSON.parse(rawActivities) as UserActivity[]);
        setActivities(prunedActivities);
        window.localStorage.setItem(activityStorageKey, JSON.stringify(prunedActivities));
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
      const nextActivities = pruneActivities([entry, ...current]);
      window.localStorage.setItem(activityStorageKey, JSON.stringify(nextActivities));
      return nextActivities;
    });
  };

  const saveAvatar = (avatar: string) => {
    if (!profile?.id || typeof window === "undefined") return;

    const normalizedAvatar = avatar.trim();
    const storageKey = getAvatarStorageKey(profile.id);

    if (normalizedAvatar) {
      window.localStorage.setItem(storageKey, normalizedAvatar);
    } else {
      window.localStorage.removeItem(storageKey);
    }

    setProfile((current) =>
      current
        ? {
            ...current,
            avatar: normalizedAvatar,
          }
        : current,
    );
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
    () => ({ activities, isReady, logout, profile, recordActivity, refreshProfile, saveAvatar, saveProfile }),
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
