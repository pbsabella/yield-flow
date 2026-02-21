"use client";

import { useEffect, useState } from "react";

type UseLocalStorageOptions<T> = {
  persistWhen?: (value: T) => boolean;
};

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options?: UseLocalStorageOptions<T>,
) {
  const [value, setValue] = useState<T>(initialValue);
  const [isReady, setIsReady] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(key);
    if (stored) {
      try {
        setValue(JSON.parse(stored) as T);
      } catch {
        setValue(initialValue);
      }
    }
    setIsReady(true);
  }, [key, initialValue]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!isReady) return;
    const shouldPersist = options?.persistWhen ? options.persistWhen(value) : true;
    if (!shouldPersist) return;
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [isReady, key, options, value]);

  return { value, setValue, isReady } as const;
}
