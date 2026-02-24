import { addTermMonths, differenceInCalendarDays, toISODate } from "@/lib/domain/date";
import type { InterestTier } from "@/types";

export type InterestMode = "simple" | "tiered";

export type YieldInput = {
  principal: number;
  startDate: string;
  termMonths: number;
  flatRate: number;
  tiers: InterestTier[];
  interestMode: InterestMode;
  interestTreatment?: "reinvest" | "payout";
  compounding?: "daily" | "monthly";
  taxRate: number;
  dayCountConvention?: 360 | 365;
};

export type YieldResult = {
  grossInterest: number;
  netInterest: number;
  maturityDate: string;
  dayCount: number;
};

const DEFAULT_DAYS_IN_YEAR = 365;

function sortTiers(tiers: InterestTier[]) {
  return [...tiers].sort((a, b) => {
    if (a.upTo === null) return 1;
    if (b.upTo === null) return -1;
    return a.upTo - b.upTo;
  });
}

function calculateTieredCompounded(
  principal: number,
  tiers: InterestTier[],
  days: number,
  compounding: "daily" | "monthly" = "daily",
  months: number,
  dayCountConvention: 360 | 365,
) {
  const sorted = sortTiers(tiers);
  let remaining = principal;
  let lastThreshold = 0;
  let total = 0;

  for (const tier of sorted) {
    if (remaining <= 0) break;
    const cap = tier.upTo ?? Infinity;
    const available = Math.max(cap - lastThreshold, 0);
    const portion = Math.min(remaining, available);
    const gross =
      compounding === "monthly"
        ? portion * Math.pow(1 + tier.rate / 12, months)
        : portion * Math.pow(1 + tier.rate / dayCountConvention, days);
    total += gross - portion;
    remaining -= portion;
    lastThreshold = cap;
  }

  return total;
}

function calculateTieredSimple(
  principal: number,
  tiers: InterestTier[],
  periods: number,
  ratePerPeriod: number,
) {
  const sorted = sortTiers(tiers);
  let remaining = principal;
  let lastThreshold = 0;
  let total = 0;

  for (const tier of sorted) {
    if (remaining <= 0) break;
    const cap = tier.upTo ?? Infinity;
    const available = Math.max(cap - lastThreshold, 0);
    const portion = Math.min(remaining, available);
    total += portion * tier.rate * ratePerPeriod * periods;
    remaining -= portion;
    lastThreshold = cap;
  }

  return total;
}

export function calculateNetYield(input: YieldInput): YieldResult {
  const start = new Date(input.startDate);
  const maturity = addTermMonths(start, input.termMonths);
  const dayCount = Math.max(1, differenceInCalendarDays(maturity, start));
  const maturityDate = toISODate(maturity);
  const dayCountConvention = input.dayCountConvention ?? DEFAULT_DAYS_IN_YEAR;

  let grossInterest = 0;

  const isPayout = input.interestTreatment === "payout";
  const cadence = input.compounding ?? "daily";

  if (input.interestMode === "simple") {
    // Day-count-aware simple interest:
    // gross = principal * annualRate * (termDays / dayCountConvention)
    grossInterest = input.principal * input.flatRate * (dayCount / dayCountConvention);
  } else {
    if (isPayout) {
      const ratePer = cadence === "monthly" ? 1 / 12 : 1 / dayCountConvention;
      const periods = cadence === "monthly" ? input.termMonths : dayCount;
      grossInterest = calculateTieredSimple(
        input.principal,
        input.tiers,
        periods,
        ratePer,
      );
    } else {
      grossInterest = calculateTieredCompounded(
        input.principal,
        input.tiers,
        dayCount,
        cadence,
        input.termMonths,
        dayCountConvention,
      );
    }
  }

  const netInterest = grossInterest * (1 - input.taxRate);

  return {
    grossInterest,
    netInterest,
    maturityDate,
    dayCount,
  };
}
