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
      className="bg-card flex-nowrap rounded-full border p-1 px-1"
      aria-label="Theme switcher"
    >
      {themes.map((item) => {
        const Icon = item.icon;
        return (
          <ToggleGroupItem
            key={item.value}
            value={item.value}
            className="text-foreground data-[state=on]:bg-interactive-selected data-[state=on]:border-interactive-selected-border data-[state=on]:text-foreground rounded-full"
            aria-label={item.label}
          >
            <Icon className="h-4 w-4" />
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
}
