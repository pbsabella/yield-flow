import { calculateNetYield } from "@/lib/domain/yield-engine";
import { differenceInCalendarDays, parseLocalDate } from "@/lib/domain/date";
import type { Bank, TimeDeposit } from "@/types";
import type { YieldResult } from "@/lib/domain/yield-engine";

/**
 * Calculate pro-rated interest from a deposit's startDate up to a given closeDate.
 * Uses the deposit's own dayCountConvention (360 or 365, defaulting to 365).
 * Delegates to the existing yield engine — no duplicated math.
 */
export function calculateAccruedToDate(
  deposit: TimeDeposit,
  bank: Bank,
  closeDate: string,
): YieldResult {
  const daysHeld = Math.max(
    0,
    differenceInCalendarDays(
      parseLocalDate(closeDate),
      parseLocalDate(deposit.startDate),
    ),
  );

  return calculateNetYield({
    principal: deposit.principal,
    startDate: deposit.startDate,
    termMonths: 0,
    termDays: daysHeld,
    flatRate: deposit.flatRate,
    tiers: deposit.tiers,
    interestMode: deposit.interestMode,
    interestTreatment: deposit.interestTreatment,
    compounding: deposit.compounding,
    taxRate: deposit.taxRateOverride ?? bank.taxRate,
    dayCountConvention: deposit.dayCountConvention ?? 365,
  });
}
