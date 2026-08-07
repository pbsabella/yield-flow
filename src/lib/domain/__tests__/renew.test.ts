import { describe, expect, it } from "vitest";
import { getRenewalOptions, getRenewalPrincipal } from "../renew";
import type { TimeDeposit } from "@/types";

const BASE: TimeDeposit = {
  id: "dep-1",
  bankId: "BDO",
  name: "BDO TD",
  principal: 100_000,
  startDate: "2025-01-01",
  flatRate: 0.06,
  interestMode: "simple",
  tiers: [],
  termMonths: 6,
  payoutFrequency: "maturity",
  compounding: "monthly",
  dayCountConvention: 365,
  taxRateOverride: 0.2,
  status: "active",
};

describe("getRenewalPrincipal", () => {
  it("TD maturity: returns full proceeds (principal + net interest)", () => {
    const deposit: TimeDeposit = { ...BASE, payoutFrequency: "maturity" };
    expect(getRenewalPrincipal(deposit, 103_200)).toBe(103_200);
  });

  it("TD monthly: returns original principal (interest already paid out)", () => {
    const deposit: TimeDeposit = { ...BASE, payoutFrequency: "monthly" };
    // netTotal is passed as 100_000 (no interest rolled in for monthly)
    expect(getRenewalPrincipal(deposit, 100_000)).toBe(100_000);
  });

  it("TD monthly: ignores the netTotal argument and returns deposit.principal", () => {
    const deposit: TimeDeposit = { ...BASE, payoutFrequency: "monthly" };
    // Even if caller passes a larger netTotal, monthly always rolls only principal
    expect(getRenewalPrincipal(deposit, 103_200)).toBe(100_000);
  });

  it("TD maturity: principal-only mode returns original principal", () => {
    const deposit: TimeDeposit = { ...BASE, payoutFrequency: "maturity" };
    expect(getRenewalPrincipal(deposit, 103_200, "principal-only")).toBe(100_000);
  });

  it("TD maturity: all mode returns full proceeds", () => {
    const deposit: TimeDeposit = { ...BASE, payoutFrequency: "maturity" };
    expect(getRenewalPrincipal(deposit, 103_200, "all")).toBe(103_200);
  });

  it("TD monthly: ignores the mode argument and returns deposit.principal", () => {
    const deposit: TimeDeposit = { ...BASE, payoutFrequency: "monthly" };
    expect(getRenewalPrincipal(deposit, 103_200, "all")).toBe(100_000);
    expect(getRenewalPrincipal(deposit, 103_200, "principal-only")).toBe(100_000);
  });

  it("TD maturity with zero net interest returns just the principal", () => {
    const deposit: TimeDeposit = { ...BASE, payoutFrequency: "maturity" };
    expect(getRenewalPrincipal(deposit, 100_000)).toBe(100_000);
  });

  it("TD maturity: rounds fractional proceeds to 2 decimals", () => {
    const deposit: TimeDeposit = { ...BASE, payoutFrequency: "maturity" };
    expect(getRenewalPrincipal(deposit, 103_249.999)).toBe(103_250);
    expect(getRenewalPrincipal(deposit, 103_249.994)).toBe(103_249.99);
    expect(getRenewalPrincipal(deposit, 103_249.995)).toBe(103_250);
  });
});

describe("getRenewalOptions", () => {
  it("TD maturity: offers both all and principal-only", () => {
    const deposit: TimeDeposit = { ...BASE, payoutFrequency: "maturity" };
    expect(getRenewalOptions(deposit)).toEqual(["all", "principal-only"]);
  });

  it("TD monthly: collapses to all (principal only, interest already paid out)", () => {
    const deposit: TimeDeposit = { ...BASE, payoutFrequency: "monthly" };
    expect(getRenewalOptions(deposit)).toEqual(["all"]);
  });
});
