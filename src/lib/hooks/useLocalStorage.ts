// Primary storage abstraction for YieldFlow.
// All localStorage access must go through this hook.
// Do not use localStorage directly anywhere in the codebase.
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

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
  const latestValueRef = useRef<T>(initialValue);
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
    latestValueRef.current = value;
  }, [value]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isReady) return;
    if (skipInitialWrite && !hasHandledInitialWrite.current) {
      hasHandledInitialWrite.current = true;
      return;
    }

    const shouldPersist = persistWhen ? persistWhen(value) : true;
    if (!shouldPersist) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      toast.error("Couldn't save — your browser storage may be full")
    }
  }, [isReady, key, persistWhen, skipInitialWrite, value]);

  const remove = useCallback(() => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key);
  }, [key]);

  // Synchronous write that bypasses the async persist effect. Used when the
  // value must survive an imminent unmount (e.g. persisting preferences before
  // navigation during import), since effects may not flush in time.
  const setValueSync = useCallback(
    (next: T | ((prev: T) => T)) => {
      if (typeof window === "undefined") return;
      const resolved =
        typeof next === "function" ? (next as (prev: T) => T)(latestValueRef.current) : next;
      try {
        window.localStorage.setItem(key, JSON.stringify(resolved));
      } catch {
        toast.error("Couldn't save — your browser storage may be full");
      }
      setValue(resolved);
    },
    [key],
  );

  return { value, setValue, setValueSync, isReady, remove } as const;
}
