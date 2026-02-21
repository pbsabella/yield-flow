"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type Theme = "light" | "dark";

const themes = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
] as const;

const THEME_STORAGE_KEY = "theme";

function getSystemTheme(media: MediaQueryList): Theme {
  return media.matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.setProperty("--theme", theme);
}

export default function ThemeToggle() {
  const [themeState, setThemeState] = useState<{ theme: Theme; followSystem: boolean }>(
    () => {
      if (typeof window === "undefined") {
        return { theme: "light", followSystem: true };
      }
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      const stored = window.localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
      if (stored === "light" || stored === "dark") {
        return { theme: stored, followSystem: false };
      }
      return { theme: getSystemTheme(media), followSystem: true };
    },
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    applyTheme(themeState.theme);

    const handleChange = () => {
      setThemeState((current) => {
        if (!current.followSystem) return current;
        const next = getSystemTheme(media);
        return current.theme === next ? current : { ...current, theme: next };
      });
    };
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [themeState.theme]);

  return (
    <ToggleGroup
      type="single"
      value={themeState.theme}
      suppressHydrationWarning
      onValueChange={(value) => {
        if (!value) return;
        const next = value as Theme;
        setThemeState({ theme: next, followSystem: false });
        window.localStorage.setItem(THEME_STORAGE_KEY, next);
        applyTheme(next);
      }}
      className="bg-card flex-nowrap rounded-full border border-indigo-200 p-1 px-1 dark:border-indigo-500/30"
      aria-label="Theme switcher"
    >
      {themes.map((item) => {
        const Icon = item.icon;
        return (
          <ToggleGroupItem
            key={item.value}
            value={item.value}
            className="rounded-full px-3 py-2 text-xs font-semibold data-[state=on]:bg-indigo-500/16 data-[state=on]:text-indigo-700 dark:data-[state=on]:bg-indigo-500/24 dark:data-[state=on]:text-indigo-200"
            aria-label={item.label}
          >
            <Icon className="h-4 w-4" />
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
}
