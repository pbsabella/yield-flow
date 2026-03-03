"use client";

import { useMediaQuery } from "@/lib/hooks/useMediaQuery";

/** Returns true when the user has requested reduced motion via OS or browser settings. */
export function useReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
