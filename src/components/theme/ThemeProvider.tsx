"use client";

import { useEffect } from "react";

type Theme = "light" | "dark" | "system";

const THEME_STORAGE_KEY = "theme";

function resolveTheme(theme: Theme, media: MediaQueryList) {
  return theme === "system" ? (media.matches ? "dark" : "light") : theme;
}

function applyTheme(theme: Theme, media: MediaQueryList) {
  const resolved = resolveTheme(theme, media);
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.style.setProperty("--theme", resolved);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    const initial: Theme =
      stored === "light" || stored === "dark" || stored === "system" ? stored : "system";

    applyTheme(initial, media);

    const handleChange = () => applyTheme(initial, media);
    if (initial === "system") {
      media.addEventListener("change", handleChange);
      return () => media.removeEventListener("change", handleChange);
    }

    return undefined;
  }, []);

  return <>{children}</>;
}
