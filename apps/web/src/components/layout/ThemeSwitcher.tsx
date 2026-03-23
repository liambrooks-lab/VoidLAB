"use client";

import { Palette } from "lucide-react";
import { ThemeName, useTheme } from "@/context/ThemeContext";

const labels: Record<ThemeName, string> = {
  midnight: "Midnight",
  graphite: "Graphite",
  ember: "Ember",
};

export default function ThemeSwitcher() {
  const { setTheme, theme } = useTheme();

  return (
    <label className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200">
      <Palette size={15} className="text-amber-300" />
      <select
        className="bg-transparent outline-none"
        onChange={(event) => setTheme(event.target.value as ThemeName)}
        value={theme}
      >
        {Object.entries(labels).map(([value, label]) => (
          <option key={value} value={value} className="bg-slate-950 text-white">
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}
