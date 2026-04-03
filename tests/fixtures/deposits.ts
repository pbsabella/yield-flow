import type { TimeDeposit } from "../../src/types";

/** A 6-month active time deposit starting 2026-03-01. Used across close and a11y tests. */
export function makeActiveTimeDeposit(overrides: Partial<TimeDeposit> = {}): TimeDeposit {
  return {
    id: "fixture-active-td",
    bankId: "Beacon Bank",
    name: "Beacon 6M TD",
    principal: 200_000,
    startDate: "2026-03-01",
    termMonths: 6,
    interestMode: "simple",
    interestTreatment: "payout",
    compounding: "daily",
    taxRateOverride: 0.2,
    flatRate: 0.06,
    tiers: [{ upTo: null, rate: 0.06 }],
    payoutFrequency: "maturity",
    dayCountConvention: 365,
    isOpenEnded: false,
    status: "active",
    ...overrides,
  };
}

/** A closed time deposit with a closeDate in the past. Used in reopen and a11y tests. */
export function makeClosedTimeDeposit(overrides: Partial<TimeDeposit> = {}): TimeDeposit {
  return {
    id: "fixture-closed-td",
    bankId: "Beacon Bank",
    name: "Beacon 3M (closed)",
    principal: 150_000,
    startDate: "2025-09-01",
    termMonths: 6,
    interestMode: "simple",
    interestTreatment: "payout",
    compounding: "daily",
    taxRateOverride: 0.2,
    flatRate: 0.055,
    tiers: [{ upTo: null, rate: 0.055 }],
    payoutFrequency: "maturity",
    dayCountConvention: 365,
    isOpenEnded: false,
    status: "closed",
    closeDate: "2026-01-15",
    ...overrides,
  };
}
