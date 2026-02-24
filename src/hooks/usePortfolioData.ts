"use client";

import { useMemo } from "react";
import { buildDepositSummary } from "@/lib/domain/interest";
import { buildMonthlyAllowance } from "@/lib/domain/cashflow";
import { monthKey } from "@/lib/domain/date";
import type { Bank, DepositSummary, TimeDeposit } from "@/lib/types";

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

export type PortfolioData = {
  summaries: EnrichedSummary[];
  totalPrincipal: number;
  incomeThisMonth: number;
  nextMaturity: NextMaturity | null;
  monthlyAllowance: ReturnType<typeof buildMonthlyAllowance>;
};

function deriveEffectiveStatus(
  deposit: TimeDeposit,
  maturityDate: string | null,
  today: Date,
): TimeDeposit["status"] {
  if (deposit.status === "settled") return "settled";
  if (deposit.status === "active" && maturityDate !== null) {
    const maturity = new Date(maturityDate);
    // Compare date-only by stripping time.
    if (maturity <= today) return "matured";
  }
  return deposit.status;
}

export function usePortfolioData(
  deposits: TimeDeposit[],
  banks: Bank[],
): PortfolioData {
  const bankMap = useMemo(() => {
    const m = new Map<string, Bank>();
    for (const b of banks) m.set(b.id, b);
    return m;
  }, [banks]);

  const summaries = useMemo<EnrichedSummary[]>(() => {
    // Normalise "today" to midnight so date comparisons are day-accurate.
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return deposits.flatMap((deposit) => {
      const bank = bankMap.get(deposit.bankId);
      if (!bank) return []; // Skip deposits whose bank is not found.

      const base = buildDepositSummary(deposit, bank);
      const effectiveStatus = deriveEffectiveStatus(deposit, base.maturityDate, today);
      return [{ ...base, effectiveStatus }];
    });
  }, [deposits, bankMap]);

  const totalPrincipal = useMemo(() => {
    return summaries
      .filter((s) => s.effectiveStatus !== "settled")
      .reduce((sum, s) => sum + s.deposit.principal, 0);
  }, [summaries]);

  const incomeThisMonth = useMemo(() => {
    const todayKey = monthKey(new Date());
    const activeSummaries = summaries.filter((s) => s.effectiveStatus !== "settled");
    const allowance = buildMonthlyAllowance(activeSummaries);
    const thisMonth = allowance.find((m) => m.monthKey === todayKey);
    return thisMonth?.net ?? 0;
  }, [summaries]);

  const nextMaturity = useMemo<NextMaturity | null>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const candidates = summaries
      .filter(
        (s) =>
          s.effectiveStatus === "active" &&
          s.maturityDate !== null &&
          new Date(s.maturityDate) > today,
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
  }, [summaries]);

  const monthlyAllowance = useMemo(() => {
    // Exclude settled deposits — their cash has already been received.
    const activeSummaries = summaries.filter((s) => s.effectiveStatus !== "settled");
    return buildMonthlyAllowance(activeSummaries);
  }, [summaries]);

  return { summaries, totalPrincipal, incomeThisMonth, nextMaturity, monthlyAllowance };
}
