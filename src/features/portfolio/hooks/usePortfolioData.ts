"use client";

import { useEffect, useMemo, useState } from "react";
import { buildDepositSummary } from "@/lib/domain/interest";
import { buildCashFlowProjection, buildCashFlowLedger } from "@/lib/domain/cashflow";
import { monthKey, parseLocalDate } from "@/lib/domain/date";
import type { Bank, DepositSummary, MonthlyAllowance, TimeDeposit } from "@/types";

/** Runtime-derived display status. Never persisted to storage. */
export type EffectiveStatus = TimeDeposit["status"];

export type EnrichedSummary = DepositSummary & {
  // Derived-only status for UI display. Never written back to storage.
  // active → matured when today >= maturityDate; settled/closed are terminal.
  effectiveStatus: EffectiveStatus;
};

export type NextMaturity = {
  depositId: string;
  name: string;
  bankName: string;
  maturityDate: string;
  netProceeds: number;
};

export type CurrentMonthBreakdown = {
  net: number;
  // Net amount from matured (unsettled) deposits with a payout this month.
  pendingNet: number;
  // Net amount from settled deposits with a payout this month.
  settledNet: number;
  // Net amount from deposits closed early this month (principal + accrued returned).
  closedNet: number;
};

export type PortfolioData = {
  summaries: EnrichedSummary[];
  totalPrincipal: number;
  currentMonthBreakdown: CurrentMonthBreakdown;
  nextMaturity: NextMaturity | null;
  // Forward projection: excludes settled/closed deposits. Used for 12-month cash flow view.
  monthlyAllowance: MonthlyAllowance[];
  // Full current-month ledger: includes active + matured + settled + closed entries.
  currentMonthFull: MonthlyAllowance | null;
};

function deriveEffectiveStatus(
  deposit: TimeDeposit,
  maturityDate: string | null,
  today: Date,
): EffectiveStatus {
  // Terminal states that require no auto-transition.
  if (deposit.status === "settled") return "settled";
  if (deposit.status === "closed") return "closed";
  if (deposit.status === "active" && maturityDate !== null) {
    // parseLocalDate parses as local midnight (not UTC midnight) so the
    // comparison fires at midnight on the due date, not 8 hours later (UTC+8).
    const maturity = parseLocalDate(maturityDate);
    if (maturity <= today) return "matured";
  }
  return deposit.status;
}

export function usePortfolioData(
  deposits: TimeDeposit[],
  banks: Bank[],
): PortfolioData {
  // Re-tick once per minute so maturity transitions fire correctly when the
  // app is left open overnight. Without this, today is stale until remount.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  // Single "today" snapshot shared across all memos for a consistent render cycle.
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  const bankMap = useMemo(() => {
    const m = new Map<string, Bank>();
    for (const b of banks) m.set(b.id, b);
    return m;
  }, [banks]);

  const summaries = useMemo<EnrichedSummary[]>(() => {
    return deposits.flatMap((deposit) => {
      // Synthesize a bank from the deposit when not in the static map.
      // New deposits store the free-text bank name in bankId; taxRateOverride
      // is always set on wizard-created deposits, so bank.taxRate never fires.
      const bank = bankMap.get(deposit.bankId) ?? {
        id: deposit.bankId,
        name: deposit.bankId,
        taxRate: deposit.taxRateOverride ?? 0.2,
      };

      const base = buildDepositSummary(deposit, bank);
      const effectiveStatus = deriveEffectiveStatus(deposit, base.maturityDate, today);
      return [{ ...base, effectiveStatus }];
    });
  }, [deposits, bankMap, today]);

  const totalPrincipal = useMemo(() => {
    return summaries
      .filter((s) => s.effectiveStatus !== "settled" && s.effectiveStatus !== "closed")
      .reduce((sum, s) => sum + s.deposit.principal, 0);
  }, [summaries]);

  // Ledger: use ALL summaries so the Income This Month card reflects the full
  // picture — settled payouts are confirmed income, closed entries show early exits.
  const { currentMonthBreakdown, currentMonthFull } = useMemo(() => {
    const todayKey = monthKey(today);
    const ledger = buildCashFlowLedger(summaries, today);
    const thisMonth = ledger.find((m) => m.monthKey === todayKey) ?? null;

    const breakdown: CurrentMonthBreakdown = thisMonth
      ? {
          net: thisMonth.net,
          pendingNet: thisMonth.entries
            .filter((e) => e.status === "matured")
            .reduce((sum, e) => sum + e.amountNet, 0),
          settledNet: thisMonth.entries
            .filter((e) => e.status === "settled")
            .reduce((sum, e) => sum + e.amountNet, 0),
          closedNet: thisMonth.entries
            .filter((e) => e.status === "closed")
            .reduce((sum, e) => sum + e.amountNet, 0),
        }
      : { net: 0, pendingNet: 0, settledNet: 0, closedNet: 0 };

    return { currentMonthBreakdown: breakdown, currentMonthFull: thisMonth };
  }, [summaries, today]);

  const nextMaturity = useMemo<NextMaturity | null>(() => {
    const candidates = summaries
      .filter(
        (s) =>
          s.effectiveStatus === "active" &&
          s.maturityDate !== null &&
          parseLocalDate(s.maturityDate) > today,
      )
      .sort((a, b) => a.maturityDate!.localeCompare(b.maturityDate!));

    const next = candidates[0];
    if (!next) return null;

    return {
      depositId: next.deposit.id,
      name: next.deposit.name,
      bankName: next.bank.name,
      maturityDate: next.maturityDate!,
      netProceeds: next.netTotal,
    };
  }, [summaries, today]);

  const monthlyAllowance = useMemo(() => {
    // Projection excludes settled and closed — their cash has already been received.
    const projectionSummaries = summaries.filter(
      (s) => s.effectiveStatus !== "settled" && s.effectiveStatus !== "closed",
    );
    return buildCashFlowProjection(projectionSummaries, today);
  }, [summaries, today]);

  return { summaries, totalPrincipal, currentMonthBreakdown, nextMaturity, monthlyAllowance, currentMonthFull };
}
