"use client";

import { useLocalStorage } from "@/lib/state/useLocalStorage";
import type { TimeDeposit } from "@/lib/types";

const DEPOSITS_KEY = "yf:deposits";

export function usePersistedDeposits() {
  const { value: deposits, setValue: setDeposits, isReady } = useLocalStorage<TimeDeposit[]>(
    DEPOSITS_KEY,
    [],
  );

  return { deposits, setDeposits, isReady } as const;
}
