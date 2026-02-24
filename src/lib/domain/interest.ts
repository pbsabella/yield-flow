import type { Bank, DepositSummary, TimeDeposit } from "@/types";
import { calculateNetYield } from "@/lib/domain/yield-engine";

// Projection window for open-ended deposits (rolling 12 months).
const OPEN_ENDED_PROJECTION_MONTHS = 12;

export function buildDepositSummary(deposit: TimeDeposit, bank: Bank): DepositSummary {
  if (deposit.isOpenEnded) {
    // Open-ended deposits have no fixed maturity. Project interest over a
    // rolling 12-month window for display purposes only.
    const result = calculateNetYield({
      principal: deposit.principal,
      startDate: deposit.startDate,
      termMonths: OPEN_ENDED_PROJECTION_MONTHS,
      flatRate: deposit.flatRate,
      tiers: deposit.tiers,
      interestMode: deposit.interestMode,
      interestTreatment: deposit.interestTreatment,
      compounding: deposit.compounding,
      taxRate: deposit.taxRateOverride ?? bank.taxRate,
      dayCountConvention: deposit.dayCountConvention ?? 365,
    });

    return {
      deposit,
      bank,
      maturityDate: null,
      grossInterest: result.grossInterest,
      netInterest: result.netInterest,
      grossTotal: deposit.principal + result.grossInterest,
      netTotal: deposit.principal + result.netInterest,
    };
  }

  const result = calculateNetYield({
    principal: deposit.principal,
    startDate: deposit.startDate,
    termMonths: deposit.termMonths,
    flatRate: deposit.flatRate,
    tiers: deposit.tiers,
    interestMode: deposit.interestMode,
    interestTreatment: deposit.interestTreatment,
    compounding: deposit.compounding,
    taxRate: deposit.taxRateOverride ?? bank.taxRate,
    dayCountConvention: deposit.dayCountConvention ?? 365,
  });

  return {
    deposit,
    bank,
    maturityDate: result.maturityDate,
    grossInterest: result.grossInterest,
    netInterest: result.netInterest,
    grossTotal: deposit.principal + result.grossInterest,
    netTotal: deposit.principal + result.netInterest,
  };
}
