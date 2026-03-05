"use client";

import { useMemo } from "react";
import { usePortfolioContext } from "@/features/portfolio/context/PortfolioContext";
import { cn } from "@/lib/utils";
import type { EnrichedSummary } from "@/features/portfolio/hooks/usePortfolioData";

type Props = {
  summaries: EnrichedSummary[]; // active-only + bank-filtered, computed by caller
};

type BankGroup = {
  id: string;
  name: string;
  totalPrincipal: number;
  totalNetInterest: number;
};

export function BankActiveSummary({ summaries }: Props) {
  const { fmtCurrency, preferences } = usePortfolioContext();
  const limit = preferences.bankInsuranceLimit;

  const groups = useMemo<BankGroup[]>(() => {
    const map = new Map<string, BankGroup>();
    for (const s of summaries) {
      const key = s.bank.id;
      if (!map.has(key)) {
        map.set(key, { id: key, name: s.bank.name, totalPrincipal: 0, totalNetInterest: 0 });
      }
      const g = map.get(key)!;
      g.totalPrincipal += s.deposit.principal;
      g.totalNetInterest += s.netInterest;
    }
    return [...map.values()].sort((a, b) => b.totalPrincipal - a.totalPrincipal);
  }, [summaries]);

  if (groups.length === 0) return null;

  const hasLimit = limit != null;

  return (
    <div className="rounded-lg border bg-card overflow-hidden text-sm">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
              Bank
            </th>
            <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">
              Principal
            </th>
            <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">
              Net interest
            </th>
            {hasLimit && (
              <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground w-40">
                Coverage
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => {
            const pct = hasLimit ? (group.totalPrincipal / limit) * 100 : null;
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
              <tr key={group.id} className="border-b last:border-0">
                <td className="px-4 py-2.5 font-medium max-w-0 truncate">{group.name}</td>
                <td className="px-4 py-2.5 text-right tabular-nums whitespace-nowrap">
                  {fmtCurrency(group.totalPrincipal)}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums whitespace-nowrap font-medium text-income-net-fg">
                  {fmtCurrency(group.totalNetInterest)}
                </td>
                {hasLimit && (
                  <td className="px-4 py-2.5 w-40">
                    {pct != null && (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn("h-full rounded-full", barColor)}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <span className={cn("tabular-nums text-xs font-medium shrink-0 w-14 text-right", labelColor)}>
                          {pct > 100 ? `${Math.round(pct)}% over` : `${Math.round(pct)}%`}
                        </span>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
        {hasLimit && (
          <tfoot>
            <tr className="border-t bg-muted/40">
              <td colSpan={hasLimit ? 4 : 3} className="px-4 py-2 text-xs text-muted-foreground">
                Deposit insurance limit: {fmtCurrency(limit)} per bank
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
