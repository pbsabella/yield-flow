import { addDays, addTermMonths, differenceInCalendarDays, toISODate } from "@/lib/domain/date";
import type { InterestTier } from "@/types";

/**
 * simple: One flat rate for the whole amount.
 * tiered: Rates change based on how much you have (e.g., first 1M is 6%, rest is 3%).
 */
export type InterestMode = "simple" | "tiered";

export type YieldInput = {
  principal: number;
  startDate: string;
  termMonths: number;
  /** Term in calendar days. When set, takes precedence over termMonths. */
  termDays?: number;
  /** mark true for savings/open-ended products (preview may still use a 12-month estimate) */
  isOpenEnded?: boolean;
  flatRate: number;
  tiers: InterestTier[];
  interestMode: InterestMode;
  /**
   * reinvest: Interest is added to the pile (Principal grows).
   * payout: Interest is sent to your wallet (Principal stays same).
   */
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

/**
 * THE SNOWBALL:
 * Every day/month, the interest is added back to the principal.
 * You earn interest on your interest.
 */
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

/**
 * THE BUCKET:
 * Money is split into "brackets." Each bracket calculates interest
 * separately, but the interest is NOT added back to the principal.
 */
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
  const maturity =
    input.termDays != null
      ? addDays(start, input.termDays)
      : addTermMonths(start, input.termMonths);
  const dayCount = Math.max(1, differenceInCalendarDays(maturity, start));
  const maturityDate = toISODate(maturity);
  const dayCountConvention = input.dayCountConvention ?? DEFAULT_DAYS_IN_YEAR;

  let grossInterest = 0;

  const isPayout = input.interestTreatment === "payout";
  const cadence = input.compounding ?? "daily";

  /**
   * BRANCH 1: FLAT RATE
   * Used when the rate is the same regardless of the amount.
   * Example: A 6-month Time Deposit.
   */
  if (input.interestMode === "simple") {
    grossInterest = input.principal * input.flatRate * (dayCount / dayCountConvention);
  }
  /**
   * BRANCH 2: TIERED RATE (Brackets)
   * Used when different slices of your money earn different rates.
   */
  else {
    // Derive effective term in months for cadences that need it.
    // If the deposit was entered in days, approximate months from the day count convention.
    const termMonthsEffective =
      input.termDays != null
        ? Math.round(input.termDays / (dayCountConvention / 12))
        : input.termMonths;

    if (isPayout) {
      /**
       * Interest is removed from the account regularly.
       * Principal stays the same size for the whole term.
       */
      const ratePer = cadence === "monthly" ? 1 / 12 : 1 / dayCountConvention;
      const periods = cadence === "monthly" ? termMonthsEffective : dayCount;
      grossInterest = calculateTieredSimple(input.principal, input.tiers, periods, ratePer);
    } else {
      /**
       * Interest is rolled back into the principal.
       * The "pile" of money grows larger over time.
       */
      grossInterest = calculateTieredCompounded(
        input.principal,
        input.tiers,
        dayCount,
        cadence,
        termMonthsEffective,
        dayCountConvention,
      );
    }
  }

  // Final step: Deduct the government's share (Tax)
  const netInterest = grossInterest * (1 - input.taxRate);

  return {
    grossInterest,
    netInterest,
    maturityDate,
    dayCount,
  };
}
