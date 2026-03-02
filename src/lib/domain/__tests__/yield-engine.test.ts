import { describe, expect, it } from "vitest";
import { calculateNetYield } from "@/lib/domain/yield-engine";

describe("calculateNetYield", () => {
  it("uses month-based simple-interest math (spreadsheet parity)", () => {
    const result = calculateNetYield({
      principal: 250000,
      startDate: "2025-08-02",
      termMonths: 6,
      flatRate: 0.0525,
      tiers: [{ upTo: null, rate: 0.0525 }],
      interestMode: "simple",
      interestTreatment: "payout",
      compounding: "daily",
      taxRate: 0.2,
    });

    expect(result.maturityDate).toBe("2026-02-02");
    expect(result.grossInterest).toBeCloseTo(6616.438356, 6);
    expect(result.netInterest).toBeCloseTo(5293.150685, 6);
  });

  it("does not compound when simple mode is set to reinvest", () => {
    const payout = calculateNetYield({
      principal: 100000,
      startDate: "2025-10-24",
      termMonths: 3,
      flatRate: 0.055,
      tiers: [{ upTo: null, rate: 0.055 }],
      interestMode: "simple",
      interestTreatment: "payout",
      compounding: "monthly",
      taxRate: 0.2,
    });

    const reinvest = calculateNetYield({
      principal: 100000,
      startDate: "2025-10-24",
      termMonths: 3,
      flatRate: 0.055,
      tiers: [{ upTo: null, rate: 0.055 }],
      interestMode: "simple",
      interestTreatment: "reinvest",
      compounding: "monthly",
      taxRate: 0.2,
    });

    expect(payout.maturityDate).toBe("2026-01-24");
    expect(payout.grossInterest).toBeCloseTo(1386.30137, 6);
    expect(payout.netInterest).toBeCloseTo(1109.041096, 6);
    expect(reinvest.grossInterest).toBeCloseTo(payout.grossInterest, 8);
    expect(reinvest.netInterest).toBeCloseTo(payout.netInterest, 8);
  });

  it("supports fractional term months (0.5 month = 15 days)", () => {
    const result = calculateNetYield({
      principal: 100000,
      startDate: "2026-02-01",
      termMonths: 0.5,
      flatRate: 0.06,
      tiers: [{ upTo: null, rate: 0.06 }],
      interestMode: "simple",
      interestTreatment: "payout",
      compounding: "daily",
      taxRate: 0.2,
    });

    expect(result.maturityDate).toBe("2026-02-16");
    expect(result.dayCount).toBe(15);
    expect(result.grossInterest).toBeCloseTo(246.575342, 6);
    expect(result.netInterest).toBeCloseTo(197.260274, 6);
  });

  it("uses day-count convention for daily tiered calculations", () => {
    const yearly360 = calculateNetYield({
      principal: 100000,
      startDate: "2026-01-01",
      termMonths: 12,
      flatRate: 0.06,
      tiers: [{ upTo: null, rate: 0.06 }],
      interestMode: "tiered",
      interestTreatment: "payout",
      compounding: "daily",
      taxRate: 0.2,
      dayCountConvention: 360,
    });

    const yearly365 = calculateNetYield({
      principal: 100000,
      startDate: "2026-01-01",
      termMonths: 12,
      flatRate: 0.06,
      tiers: [{ upTo: null, rate: 0.06 }],
      interestMode: "tiered",
      interestTreatment: "payout",
      compounding: "daily",
      taxRate: 0.2,
      dayCountConvention: 365,
    });

    expect(yearly360.grossInterest).toBeGreaterThan(yearly365.grossInterest);
  });
});

// ─── tiered payout, daily ─────────────────────────────────────────────────────
//
// In payout mode the principal never changes, so each tier bracket earns
// simple interest independently: portion × rate × (days / convention).
// For a 12-month term starting 2026-01-01 the dayCount is 365, which equals
// the 365-day convention, so the factor simplifies to exactly 1 and the
// expected values are clean integer multiples of the rates.

