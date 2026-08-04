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
  const { value: preferences, setValue: setPreferences, setValueSync } = useLocalStorage<Preferences>(
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

  // Used during import: persists synchronously before updating React state, so
  // the value survives any component re-initialization triggered by navigation.
  const importPreferences = useCallback(
    (partial: Partial<Preferences>) => {
      setValueSync((current) => ({ ...current, ...partial }));
    },
    [setValueSync],
  );

  return { preferences, setPreference, importPreferences } as const;
}
