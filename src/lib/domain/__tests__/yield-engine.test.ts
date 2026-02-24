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