describe("calculateNetYield — tiered payout, daily", () => {
  const TWO_TIERS = [
    { upTo: 50_000, rate: 0.03 },
    { upTo: null, rate: 0.05 },
  ];

  function tieredPayout(principal: number) {
    return calculateNetYield({
      principal,
      startDate: "2026-01-01",
      termMonths: 12,
      flatRate: 0,
      tiers: TWO_TIERS,
      interestMode: "tiered",
      interestTreatment: "payout",
      compounding: "daily",
      taxRate: 0.2,
      dayCountConvention: 365,
    });
  }

  it("splits principal across brackets and sums interest", () => {
    // First 50k earns 3%, remaining 50k earns 5%.
    // gross = 50_000×0.03 + 50_000×0.05 = 1_500 + 2_500 = 4_000
    const result = tieredPayout(100_000);
    expect(result.grossInterest).toBeCloseTo(4_000, 6);
    expect(result.netInterest).toBeCloseTo(3_200, 6);
  });

  it("only applies the first-tier rate when principal is below its cap", () => {
    // 30k sits entirely within the ₱0–50k bracket.
    // gross = 30_000 × 0.03 = 900
    const result = tieredPayout(30_000);
    expect(result.grossInterest).toBeCloseTo(900, 6);
    expect(result.netInterest).toBeCloseTo(720, 6);
  });

  it("does not overflow into the next tier when principal equals the tier cap", () => {
    // 50k exactly fills the first bracket; the second receives nothing.
    // gross = 50_000 × 0.03 = 1_500
    const result = tieredPayout(50_000);
    expect(result.grossInterest).toBeCloseTo(1_500, 6);
    expect(result.netInterest).toBeCloseTo(1_200, 6);
  });
});

// ─── tiered reinvest, daily compound ─────────────────────────────────────────
//
// In reinvest mode each bracket compounds separately: portion × ((1 + r/365)^days − 1).
// The results are then summed. Compounding must yield strictly more than the
// equivalent payout (simple-interest) calculation.

describe("calculateNetYield — tiered reinvest, daily compound", () => {
  it("compounds a single tier daily: P × ((1 + r/365)^days − 1)", () => {
    const result = calculateNetYield({
      principal: 100_000,
      startDate: "2026-01-01",
      termMonths: 12,
      flatRate: 0,
      tiers: [{ upTo: null, rate: 0.06 }],
      interestMode: "tiered",
      interestTreatment: "reinvest",
      compounding: "daily",
      taxRate: 0.2,
      dayCountConvention: 365,
    });

    const days = result.dayCount; // 365 for 2026-01-01 → 2027-01-01
    const expectedGross = 100_000 * (Math.pow(1 + 0.06 / 365, days) - 1);
    expect(result.grossInterest).toBeCloseTo(expectedGross, 6);
    expect(result.netInterest).toBeCloseTo(expectedGross * 0.8, 6);
  });

  it("compounds each bracket independently and sums the results", () => {
    const result = calculateNetYield({
      principal: 100_000,
      startDate: "2026-01-01",
      termMonths: 12,
      flatRate: 0,
      tiers: [
        { upTo: 50_000, rate: 0.03 },
        { upTo: null, rate: 0.05 },
      ],
      interestMode: "tiered",
      interestTreatment: "reinvest",
      compounding: "daily",
      taxRate: 0.2,
      dayCountConvention: 365,
    });

    const days = result.dayCount;
    const tier1 = 50_000 * (Math.pow(1 + 0.03 / 365, days) - 1);
    const tier2 = 50_000 * (Math.pow(1 + 0.05 / 365, days) - 1);
    expect(result.grossInterest).toBeCloseTo(tier1 + tier2, 6);
  });

  it("produces more gross interest than payout mode under the same tiered setup", () => {
    const shared = {
      principal: 100_000,
      startDate: "2026-01-01",
      termMonths: 12,
      flatRate: 0,
      tiers: [
        { upTo: 50_000, rate: 0.03 },
        { upTo: null, rate: 0.05 },
      ],
      interestMode: "tiered" as const,
      compounding: "daily" as const,
      taxRate: 0.2,
      dayCountConvention: 365 as const,
    };

    const payout = calculateNetYield({ ...shared, interestTreatment: "payout" });
    const reinvest = calculateNetYield({ ...shared, interestTreatment: "reinvest" });

    expect(reinvest.grossInterest).toBeGreaterThan(payout.grossInterest);
  });
});

// ─── monthly compounding ──────────────────────────────────────────────────────
//
// Monthly payout: periods = termMonths, ratePer = 1/12 → same total as daily
// for a 12-month/365-day term because both ratios reduce to 1.
//
// Monthly reinvest: portion × ((1 + r/12)^months − 1) per bracket.
// Daily > Monthly because higher compounding frequency always wins.

