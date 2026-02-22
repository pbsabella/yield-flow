// Primary storage abstraction for YieldFlow.
// All localStorage access must go through this hook.
// Do not use localStorage directly anywhere in the codebase.
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type UseLocalStorageOptions<T> = {
  persistWhen?: (value: T) => boolean;
  hydrate?: boolean;
  skipInitialWrite?: boolean;
};

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options?: UseLocalStorageOptions<T>,
) {
  const [value, setValue] = useState<T>(initialValue);
  const [isReady, setIsReady] = useState(false);
  const hasHandledInitialWrite = useRef(false);
  const persistWhen = options?.persistWhen;
  const hydrate = options?.hydrate ?? true;
  const skipInitialWrite = options?.skipInitialWrite ?? false;

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (hydrate) {
      const stored = window.localStorage.getItem(key);
      if (stored) {
        try {
          setValue(JSON.parse(stored) as T);
        } catch {
          setValue(initialValue);
        }
      }
    }
    setIsReady(true);
  }, [key, initialValue, hydrate]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!isReady) return;
    if (skipInitialWrite && !hasHandledInitialWrite.current) {
      hasHandledInitialWrite.current = true;
      return;
    }

    const shouldPersist = persistWhen ? persistWhen(value) : true;
    if (!shouldPersist) return;
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [isReady, key, persistWhen, skipInitialWrite, value]);

  const remove = useCallback(() => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key);
  }, [key]);

  return { value, setValue, isReady, remove } as const;
}
