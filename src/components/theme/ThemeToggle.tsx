"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type Theme = "light" | "dark";

const themes = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
] as const;

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.setProperty("--theme", theme);
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <ToggleGroup
      type="single"
      value={theme}
      suppressHydrationWarning
      onValueChange={(value) => {
        if (!value) return;
        const next = value as Theme;
        setTheme(next);
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
