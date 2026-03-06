import { test, expect, type Page } from "@playwright/test";
import percySnapshot from "@percy/playwright";
import type { TimeDeposit } from "../../src/types";

// ─── Seed data ────────────────────────────────────────────────────────────────
// Mix of statuses and payout types to exercise all table/ladder states.
// Today: 2026-03-06 (used to reason about matured/active boundaries).

const seedDeposits: TimeDeposit[] = [
  // Active, fixed-term, matures Dec 2026
  {
    id: "inv-active-fixed",
    bankId: "Meridian Savings Bank",
    name: "Meridian 12M TD",
    principal: 200000,
    startDate: "2025-12-01",
    termMonths: 12,
    interestMode: "simple",
    interestTreatment: "payout",
    compounding: "daily",
    taxRateOverride: 0.2,
    flatRate: 0.06,
    tiers: [{ upTo: null, rate: 0.06 }],
    payoutFrequency: "maturity",
    dayCountConvention: 365,
    isOpenEnded: false,
    status: "active",
  },
  // Active, monthly payout, matures Sep 2026
  {
    id: "inv-active-monthly",
    bankId: "Horizon Digital Bank",
    name: "Horizon 12M monthly",
    principal: 500000,
    startDate: "2025-09-01",
    termMonths: 12,
    interestMode: "simple",
    interestTreatment: "payout",
    compounding: "daily",
    taxRateOverride: 0.2,
    flatRate: 0.055,
    tiers: [{ upTo: null, rate: 0.055 }],
    payoutFrequency: "monthly",
    dayCountConvention: 365,
    isOpenEnded: false,
    status: "active",
  },
  // Open-ended (no fixed maturity date)
  {
    id: "inv-open-ended",
    bankId: "Apex Rural Bank",
    name: "Apex savings account",
    principal: 75000,
    startDate: "2025-06-01",
    termMonths: 3,
    interestMode: "simple",
    interestTreatment: "payout",
    compounding: "daily",
    taxRateOverride: 0.2,
    flatRate: 0.04,
    tiers: [{ upTo: null, rate: 0.04 }],
    payoutFrequency: "monthly",
    dayCountConvention: 365,
    isOpenEnded: true,
    status: "active",
  },
  // Matured: started Jan 2024, 3-month term → matured Apr 2024
  {
    id: "inv-matured",
    bankId: "Meridian Savings Bank",
    name: "Meridian 3M (matured)",
    principal: 100000,
    startDate: "2024-01-01",
    termMonths: 3,
    interestMode: "simple",
    interestTreatment: "payout",
    compounding: "daily",
    taxRateOverride: 0.2,
    flatRate: 0.05,
    tiers: [{ upTo: null, rate: 0.05 }],
    payoutFrequency: "maturity",
    dayCountConvention: 365,
    isOpenEnded: false,
    status: "active",
  },
  // Settled
  {
    id: "inv-settled",
    bankId: "Horizon Digital Bank",
    name: "Horizon 6M (settled)",
    principal: 250000,
    startDate: "2024-01-01",
    termMonths: 6,
    interestMode: "simple",
    interestTreatment: "payout",
    compounding: "daily",
    taxRateOverride: 0.2,
    flatRate: 0.057,
    tiers: [{ upTo: null, rate: 0.057 }],
    payoutFrequency: "maturity",
    dayCountConvention: 365,
    isOpenEnded: false,
    status: "settled",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function seedAndGo(page: Page) {
  await page.addInitScript((deposits) => {
    localStorage.setItem("yf:deposits", JSON.stringify(deposits));
  }, seedDeposits);
  await page.goto("/investments");
}

// ─── Table view ───────────────────────────────────────────────────────────────

test("investments table — renders column headers with data", async ({ page }) => {
  await seedAndGo(page);

  await expect(page.getByRole("table")).toBeVisible();

  // Key column headers present
  for (const header of ["Principal", "Rate", "Matures", "Net interest", "Status"]) {
    await expect(page.getByRole("columnheader", { name: new RegExp(header, "i") })).toBeVisible();
  }
});

test("investments table — shows active and matured deposits, hides settled by default", async ({ page }) => {
  await seedAndGo(page);

  // Active and matured deposits visible
  await expect(page.getByText("Meridian 12M TD")).toBeVisible();
  await expect(page.getByText("Horizon 12M monthly")).toBeVisible();
  await expect(page.getByText("Apex savings account")).toBeVisible();
  await expect(page.getByText("Meridian 3M (matured)")).toBeVisible();

  // Settled deposit hidden by default
  await expect(page.getByText("Horizon 6M (settled)")).not.toBeVisible();

  await percySnapshot(page, "Investments - table view filled");
});

test("investments table — show settled toggle reveals settled deposit", async ({ page }) => {
  await seedAndGo(page);

  await expect(page.getByText("Horizon 6M (settled)")).not.toBeVisible();
  await page.locator("#show-settled").click();
  await expect(page.getByText("Horizon 6M (settled)")).toBeVisible();
});

test("investments table — bank filter narrows rows", async ({ page }) => {
  await seedAndGo(page);

  await page.getByLabel("Filter bank").click();
  await page.getByRole("option", { name: "Apex Rural Bank" }).click();

  await expect(page.getByText("Apex savings account")).toBeVisible();
  await expect(page.getByText("Meridian 12M TD")).not.toBeVisible();
  await expect(page.getByText("Horizon 12M monthly")).not.toBeVisible();
});

test("investments table — active summary collapsible opens", async ({ page }) => {
  await seedAndGo(page);

  // Summary strip is visible but collapsed by default
  await expect(page.getByText("Active summary")).toBeVisible();
  // Open it
  await page.getByText("Active summary").click();
  // Bank name cells inside the BankActiveSummary table become visible
  await expect(page.getByRole("cell", { name: "Meridian Savings Bank", exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Horizon Digital Bank", exact: true })).toBeVisible();
});

// ─── Ladder view ──────────────────────────────────────────────────────────────

test("investments ladder — timeline region renders with deposits", async ({ page }) => {
  await seedAndGo(page);

  await page.getByRole("radio", { name: "Ladder" }).click();

  // Desktop Gantt region
  const ladderRegion = page.getByRole("region", { name: "Investment ladder timeline" });
  await expect(ladderRegion).toBeVisible();

  // Deposit labels appear in the label column
  await expect(ladderRegion.getByText("Meridian 12M TD")).toBeVisible();
  await expect(ladderRegion.getByText("Horizon 12M monthly")).toBeVisible();
  await expect(ladderRegion.getByText("Apex savings account")).toBeVisible();

  await percySnapshot(page, "Investments - ladder view filled");
});

test("investments ladder — today marker visible when range spans today", async ({ page }) => {
  await seedAndGo(page);

  await page.getByRole("radio", { name: "Ladder" }).click();

  // The month axis and today label are rendered in the timeline header
  await expect(page.getByText("Today", { exact: true }).first()).toBeVisible();
});
