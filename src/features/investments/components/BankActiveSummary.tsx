"use client";

import { useMemo } from "react";
import { ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
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
            <th className="px-card-x py-stack-xs text-left text-xs font-medium text-muted-foreground">
              Bank
            </th>
            <th className="px-card-x py-stack-xs text-right text-xs font-medium text-muted-foreground">
              Principal
            </th>
            <th className="px-card-x py-stack-xs text-right text-xs font-medium text-muted-foreground">
              Net interest
            </th>
            {hasLimit && (
              <th className="px-card-x py-stack-xs text-right text-xs font-medium text-muted-foreground">
                Coverage
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => {
            const pct = hasLimit ? (group.totalPrincipal / limit) * 100 : null;
            const labelColor =
              pct == null
                ? null
                : pct > 100
                  ? "text-progress-alert-text"
                  : pct > 80
                    ? "text-progress-warning-text"
                    : "text-progress-success-text";
            const CoverageIcon =
              pct == null ? null : pct > 100 ? ShieldX : pct > 80 ? ShieldAlert : ShieldCheck;

            return (
              <tr key={group.id} className="border-b last:border-0">
                <td className="px-card-x py-2.5 font-medium max-w-0 truncate">{group.name}</td>
                <td className="px-card-x py-2.5 text-right tabular-nums whitespace-nowrap">
                  {fmtCurrency(group.totalPrincipal)}
                </td>
                <td className="px-card-x py-2.5 text-right tabular-nums whitespace-nowrap font-medium text-accent-fg">
                  {fmtCurrency(group.totalNetInterest)}
                </td>
                {hasLimit && (
                  <td className="px-card-x py-2.5 text-right">
                    {pct != null && CoverageIcon != null && (
                      <span className={cn("inline-flex items-center justify-end gap-1 tabular-nums font-medium", labelColor)}>
                        <CoverageIcon size={16} aria-hidden="true" />
                        {pct > 100 ? `${Math.round(pct)}% over` : `${Math.round(pct)}%`}
                      </span>
                    )}
                  </td>
                )
                }
              </tr>
            );
          })}
        </tbody>
        {hasLimit && (
          <tfoot>
            <tr className="border-t bg-muted/40">
              <td colSpan={hasLimit ? 4 : 3} className="px-card-x py-stack-xs text-xs text-muted-foreground">
                Deposit insurance limit: {fmtCurrency(limit)} per bank
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div >
  );
}
