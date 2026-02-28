"use client";

import { useCallback } from "react";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";

export type Preferences = {
  /** Display currency code (e.g. "PHP"). Vanity only — does not convert values. */
  currency: string;
  /** Optional deposit insurance limit per bank. When set, triggers exposure warnings. */
  bankInsuranceLimit?: number;
};

const DEFAULT_PREFERENCES: Preferences = {
  currency: "PHP",
};

export function usePreferences() {
  const { value: preferences, setValue: setPreferences } = useLocalStorage<Preferences>(
    "yf:preferences",
    DEFAULT_PREFERENCES,
  );

  const setPreference = useCallback(
    <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
      setPreferences((prev) => ({ ...prev, [key]: value }));
    },
    [setPreferences],
  );

  return { preferences, setPreference } as const;
}
