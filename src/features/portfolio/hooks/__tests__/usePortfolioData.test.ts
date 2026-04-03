import { describe, expect, it, beforeAll, afterAll, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePortfolioData } from "@/features/portfolio/hooks/usePortfolioData";
import type { TimeDeposit, Bank } from "@/types";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const BANK: Bank = { id: "bank-1", name: "Tonik Bank", taxRate: 0.2 };

const makeDeposit = (overrides?: Partial<TimeDeposit>): TimeDeposit => ({
  id: "dep-1",
  bankId: "bank-1",
  name: "Test Deposit",
  principal: 100_000,
  startDate: "2026-01-01",
  termMonths: 24, // maturity ≈ 2028-01-01 — clearly future from 2026-03-03
  interestMode: "simple",
  interestTreatment: "payout",
  compounding: "daily",
  flatRate: 0.065,
  tiers: [],
  payoutFrequency: "maturity",
  dayCountConvention: 365,
  status: "active",
  ...overrides,
});

// ─── Fake time: lock "today" to 2026-03-03 ───────────────────────────────────

beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-03-03T12:00:00"));
});

afterAll(() => {
  vi.useRealTimers();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("usePortfolioData — empty deposits", () => {
  it("returns zero principal, null nextMaturity, and empty summaries", () => {
    const { result } = renderHook(() => usePortfolioData([], []));
    expect(result.current.summaries).toEqual([]);
    expect(result.current.totalPrincipal).toBe(0);
    expect(result.current.nextMaturity).toBeNull();
    expect(result.current.monthlyAllowance).toEqual([]);
    expect(result.current.currentMonthFull).toBeNull();
    expect(result.current.currentMonthBreakdown).toEqual({ net: 0, pendingNet: 0, settledNet: 0, closedNet: 0 });
  });
});

describe("usePortfolioData — effectiveStatus derivation", () => {
  it("keeps 'active' when maturity is in the future", () => {
    const deposit = makeDeposit({ startDate: "2026-01-01", termMonths: 24 }); // ≈ 2028-01-01
    const { result } = renderHook(() => usePortfolioData([deposit], [BANK]));
    expect(result.current.summaries[0].effectiveStatus).toBe("active");
  });

  it("promotes 'active' to 'matured' when maturity is in the past", () => {
    // startDate 2020-01-01 + 6 months = 2020-07-01 — clearly before 2026-03-03
    const deposit = makeDeposit({ id: "old", startDate: "2020-01-01", termMonths: 6 });
    const { result } = renderHook(() => usePortfolioData([deposit], [BANK]));
    expect(result.current.summaries[0].effectiveStatus).toBe("matured");
  });

  it("promotes 'active' to 'matured' when maturity is exactly today", () => {
    // startDate 2026-01-01 + termDays 61 → 2026-03-03 (today)
    // Jan: 31 days, Feb: 28 days (not leap) → day 60 = March 2, day 61 = March 3
    const deposit = makeDeposit({ id: "boundary", startDate: "2026-01-01", termDays: 61, termMonths: 0 });
    const { result } = renderHook(() => usePortfolioData([deposit], [BANK]));
    expect(result.current.summaries[0].effectiveStatus).toBe("matured");
  });

  it("keeps 'settled' even when maturity is in the future", () => {
    const deposit = makeDeposit({ status: "settled" });
    const { result } = renderHook(() => usePortfolioData([deposit], [BANK]));
    expect(result.current.summaries[0].effectiveStatus).toBe("settled");
  });

  it("keeps 'settled' for a deposit with past maturity", () => {
    const deposit = makeDeposit({ id: "old-settled", startDate: "2020-01-01", termMonths: 6, status: "settled" });
    const { result } = renderHook(() => usePortfolioData([deposit], [BANK]));
    expect(result.current.summaries[0].effectiveStatus).toBe("settled");
  });
});

describe("usePortfolioData — totalPrincipal", () => {
  it("sums only active and matured deposits (excludes settled)", () => {
    const deposits: TimeDeposit[] = [
      makeDeposit({ id: "a", principal: 100_000, status: "active" }),
      makeDeposit({ id: "b", principal: 200_000, startDate: "2020-01-01", termMonths: 6, status: "active" }), // will be "matured"
      makeDeposit({ id: "c", principal: 300_000, status: "settled" }),
    ];
    const { result } = renderHook(() => usePortfolioData(deposits, [BANK]));
    // 100k (active) + 200k (matured via effectiveStatus) = 300k; 300k settled excluded
    expect(result.current.totalPrincipal).toBe(300_000);
  });

  it("returns zero when all deposits are settled", () => {
    const deposits = [
      makeDeposit({ id: "a", status: "settled" }),
      makeDeposit({ id: "b", status: "settled" }),
    ];
    const { result } = renderHook(() => usePortfolioData(deposits, [BANK]));
    expect(result.current.totalPrincipal).toBe(0);
  });
});

describe("usePortfolioData — nextMaturity", () => {
  it("returns null when there are no active deposits with future maturity", () => {
    const deposits = [
      makeDeposit({ id: "settled", status: "settled" }),
      makeDeposit({ id: "past", startDate: "2020-01-01", termMonths: 6 }), // effectiveStatus: matured
    ];
    const { result } = renderHook(() => usePortfolioData(deposits, [BANK]));
    expect(result.current.nextMaturity).toBeNull();
  });

  it("returns the earliest active deposit with future maturity", () => {
    const deposits: TimeDeposit[] = [
      makeDeposit({ id: "far", name: "Far Away", startDate: "2026-01-01", termMonths: 36 }), // ≈ 2029-01-01
      makeDeposit({ id: "near", name: "Near Maturity", startDate: "2026-01-01", termMonths: 18 }), // ≈ 2027-07-01
    ];
    const { result } = renderHook(() => usePortfolioData(deposits, [BANK]));
    expect(result.current.nextMaturity?.depositId).toBe("near");
    expect(result.current.nextMaturity?.name).toBe("Near Maturity");
  });

  it("includes the correct bank name in nextMaturity", () => {
    const deposit = makeDeposit();
    const { result } = renderHook(() => usePortfolioData([deposit], [BANK]));
    expect(result.current.nextMaturity?.bankName).toBe("Tonik Bank");
  });

  it("includes netProceeds (principal + net interest) in nextMaturity", () => {
    const deposit = makeDeposit({ principal: 100_000 });
    const { result } = renderHook(() => usePortfolioData([deposit], [BANK]));
    expect(result.current.nextMaturity?.netProceeds).toBeGreaterThan(100_000);
  });

  it("includes depositId and maturityDate in nextMaturity", () => {
    const deposit = makeDeposit({ id: "my-dep" });
    const { result } = renderHook(() => usePortfolioData([deposit], [BANK]));
    expect(result.current.nextMaturity?.depositId).toBe("my-dep");
    expect(result.current.nextMaturity?.maturityDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("usePortfolioData — bank synthesis", () => {
  it("synthesizes a bank from bankId when deposit is not in the banks list", () => {
    const deposit = makeDeposit({ bankId: "Free Text Bank" });
    // Pass empty banks[] so no match is found — bankId becomes bank name
    const { result } = renderHook(() => usePortfolioData([deposit], []));
    expect(result.current.nextMaturity?.bankName).toBe("Free Text Bank");
  });

  it("uses taxRateOverride on the synthesized bank", () => {
    // taxRateOverride=0 means no tax; net = gross
    const deposit = makeDeposit({ bankId: "Free Text Bank", taxRateOverride: 0 });
    const noTaxResult = renderHook(() => usePortfolioData([deposit], []));

    // taxRateOverride=0.2 means 20% tax; net < gross
    const depositWithTax = makeDeposit({ id: "dep-2", bankId: "Free Text Bank", taxRateOverride: 0.2 });
    const withTaxResult = renderHook(() => usePortfolioData([depositWithTax], []));

    const noTaxSummary = noTaxResult.result.current.summaries[0];
    const withTaxSummary = withTaxResult.result.current.summaries[0];
    expect(noTaxSummary.netInterest).toBeGreaterThan(withTaxSummary.netInterest);
  });
});

describe("usePortfolioData — monthlyAllowance excludes settled", () => {
  it("does not include settled deposits in the 12-month projection", () => {
    const active = makeDeposit({ id: "active", principal: 100_000 });
    const settled = makeDeposit({ id: "settled", principal: 200_000, status: "settled" });
    const { result } = renderHook(() => usePortfolioData([active, settled], [BANK]));

    const totalProjected = result.current.monthlyAllowance.reduce((sum, m) => sum + m.net, 0);

    // Projection with only active deposit
    const activeOnly = renderHook(() => usePortfolioData([active], [BANK]));
    const activeOnlyTotal = activeOnly.result.current.monthlyAllowance.reduce((sum, m) => sum + m.net, 0);

    expect(totalProjected).toBe(activeOnlyTotal);
  });
});

describe("usePortfolioData — currentMonthBreakdown", () => {
  it("shows pendingNet from matured deposits with a payout this month", () => {
    // Deposit with stored status "matured" (not yet settled) with payout in March 2026.
    // startDate 2025-09-01 + 6 months → maturity ≈ 2026-03-01, which is in the current month.
    const deposit = makeDeposit({
      id: "pending-march",
      startDate: "2025-09-01",
      termMonths: 6,
      payoutFrequency: "maturity",
      status: "matured",
    });
    const { result } = renderHook(() => usePortfolioData([deposit], [BANK]));
    expect(result.current.currentMonthBreakdown.pendingNet).toBeGreaterThan(0);
    // net equals pendingNet because there are no settled deposits
    expect(result.current.currentMonthBreakdown.net).toBe(result.current.currentMonthBreakdown.pendingNet);
  });

  it("shows settledNet from settled deposits with a payout this month", () => {
    const deposit = makeDeposit({
      id: "settled-march",
      startDate: "2025-09-01",
      termMonths: 6,
      payoutFrequency: "maturity",
      status: "settled",
    });
    const { result } = renderHook(() => usePortfolioData([deposit], [BANK]));
    expect(result.current.currentMonthBreakdown.settledNet).toBeGreaterThan(0);
    expect(result.current.currentMonthBreakdown.pendingNet).toBe(0);
  });
});
