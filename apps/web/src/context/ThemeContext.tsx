"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type ThemeName = "midnight" | "graphite" | "ember";

type ThemeContextValue = {
  editorTheme: "vs-dark";
  setTheme: (theme: ThemeName) => void;
  theme: ThemeName;
};

const storageKey = "voidlab-theme";
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>("midnight");

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey) as ThemeName | null;
    const nextTheme = stored ?? "midnight";
    document.documentElement.dataset.theme = nextTheme;
    setThemeState(nextTheme);
  }, []);

  const setTheme = (nextTheme: ThemeName) => {
    setThemeState(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem(storageKey, nextTheme);
  };

  const value = useMemo(
    () => ({
      editorTheme: "vs-dark" as const,
      setTheme,
      theme,
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
