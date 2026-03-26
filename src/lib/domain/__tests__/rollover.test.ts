import { describe, expect, it } from "vitest";
import { getRolloverPrincipal } from "../rollover";
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

describe("getRolloverPrincipal", () => {
  it("TD maturity: returns full proceeds (principal + net interest)", () => {
    const deposit: TimeDeposit = { ...BASE, payoutFrequency: "maturity" };
    expect(getRolloverPrincipal(deposit, 103_200)).toBe(103_200);
  });

  it("TD monthly: returns original principal (interest already paid out)", () => {
    const deposit: TimeDeposit = { ...BASE, payoutFrequency: "monthly" };
    // netTotal is passed as 100_000 (no interest rolled in for monthly)
    expect(getRolloverPrincipal(deposit, 100_000)).toBe(100_000);
  });

  it("TD monthly: ignores the netTotal argument and returns deposit.principal", () => {
    const deposit: TimeDeposit = { ...BASE, payoutFrequency: "monthly" };
    // Even if caller passes a larger netTotal, monthly always rolls only principal
    expect(getRolloverPrincipal(deposit, 103_200)).toBe(100_000);
  });

  it("TD maturity with zero net interest returns just the principal", () => {
    const deposit: TimeDeposit = { ...BASE, payoutFrequency: "maturity" };
    expect(getRolloverPrincipal(deposit, 100_000)).toBe(100_000);
  });
});
