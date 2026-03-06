"use client";

import { useMemo } from "react";
import { ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import { usePortfolioContext, useFormatterContext } from "@/features/portfolio/context/PortfolioContext";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
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
  const { preferences } = usePortfolioContext();
  const { fmtCurrency } = useFormatterContext();
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
    <div>
      {/* ── Mobile list (hidden on md+) ── */}
      <Card className="gap-0 py-0 md:hidden text-sm">
        <CardContent className="p-0">
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
              <div key={group.id} className="border-b last:border-0 px-card-x py-stack-sm">
                <div className="flex items-center justify-between gap-stack-sm mb-stack-xs">
                  <span className="font-medium truncate">{group.name}</span>
                  {hasLimit && pct != null && CoverageIcon != null && (
                    <span className={cn("inline-flex items-center gap-1 tabular-nums font-medium text-xs shrink-0", labelColor)}>
                      <CoverageIcon size={14} aria-hidden="true" />
                      {pct > 100 ? `${Math.round(pct)}% over` : `${Math.round(pct)}%`}
                    </span>
                  )}
                </div>
                <div className="flex justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Principal</p>
                    <p className="tabular-nums">{fmtCurrency(group.totalPrincipal)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Net interest</p>
                    <p className="tabular-nums font-medium text-accent-fg">{fmtCurrency(group.totalNetInterest)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
        {hasLimit && (
          <CardFooter className="text-xs text-muted-foreground">
            Deposit insurance limit: {fmtCurrency(limit)} per bank
          </CardFooter>
        )}
      </Card>

      {/* ── Desktop table (hidden below md) ── */}
      <div className="hidden md:block">
        <Card className="gap-0 py-0 text-sm">
          <CardContent className="p-0">
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
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
          {hasLimit && (
            <CardFooter className="text-xs text-muted-foreground">
              Deposit insurance limit: {fmtCurrency(limit)} per bank
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
