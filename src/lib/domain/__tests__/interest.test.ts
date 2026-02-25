import { describe, expect, it } from "vitest";
import { buildDepositSummary } from "@/lib/domain/interest";
import type { Bank, TimeDeposit } from "@/types";

const baseBank: Bank = {
  id: "bank-1",
  name: "Test Bank",
  taxRate: 0.2,
};

const baseDeposit: TimeDeposit = {
  id: "dep-1",
  bankId: "bank-1",
  name: "Test Deposit",
  principal: 200000,
  startDate: "2025-06-01",
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
};

describe("buildDepositSummary — fixed term", () => {
  it("returns maturity date for a fixed-term deposit", () => {
    const summary = buildDepositSummary(baseDeposit, baseBank);
    expect(summary.maturityDate).toBe("2026-06-01");
  });

  it("calculates gross interest using bank tax when no override", () => {
    const summary = buildDepositSummary(baseDeposit, baseBank);
    // 200000 * 0.06 * (365/365) = 12000 gross
    expect(summary.grossInterest).toBeCloseTo(12000, 0);
  });

  it("calculates net interest after 20% tax", () => {
    const summary = buildDepositSummary(baseDeposit, baseBank);
    // 12000 * 0.8 = 9600
    expect(summary.netInterest).toBeCloseTo(9600, 0);
  });

  it("calculates grossTotal = principal + grossInterest", () => {
    const summary = buildDepositSummary(baseDeposit, baseBank);
    expect(summary.grossTotal).toBeCloseTo(summary.deposit.principal + summary.grossInterest, 6);
  });

  it("calculates netTotal = principal + netInterest", () => {
    const summary = buildDepositSummary(baseDeposit, baseBank);
    expect(summary.netTotal).toBeCloseTo(summary.deposit.principal + summary.netInterest, 6);
  });

  it("uses taxRateOverride when provided", () => {
    const deposit: TimeDeposit = { ...baseDeposit, taxRateOverride: 0.1 };
    const summary = buildDepositSummary(deposit, baseBank);
    // Net should be larger since override tax is lower than bank's 20%
    const summaryDefault = buildDepositSummary(baseDeposit, baseBank);
    expect(summary.netInterest).toBeGreaterThan(summaryDefault.netInterest);
  });

  it("attaches the original deposit and bank on the summary", () => {
    const summary = buildDepositSummary(baseDeposit, baseBank);
    expect(summary.deposit).toBe(baseDeposit);
    expect(summary.bank).toBe(baseBank);
  });
});

describe("buildDepositSummary — open-ended", () => {
  const openEndedDeposit: TimeDeposit = {
    ...baseDeposit,
    id: "dep-open",
    isOpenEnded: true,
    termMonths: 0,
  };

  it("returns null maturityDate for open-ended deposits", () => {
    const summary = buildDepositSummary(openEndedDeposit, baseBank);
    expect(summary.maturityDate).toBeNull();
  });

  it("projects interest over a 12-month rolling window", () => {
    const summary = buildDepositSummary(openEndedDeposit, baseBank);
    // Should be roughly 200000 * 0.06 * 1 year net of 20% tax
    expect(summary.netInterest).toBeCloseTo(9600, -2);
  });
});
