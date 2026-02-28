import { test, expect } from "@playwright/test";
import percySnapshot from "@percy/playwright";
import type { TimeDeposit } from "../../src/types";

// Multi-deposit portfolio with various payout frequencies for a rich cashflow chart
const seedDeposits: TimeDeposit[] = [
  {
    id: "cf-percy-dep-1",
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
    id: "cf-percy-dep-2",
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
  {
    id: "cf-percy-dep-3",
    bankId: "Apex Rural Bank",
    name: "Apex tiered savings",
    principal: 75000,
    startDate: "2025-11-01",
    termMonths: 12,
    interestMode: "tiered",
    interestTreatment: "reinvest",
    compounding: "daily",
    taxRateOverride: 0.2,
    flatRate: 0,
    tiers: [
      { upTo: 100000, rate: 0.065 },
      { upTo: null, rate: 0.04 },
    ],
    payoutFrequency: "maturity",
    dayCountConvention: 365,
    isOpenEnded: true,
    status: "active",
  },
];

test("cash flow page — empty state redirects home", async ({ page }) => {
  // RouteGuard redirects empty users away from sub-pages to the empty landing
  await page.goto("/cashflow");
  await page.waitForURL("/");
  await expect(page.getByRole("heading", { name: "Welcome to YieldFlow" })).toBeVisible();
});

test("cash flow page — with portfolio data", async ({ page }) => {
  await page.addInitScript((deposits) => {
    localStorage.setItem("yf:deposits", JSON.stringify(deposits));
  }, seedDeposits);

  await page.goto("/cashflow");
  await expect(page.getByRole("heading", { name: "Cash Flow" })).toBeVisible();

  // The area chart region should be visible
  await expect(page.getByRole("region", { name: "Interest projection trend chart" })).toBeVisible();
  // The time-window filter should show its options
  await expect(page.getByText("12M", { exact: true })).toBeVisible();

  await percySnapshot(page, "Cash Flow Page - filled");
});