describe("calculateNetYield — monthly compounding", () => {
  it("monthly payout yields the same gross as daily payout for a 12-month term", () => {
    const shared = {
      principal: 100_000,
      startDate: "2026-01-01",
      termMonths: 12,
      flatRate: 0,
      tiers: [
        { upTo: 50_000, rate: 0.03 },
        { upTo: null, rate: 0.05 },
      ],
      interestMode: "tiered" as const,
      interestTreatment: "payout" as const,
      taxRate: 0,
      dayCountConvention: 365 as const,
    };

    const daily = calculateNetYield({ ...shared, compounding: "daily" });
    const monthly = calculateNetYield({ ...shared, compounding: "monthly" });

    // daily: rate × principal × (365 / 365) = rate × principal
    // monthly: rate × principal × (12 / 12) = rate × principal  — identical
    expect(monthly.grossInterest).toBeCloseTo(daily.grossInterest, 6);
  });

  it("compounds each bracket using (1 + r/12)^months when compounding is monthly", () => {
    const result = calculateNetYield({
      principal: 100_000,
      startDate: "2026-01-01",
      termMonths: 12,
      flatRate: 0,
      tiers: [
        { upTo: 50_000, rate: 0.03 },
        { upTo: null, rate: 0.05 },
      ],
      interestMode: "tiered",
      interestTreatment: "reinvest",
      compounding: "monthly",
      taxRate: 0.2,
      dayCountConvention: 365,
    });

    const tier1 = 50_000 * (Math.pow(1 + 0.03 / 12, 12) - 1);
    const tier2 = 50_000 * (Math.pow(1 + 0.05 / 12, 12) - 1);
    expect(result.grossInterest).toBeCloseTo(tier1 + tier2, 6);
  });

  it("daily compound yields more than monthly compound (higher frequency wins)", () => {
    const shared = {
      principal: 100_000,
      startDate: "2026-01-01",
      termMonths: 12,
      flatRate: 0,
      tiers: [{ upTo: null, rate: 0.06 }],
      interestMode: "tiered" as const,
      interestTreatment: "reinvest" as const,
      taxRate: 0,
      dayCountConvention: 365 as const,
    };

    const daily = calculateNetYield({ ...shared, compounding: "daily" });
    const monthly = calculateNetYield({ ...shared, compounding: "monthly" });

    expect(daily.grossInterest).toBeGreaterThan(monthly.grossInterest);
  });
});

// ─── termDays override ────────────────────────────────────────────────────────
//
// When termDays is set it drives both the maturity date and the day count.
// termMonths is present but must be ignored.

describe("calculateNetYield — termDays override", () => {
  it("uses termDays for dayCount and maturityDate, ignoring termMonths", () => {
    // 2026-01-01 + 90 days: Jan(30) + Feb(28) + Mar(31) + 1 = Apr 1
    const result = calculateNetYield({
      principal: 100_000,
      startDate: "2026-01-01",
      termMonths: 6, // would give ~181 days — must be ignored
      termDays: 90,
      flatRate: 0.06,
      tiers: [{ upTo: null, rate: 0.06 }],
      interestMode: "simple",
      interestTreatment: "payout",
      compounding: "daily",
      taxRate: 0,
      dayCountConvention: 365,
    });

    expect(result.dayCount).toBe(90);
    expect(result.maturityDate).toBe("2026-04-01");
  });

  it("computes simple interest against the termDays day count", () => {
    // gross = 100_000 × 0.06 × (90 / 365)
    const result = calculateNetYield({
      principal: 100_000,
      startDate: "2026-01-01",
      termMonths: 6,
      termDays: 90,
      flatRate: 0.06,
      tiers: [{ upTo: null, rate: 0.06 }],
      interestMode: "simple",
      interestTreatment: "payout",
      compounding: "daily",
      taxRate: 0.2,
      dayCountConvention: 365,
    });

    const expectedGross = 100_000 * 0.06 * (90 / 365);
    expect(result.grossInterest).toBeCloseTo(expectedGross, 6);
    expect(result.netInterest).toBeCloseTo(expectedGross * 0.8, 6);
  });
});

// ─── tax handling ─────────────────────────────────────────────────────────────

describe("calculateNetYield — tax handling", () => {
  it("returns net equal to gross when taxRate is 0", () => {
    const result = calculateNetYield({
      principal: 100_000,
      startDate: "2026-01-01",
      termMonths: 12,
      flatRate: 0.06,
      tiers: [{ upTo: null, rate: 0.06 }],
      interestMode: "simple",
      interestTreatment: "payout",
      compounding: "daily",
      taxRate: 0,
      dayCountConvention: 365,
    });

    expect(result.netInterest).toBeCloseTo(result.grossInterest, 10);
  });
});
