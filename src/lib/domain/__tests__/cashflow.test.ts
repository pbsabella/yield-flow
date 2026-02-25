import { describe, expect, it } from "vitest";
import { buildMonthlyAllowance } from "@/lib/domain/cashflow";
import type { DepositSummary, TimeDeposit, Bank } from "@/types";

const bank: Bank = { id: "bank-1", name: "Test Bank", taxRate: 0.2 };

function makeDeposit(overrides: Partial<TimeDeposit> = {}): TimeDeposit {
  return {
    id: "dep-1",
    bankId: "bank-1",
    name: "Test Deposit",
    principal: 120000,
    startDate: "2025-02-01",
    termMonths: 3,
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

function makeSummary(deposit: TimeDeposit, maturityDate: string, netInterest: number): DepositSummary {
  return {
    deposit,
    bank,
    maturityDate,
    grossInterest: netInterest / 0.8,
    netInterest,
    grossTotal: deposit.principal + netInterest / 0.8,
    netTotal: deposit.principal + netInterest,
  };
}

describe("buildMonthlyAllowance — maturity payout", () => {
  it("places the full net interest in the maturity month", () => {
    const deposit = makeDeposit({ startDate: "2026-01-01", termMonths: 3, payoutFrequency: "maturity" });
    const summary = makeSummary(deposit, "2026-04-01", 1800);

    const result = buildMonthlyAllowance([summary]);
    expect(result).toHaveLength(1);
    expect(result[0].monthKey).toBe("2026-04");
    expect(result[0].net).toBeCloseTo(1800, 6);
  });

  it("includes principalReturned on the entry", () => {
    const deposit = makeDeposit({ startDate: "2026-01-01", termMonths: 3, payoutFrequency: "maturity" });
    const summary = makeSummary(deposit, "2026-04-01", 1800);

    const result = buildMonthlyAllowance([summary]);
    expect(result[0].entries[0].principalReturned).toBe(120000);
  });
});

describe("buildMonthlyAllowance — monthly payout", () => {
  it("splits net interest evenly across each month of the term", () => {
    const deposit = makeDeposit({
      startDate: "2026-01-01",
      termMonths: 3,
      payoutFrequency: "monthly",
    });
    // 3 months: Feb, Mar, Apr
    const summary = makeSummary(deposit, "2026-04-01", 1800);

    const result = buildMonthlyAllowance([summary]);
    expect(result).toHaveLength(3);
    result.forEach((m) => {
      expect(m.net).toBeCloseTo(600, 6);
    });
  });

  it("returns months in chronological order", () => {
    const deposit = makeDeposit({
      startDate: "2026-01-01",
      termMonths: 3,
      payoutFrequency: "monthly",
    });
    const summary = makeSummary(deposit, "2026-04-01", 1800);

    const result = buildMonthlyAllowance([summary]);
    const keys = result.map((m) => m.monthKey);
    expect(keys).toEqual([...keys].sort());
  });
});

describe("buildMonthlyAllowance — multiple summaries", () => {
  it("merges two deposits that mature in the same month", () => {
    const d1 = makeDeposit({ id: "d1", startDate: "2026-01-01", termMonths: 3, payoutFrequency: "maturity" });
    const d2 = makeDeposit({ id: "d2", startDate: "2026-01-15", termMonths: 3, payoutFrequency: "maturity" });
    const s1 = makeSummary(d1, "2026-04-01", 1000);
    const s2 = makeSummary(d2, "2026-04-15", 2000);

    const result = buildMonthlyAllowance([s1, s2]);
    const aprilEntry = result.find((m) => m.monthKey === "2026-04");
    expect(aprilEntry).toBeDefined();
    expect(aprilEntry!.net).toBeCloseTo(3000, 6);
    expect(aprilEntry!.entries).toHaveLength(2);
  });
});

describe("buildMonthlyAllowance — empty input", () => {
  it("returns empty array for no summaries", () => {
    expect(buildMonthlyAllowance([])).toEqual([]);
  });
});
