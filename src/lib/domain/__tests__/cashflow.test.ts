import { describe, expect, it, vi, afterEach } from "vitest";
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

// maturityDate is string | null: null for open-ended deposits.
function makeSummary(deposit: TimeDeposit, maturityDate: string | null, netInterest: number): DepositSummary {
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

  it("payout dates are anchored to startDate day-of-month", () => {
    // Deposit starting on the 15th → payouts on the 15th of each month.
    // monthKey of Feb 15, Mar 15, Apr 15 should be Feb, Mar, Apr.
    const deposit = makeDeposit({
      startDate: "2026-01-15",
      termMonths: 3,
      payoutFrequency: "monthly",
    });
    const summary = makeSummary(deposit, "2026-04-15", 1800);

    const result = buildMonthlyAllowance([summary]);
    expect(result.map((m) => m.monthKey)).toEqual(["2026-02", "2026-03", "2026-04"]);
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

// ─── effectiveStatus override ─────────────────────────────────────────────────
//
// A deposit that matures today still has deposit.status === "active" in storage
// (status is only written on explicit user action). usePortfolioData computes
// effectiveStatus === "matured" at runtime and passes EnrichedSummary objects
// to buildMonthlyAllowance. The function must prefer effectiveStatus so the KPI
// "pending" pill and the Cash Flow "Due now" badge fire correctly on the due date.

describe("buildMonthlyAllowance — effectiveStatus override", () => {
  it("uses effectiveStatus over deposit.status when provided", () => {
    const deposit = makeDeposit({ startDate: "2026-01-01", termMonths: 3, payoutFrequency: "maturity", status: "active" });
    const summary = {
      ...makeSummary(deposit, "2026-04-01", 1800),
      // Runtime-derived: deposit matures today but storage still says "active".
      effectiveStatus: "matured" as const,
    };

    const result = buildMonthlyAllowance([summary]);
    expect(result[0].entries[0].status).toBe("matured");
  });

  it("falls back to deposit.status when effectiveStatus is absent", () => {
    const deposit = makeDeposit({ startDate: "2026-01-01", termMonths: 3, payoutFrequency: "maturity", status: "active" });
    const summary = makeSummary(deposit, "2026-04-01", 1800); // no effectiveStatus

    const result = buildMonthlyAllowance([summary]);
    expect(result[0].entries[0].status).toBe("active");
  });
});

// ─── Open-ended (savings) projection ─────────────────────────────────────────
//
// Open-ended deposits project 12 monthly payouts anchored to startDate.
// "Today" is fixed via vi.useFakeTimers so tests are deterministic regardless
// of when they run.
//
// Fake today: 2026-03-15T00:00:00 (local midnight — no Z suffix, so the
// Date constructor uses local time, matching how new Date() works in the app).

describe("buildMonthlyAllowance — open-ended projection", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  function setToday(isoDate: string) {
    // Parse as local midnight so the mocked today's month/year are correct in
    // any system timezone. The "T00:00:00" (no Z) tells the Date constructor
    // to use local time, same as the app's parseLocalDate convention.
    vi.useFakeTimers();
    vi.setSystemTime(new Date(isoDate + "T00:00:00"));
  }

  function makeOpenEndedSummary(startDate: string, netInterest = 1200) {
    const deposit = makeDeposit({
      startDate,
      isOpenEnded: true,
      payoutFrequency: "monthly",
      termMonths: 12,
      status: "active",
    });
    return makeSummary(deposit, null, netInterest);
  }

  it("includes the current month when a payout falls within it", () => {
    // Today: Mar 15. startDate: Feb 10 → first payout: Mar 10 (in current month).
    setToday("2026-03-15");
    const result = buildMonthlyAllowance([makeOpenEndedSummary("2026-02-10")]);
    expect(result[0].monthKey).toBe("2026-03");
  });

  it("includes the current month when the account has been open for several months", () => {
    // Today: Mar 15. startDate: Dec 15, 2025 → payouts: Jan 15, Feb 15, Mar 15…
    // First payout >= Mar ("2026-03") is Mar 15 → current month.
    setToday("2026-03-15");
    const result = buildMonthlyAllowance([makeOpenEndedSummary("2025-12-15")]);
    expect(result[0].monthKey).toBe("2026-03");
  });

  it("starts from next month when the account was opened this month", () => {
    // Today: Mar 15. startDate: Mar 10 → first payout: Apr 10 (next month).
    // The account just opened this month; the first payout hasn't arrived yet.
    setToday("2026-03-15");
    const result = buildMonthlyAllowance([makeOpenEndedSummary("2026-03-10")]);
    expect(result[0].monthKey).toBe("2026-04");
  });

  it("projects exactly 12 payouts", () => {
    setToday("2026-03-15");
    const result = buildMonthlyAllowance([makeOpenEndedSummary("2026-02-10")]);
    expect(result).toHaveLength(12);
  });

  it("projected months are consecutive with no gaps", () => {
    // Today: Mar 15, startDate: Feb 10 → Mar 2026 through Feb 2027.
    setToday("2026-03-15");
    const result = buildMonthlyAllowance([makeOpenEndedSummary("2026-02-10")]);
    const keys = result.map((m) => m.monthKey);
    expect(keys[0]).toBe("2026-03");
    expect(keys[11]).toBe("2027-02");
    for (let i = 1; i < keys.length; i++) {
      const [prevY, prevM] = keys[i - 1].split("-").map(Number);
      const [y, m] = keys[i].split("-").map(Number);
      expect(y * 12 + m - (prevY * 12 + prevM)).toBe(1);
    }
  });

  it("each monthly payout is netInterest / 12", () => {
    setToday("2026-03-15");
    const result = buildMonthlyAllowance([makeOpenEndedSummary("2026-02-10", 1200)]);
    result.forEach((m) => {
      expect(m.net).toBeCloseTo(100, 6); // 1200 / 12
    });
  });

  it("payout day-of-month is anchored to startDate, not today", () => {
    // startDate: Jan 20 → payouts on the 20th of each month.
    // Today: Mar 15 → Mar 20 is still in March → first payout is in current month.
    // If we had used addMonths(today, 1) instead, we'd get Apr 15, not Mar 20.
    setToday("2026-03-15");
    const result = buildMonthlyAllowance([makeOpenEndedSummary("2026-01-20")]);
    expect(result[0].monthKey).toBe("2026-03"); // Mar 20 → current month
    expect(result[1].monthKey).toBe("2026-04"); // Apr 20 → next month
  });

  it("principalReturned is 0 for all open-ended entries (no maturity event)", () => {
    setToday("2026-03-15");
    const result = buildMonthlyAllowance([makeOpenEndedSummary("2026-02-10")]);
    result.forEach((m) => {
      m.entries.forEach((e) => {
        expect(e.principalReturned).toBe(0);
      });
    });
  });
});
