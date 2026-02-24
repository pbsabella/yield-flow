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
  // Stabilize initialValue so callers can pass literals (e.g. []) without
  // triggering infinite hydration loops from a new reference each render.
  const initialValueRef = useRef(initialValue);

  const [value, setValue] = useState<T>(initialValue);
  const [isReady, setIsReady] = useState(false);
  const hasHandledInitialWrite = useRef(false);
  const persistWhen = options?.persistWhen;
  const hydrate = options?.hydrate ?? true;
  const skipInitialWrite = options?.skipInitialWrite ?? false;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (hydrate) {
      const stored = window.localStorage.getItem(key);
      if (stored) {
        try {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setValue(JSON.parse(stored) as T);
        } catch {
          setValue(initialValueRef.current);
        }
      }
    }
    setIsReady(true);
  }, [key, hydrate]);

  useEffect(() => {
    if (typeof window === "undefined") return;
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
