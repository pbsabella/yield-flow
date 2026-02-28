import { test, expect } from "@playwright/test";
import percySnapshot from "@percy/playwright";
import type { TimeDeposit } from "../../src/types";

// A portfolio with variety: maturity payout, monthly payout, open-ended
const seedDeposits: TimeDeposit[] = [
  {
    id: "dash-percy-dep-1",
    bankId: "Meridian Savings Bank",
    name: "Meridian 6M TD",
    principal: 300000,
    startDate: "2025-10-01",
    termMonths: 6,
    interestMode: "simple",
    interestTreatment: "payout",
    compounding: "daily",
    taxRateOverride: 0.2,
    flatRate: 0.0625,
    tiers: [{ upTo: null, rate: 0.0625 }],
    payoutFrequency: "maturity",
    dayCountConvention: 365,
    isOpenEnded: false,
    status: "active",
  },
  {
    id: "dash-percy-dep-2",
    bankId: "Horizon Digital Bank",
    name: "Horizon 12M monthly",
    principal: 500000,
    startDate: "2025-07-15",
    termMonths: 12,
    interestMode: "simple",
    interestTreatment: "payout",
    compounding: "daily",
    taxRateOverride: 0.2,
    flatRate: 0.057,
    tiers: [{ upTo: null, rate: 0.057 }],
    payoutFrequency: "monthly",
    dayCountConvention: 365,
    isOpenEnded: false,
    status: "active",
  },
];

test("dashboard page — empty state Percy snapshot", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Welcome to YieldFlow" })).toBeVisible();
  await percySnapshot(page, "Dashboard Page - empty");
});

test("dashboard page — with portfolio data", async ({ page }) => {
  await page.addInitScript((deposits) => {
    localStorage.setItem("yf:deposits", JSON.stringify(deposits));
  }, seedDeposits);

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Portfolio" })).toBeVisible();

  // KPI cards should be visible
  await expect(page.getByText("Total principal")).toBeVisible();

  // Bank exposure section should show bank names (first match is enough — names appear in multiple places)
  await expect(page.getByText("Meridian Savings Bank", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Horizon Digital Bank", { exact: true }).first()).toBeVisible();

  await percySnapshot(page, "Dashboard Page - filed");
});
