import type { Bank, DepositSummary, TimeDeposit } from "@/lib/types";
import { calculateNetYield } from "@/lib/yield-engine";

export function buildDepositSummary(deposit: TimeDeposit, bank: Bank): DepositSummary {
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
