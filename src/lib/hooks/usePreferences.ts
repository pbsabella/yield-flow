"use client";

import { useCallback } from "react";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";
import { getLocaleCurrency } from "@/lib/domain/format";

export type Preferences = {
  /** Display currency code (e.g. "PHP"). Vanity only — does not convert values. */
  currency: string;
  /** Optional deposit insurance limit per bank. When set, triggers exposure warnings. */
  bankInsuranceLimit?: number;
};

const PREFERENCES_KEY = "yf:preferences";

function getInitialPreferences(): Preferences {
  return { currency: getLocaleCurrency() };
}

export function usePreferences() {
  const { value: preferences, setValue: setPreferences } = useLocalStorage<Preferences>(
    PREFERENCES_KEY,
    getInitialPreferences(),
    { skipInitialWrite: true },
  );

  const setPreference = useCallback(
    <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
      setPreferences((prev) => ({ ...prev, [key]: value }));
    },
    [setPreferences],
  );

  // Used during import: writes to localStorage synchronously before updating React
  // state, so the value survives any component re-initialization triggered by navigation.
  const importPreferences = useCallback(
    (partial: Partial<Preferences>) => {
      let current: Preferences;

      try {
        const stored = window.localStorage.getItem(PREFERENCES_KEY);

        current = stored ? (JSON.parse(stored) as Preferences) : getInitialPreferences();
      } catch {
        current = getInitialPreferences();
      }

      const merged = { ...current, ...partial };

      try {
        window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify(merged));
      } catch {
        /* storage full */
      }

      setPreferences(merged);
    },
    [setPreferences],
  );

  return { preferences, setPreference, importPreferences } as const;
}
