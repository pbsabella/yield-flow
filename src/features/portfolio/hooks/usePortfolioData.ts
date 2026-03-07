"use client";

import { useMemo } from "react";
import { buildDepositSummary } from "@/lib/domain/interest";
import { buildMonthlyAllowance } from "@/lib/domain/cashflow";
import { monthKey, parseLocalDate } from "@/lib/domain/date";
import type { Bank, DepositSummary, TimeDeposit } from "@/types";

export type EnrichedSummary = DepositSummary & {
  // Derived-only status for UI display. Never written back to storage.
  // active → matured when today >= maturityDate; settled is always settled.
  effectiveStatus: TimeDeposit["status"];
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
};

export type PortfolioData = {
  summaries: EnrichedSummary[];
  totalPrincipal: number;
  currentMonthBreakdown: CurrentMonthBreakdown;
  nextMaturity: NextMaturity | null;
  // Projection: excludes settled deposits. Used for 12-month cash flow view.
  monthlyAllowance: ReturnType<typeof buildMonthlyAllowance>;
  // Full current-month picture: includes active + matured + settled entries.
  currentMonthFull: ReturnType<typeof buildMonthlyAllowance>[number] | null;
};

function deriveEffectiveStatus(
  deposit: TimeDeposit,
  maturityDate: string | null,
  today: Date,
): TimeDeposit["status"] {
  if (deposit.status === "settled") return "settled";
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
  // Single "today" snapshot shared across all memos for a consistent render cycle.
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

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
      .filter((s) => s.effectiveStatus !== "settled")
      .reduce((sum, s) => sum + s.deposit.principal, 0);
  }, [summaries]);

  // Current month: use ALL summaries (including settled) so the Income This Month
  // card reflects the full picture — settled payouts are confirmed income.
  // Also derives currentMonthFull here to avoid a second buildMonthlyAllowance(summaries) call.
  const { currentMonthBreakdown, currentMonthFull } = useMemo(() => {
    const todayKey = monthKey(today);
    const allAllowance = buildMonthlyAllowance(summaries);
    const thisMonth = allAllowance.find((m) => m.monthKey === todayKey) ?? null;

    const breakdown: CurrentMonthBreakdown = thisMonth
      ? {
          net: thisMonth.net,
          pendingNet: thisMonth.entries
            .filter((e) => e.status === "matured")
            .reduce((sum, e) => sum + e.amountNet, 0),
          settledNet: thisMonth.entries
            .filter((e) => e.status === "settled")
            .reduce((sum, e) => sum + e.amountNet, 0),
        }
      : { net: 0, pendingNet: 0, settledNet: 0 };

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
    // Projection excludes settled — their cash has already been received.
    const projectionSummaries = summaries.filter((s) => s.effectiveStatus !== "settled");
    return buildMonthlyAllowance(projectionSummaries);
  }, [summaries]);

  return { summaries, totalPrincipal, currentMonthBreakdown, nextMaturity, monthlyAllowance, currentMonthFull };
}
