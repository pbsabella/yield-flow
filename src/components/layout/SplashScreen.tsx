"use client";

import { TrendingUp } from "lucide-react";

export function SplashScreen() {
  return (
    <div
      className="flex min-h-dvh items-center justify-center bg-background"
      role="status"
      aria-label="Loading"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-4 animate-pulse">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10">
          <TrendingUp
            className="size-7 text-primary dark:text-primary-subtle"
            aria-hidden="true"
          />
        </div>
        <span className="text-sm font-medium text-muted-foreground">YieldFlow</span>
      </div>
    </div>
  );
}
