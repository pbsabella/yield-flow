"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePortfolioContext } from "@/features/dashboard/context/PortfolioContext";
import { cn } from "@/lib/utils";

type BankGroup = {
  displayName: string;
  total: number;
};

export function BankExposureCard() {
  const { deposits, fmtCurrency, preferences } = usePortfolioContext();
  const limit = preferences.bankInsuranceLimit;

  const groups = useMemo<BankGroup[]>(() => {
    const map = new Map<string, BankGroup>();
    for (const d of deposits) {
      if (d.status === "settled") continue;
      const key = d.bankId.trim().toLowerCase();
      if (!map.has(key)) {
        map.set(key, { displayName: d.bankId.trim(), total: 0 });
      }
      map.get(key)!.total += d.principal;
    }
    return [...map.values()].sort((a, b) => b.total - a.total);
  }, [deposits]);

  if (groups.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Exposure by Bank
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {groups.map((group) => {
          const pct = limit ? (group.total / limit) * 100 : null;
          const barColor =
            pct == null
              ? null
              : pct > 100
                ? "bg-progress-alert-fill"
                : pct > 80
                  ? "bg-progress-warning-fill"
                  : "bg-progress-success-fill";

          const labelColor =
            pct == null
              ? null
              : pct > 100
                ? "text-progress-alert-text"
                : pct > 80
                  ? "text-progress-warning-text"
                  : "text-progress-success-text";

          return (
            <div key={group.displayName} className="space-y-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium truncate">{group.displayName}</span>
                <span className="text-sm tabular-nums shrink-0">{fmtCurrency(group.total)}</span>
              </div>
              {pct != null && (
                <div className="flex items-center gap-2">
                  {/* Progress track */}
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", barColor)}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <span className={cn("text-xs tabular-nums shrink-0 font-medium", labelColor)}>
                    {pct > 100 ? `${Math.round(pct)}% — over limit` : `${Math.round(pct)}%`}
                  </span>
                </div>
              )}
            </div>
          );
        })}
        {limit != null && (
          <p className="text-xs text-muted-foreground pt-1 border-t border-border">
            Limit: {fmtCurrency(limit)} per bank
          </p>
        )}
      </CardContent>
    </Card>
  );
}
