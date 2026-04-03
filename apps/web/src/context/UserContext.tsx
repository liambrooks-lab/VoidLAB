"use client";

import { createContext, useContext, useMemo, useState, useEffect } from "react";

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
  name: string;
  phone: string;
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
  profile: UserProfile | null;
  recordActivity: (activity: Omit<UserActivity, "createdAt" | "id">) => void;
  saveProfile: (profile: UserProfile) => void;
};

const storageKey = "voidlab-user-profile";
const activityStorageKey = "voidlab-user-activities";

const emptySocials: UserSocialLinks = {
  github: "",
  instagram: "",
  linkedin: "",
  x: "",
};

const normalizeProfile = (value: Partial<UserProfile> | null | undefined): UserProfile | null => {
  if (!value?.name || !value.email || !value.phone || !value.region) {
    return null;
  }

  return {
    avatar: value.avatar ?? "",
    bio: value.bio ?? "",
    email: value.email,
    name: value.name,
    phone: value.phone,
    region: value.region,
    socials: {
      ...emptySocials,
      ...(value.socials ?? {}),
    },
  };
};

const storageLimit = 40;
const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const rawProfile = window.localStorage.getItem(storageKey);
      const rawActivities = window.localStorage.getItem(activityStorageKey);

      if (rawProfile) {
        setProfile(normalizeProfile(JSON.parse(rawProfile)) as UserProfile | null);
      }

      if (rawActivities) {
        setActivities(JSON.parse(rawActivities) as UserActivity[]);
      }
    } finally {
      setIsReady(true);
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

  const saveProfile = (nextProfile: UserProfile) => {
    const normalizedProfile = normalizeProfile(nextProfile);

    if (!normalizedProfile) return;

    const activity: Omit<UserActivity, "createdAt" | "id"> = profile
      ? {
          detail: "Profile details were refreshed inside VoidLAB.",
          title: "Profile updated",
          type: "profile",
        }
      : {
          detail: "The user launched a new VoidLAB workspace session.",
          title: "Workspace launched",
          type: "workspace",
        };

    setProfile(normalizedProfile);
    window.localStorage.setItem(storageKey, JSON.stringify(normalizedProfile));
    setActivities((current) => {
      const nextActivities = [
        {
          ...activity,
          createdAt: new Date().toISOString(),
          id: `activity-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        },
        ...current,
      ].slice(0, storageLimit);
      window.localStorage.setItem(activityStorageKey, JSON.stringify(nextActivities));
      return nextActivities;
    });
  };

  const value = useMemo(
    () => ({ activities, isReady, profile, recordActivity, saveProfile }),
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
