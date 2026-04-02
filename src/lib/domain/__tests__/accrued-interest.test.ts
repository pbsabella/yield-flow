import { describe, expect, it } from "vitest";
import { calculateAccruedToDate } from "@/lib/domain/accrued-interest";
import type { Bank, TimeDeposit } from "@/types";

const bank: Bank = { id: "bank-1", name: "Test Bank", taxRate: 0.2 };

function makeDeposit(overrides: Partial<TimeDeposit> = {}): TimeDeposit {
  return {
    id: "dep-1",
    bankId: "bank-1",
    name: "Test Deposit",
    principal: 100_000,
    startDate: "2026-01-01",
    termMonths: 12,
    interestMode: "simple",
    interestTreatment: "payout",
    compounding: "daily",
    flatRate: 0.06,
    tiers: [{ upTo: null, rate: 0.06 }],
    payoutFrequency: "maturity",
    dayCountConvention: 365,
    isOpenEnded: false,
    status: "active",
    ...overrides,
  };
}

describe("calculateAccruedToDate", () => {
  it("returns zero (or near-zero) interest when closed on startDate", () => {
    const deposit = makeDeposit({ startDate: "2026-01-01" });
    const result = calculateAccruedToDate(deposit, bank, "2026-01-01");
    // 0 days → engine clamps to 1 day minimum, but the amount is negligible
    expect(result.netInterest).toBeGreaterThanOrEqual(0);
    // At most 1 day of interest on ₱100k at 6% (≈ ₱13.15 net)
    expect(result.netInterest).toBeLessThan(20);
  });

  it("pro-rates interest for 30 days out of a 90-day deposit", () => {
    // 90-day TD: expected net interest for full term = 100000 * 0.06 * (90/365) * 0.8 ≈ 1183.56
    // 30-day close: 100000 * 0.06 * (30/365) * 0.8 ≈ 394.52
    const deposit = makeDeposit({ startDate: "2026-01-01", termMonths: 3 });
    const result = calculateAccruedToDate(deposit, bank, "2026-01-31"); // 30 days
    expect(result.netInterest).toBeCloseTo(100_000 * 0.06 * (30 / 365) * 0.8, 0);
  });

  it("uses the deposit's own dayCountConvention (360)", () => {
    const deposit = makeDeposit({ startDate: "2026-01-01", dayCountConvention: 360 });
    const result360 = calculateAccruedToDate(deposit, bank, "2026-01-31"); // 30 days
    const expected = 100_000 * 0.06 * (30 / 360) * 0.8;
    expect(result360.netInterest).toBeCloseTo(expected, 0);
  });

  it("applies taxRateOverride when present", () => {
    // Bank taxRate=0.2, deposit override=0.1 → taxRate=0.1
    const deposit = makeDeposit({ startDate: "2026-01-01", taxRateOverride: 0.1 });
    const result = calculateAccruedToDate(deposit, bank, "2026-03-02"); // 60 days
    const gross = 100_000 * 0.06 * (60 / 365);
    expect(result.netInterest).toBeCloseTo(gross * 0.9, 0);
  });

  it("falls back to bank.taxRate when no override", () => {
    const deposit = makeDeposit({ startDate: "2026-01-01" }); // no taxRateOverride
    const result = calculateAccruedToDate(deposit, bank, "2026-03-02"); // 60 days
    const gross = 100_000 * 0.06 * (60 / 365);
    expect(result.netInterest).toBeCloseTo(gross * 0.8, 0);
  });

  it("handles open-ended savings closed after N days", () => {
    const deposit = makeDeposit({
      startDate: "2026-01-01",
      isOpenEnded: true,
      interestTreatment: "payout",
      compounding: "daily",
      flatRate: 0.04,
    });
    const result = calculateAccruedToDate(deposit, bank, "2026-04-11"); // 100 days
    // Simple rate for clarity: 100000 * 0.04 * (100/365) * 0.8
    expect(result.netInterest).toBeCloseTo(100_000 * 0.04 * (100 / 365) * 0.8, 0);
  });
});
