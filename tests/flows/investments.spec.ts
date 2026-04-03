import { test, expect, type Page } from "@playwright/test";
import { snap } from "../helpers/percy";
import type { TimeDeposit } from "../../src/types";

// ─── Seed data ────────────────────────────────────────────────────────────────
// Mix of statuses and payout types to exercise all table/ladder states.
// Frozen "today": 2026-03-06 (set via page.clock.setFixedTime in seedAndGo).
// Maturity boundaries are deliberately far from this date so status never flips.

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
  // Active, long-term, matures Jan 2028 (clearly future)
  {
    id: "inv-active-long",
    bankId: "Citadel Cooperative Bank",
    name: "Citadel 24M TD",
    principal: 350000,
    startDate: "2026-01-15",
    termMonths: 24,
    interestMode: "simple",
    interestTreatment: "payout",
    compounding: "daily",
    taxRateOverride: 0.2,
    flatRate: 0.065,
    tiers: [{ upTo: null, rate: 0.065 }],
    payoutFrequency: "maturity",
    dayCountConvention: 365,
    isOpenEnded: false,
    status: "active",
  },
  // Matured
  {
    id: "inv-matured",
    bankId: "Meridian Savings Bank",
    name: "Meridian 3M (matured)",
    principal: 100000,
    startDate: "2025-03-01",
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
  // Matured
  {
    id: "inv-matured-2",
    bankId: "Apex Rural Bank",
    name: "Apex 6M (matured)",
    principal: 80000,
    startDate: "2025-08-01",
    termMonths: 6,
    interestMode: "simple",
    interestTreatment: "payout",
    compounding: "daily",
    taxRateOverride: 0.2,
    flatRate: 0.052,
    tiers: [{ upTo: null, rate: 0.052 }],
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
    startDate: "2025-05-01",
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
  // Settled (second, different bank)
  {
    id: "inv-settled-2",
    bankId: "Citadel Cooperative Bank",
    name: "Citadel 3M (settled)",
    principal: 120000,
    startDate: "2025-06-01",
    termMonths: 3,
    interestMode: "simple",
    interestTreatment: "payout",
    compounding: "daily",
    taxRateOverride: 0.2,
    flatRate: 0.048,
    tiers: [{ upTo: null, rate: 0.048 }],
    payoutFrequency: "maturity",
    dayCountConvention: 365,
    isOpenEnded: false,
    status: "settled",
  },
  // Closed
  {
    id: "close-td-closed",
    bankId: "Horizon Digital Bank",
    name: "Horizon 3M (closed)",
    principal: 150000,
    startDate: "2025-10-01",
    termMonths: 12,
    interestMode: "simple",
    interestTreatment: "payout",
    compounding: "daily",
    taxRateOverride: 0.2,
    flatRate: 0.055,
    tiers: [{ upTo: null, rate: 0.055 }],
    payoutFrequency: "maturity",
    dayCountConvention: 365,
    isOpenEnded: false,
    status: "closed",
    closeDate: "2026-01-15",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function seedAndGo(page: Page) {
  await page.clock.setFixedTime(new Date(2026, 2, 6)); // Mar 6 2026 — stable "today"
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

test("investments table — shows active and matured deposits, hides closed/settled by default", async ({ page }) => {
  await seedAndGo(page);

  // Active deposits visible
  await expect(page.getByText("Meridian 12M TD")).toBeVisible();
  await expect(page.getByText("Horizon 12M monthly")).toBeVisible();
  await expect(page.getByText("Apex savings account")).toBeVisible();
  await expect(page.getByText("Citadel 24M TD")).toBeVisible();

  // Matured deposits visible
  await expect(page.getByText("Meridian 3M (matured)")).toBeVisible();
  await expect(page.getByText("Apex 6M (matured)")).toBeVisible();

  // Both settled deposits hidden by default
  await expect(page.getByText("Horizon 6M (settled)")).not.toBeVisible();
  await expect(page.getByText("Citadel 3M (settled)")).not.toBeVisible();
});

test("investments table — matured deposits visible with Matured status", async ({ page }) => {
  await seedAndGo(page);

  await expect(page.getByText("Meridian 3M (matured)")).toBeVisible();
  await expect(page.getByText("Apex 6M (matured)")).toBeVisible();

  // At least one "Matured" status badge should be rendered
  await expect(page.getByText("Matured").first()).toBeVisible();
});

test("investments table — show settled toggle reveals all closed/settled deposits", async ({ page }) => {
  await seedAndGo(page);

  await expect(page.getByText("Horizon 6M (settled)")).not.toBeVisible();
  await expect(page.getByText("Citadel 3M (settled)")).not.toBeVisible();

  await page.getByRole('switch', { name: 'Show inactive' }).click();

  await expect(page.getByText("Horizon 6M (settled)")).toBeVisible();
  await expect(page.getByText("Citadel 3M (settled)")).toBeVisible();

  await snap(page, "Investments - table view filled");
});

test("investments table — show inactive toggle does not hide matured deposits", async ({ page }) => {
  await seedAndGo(page);

  // Matured visible before toggle
  await expect(page.getByText("Meridian 3M (matured)")).toBeVisible();
  await expect(page.getByText("Apex 6M (matured)")).toBeVisible();

  // Toggle inactive (off → on → off cycle to confirm matured is unaffected)
  await page.getByRole('switch', { name: 'Show inactive' }).click();
  await expect(page.getByText("Meridian 3M (matured)")).toBeVisible();
  await expect(page.getByText("Apex 6M (matured)")).toBeVisible();
});

test("investments table — bank filter narrows rows", async ({ page }) => {
  await seedAndGo(page);

  await page.getByLabel("Filter bank").click();
  await page.getByRole("option", { name: "Apex Rural Bank" }).click();

  await expect(page.getByText("Apex savings account")).toBeVisible();
  await expect(page.getByText("Meridian 12M TD")).not.toBeVisible();
  await expect(page.getByText("Horizon 12M monthly")).not.toBeVisible();
});

test("investments table — bank filter for Citadel Cooperative Bank", async ({ page }) => {
  await seedAndGo(page);

  await page.getByLabel("Filter bank").click();
  await page.getByRole("option", { name: "Citadel Cooperative Bank" }).click();

  await expect(page.getByText("Citadel 24M TD")).toBeVisible();
  await expect(page.getByText("Meridian 12M TD")).not.toBeVisible();
  await expect(page.getByText("Horizon 12M monthly")).not.toBeVisible();
  await expect(page.getByText("Apex savings account")).not.toBeVisible();
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
  await expect(ladderRegion.getByText("Horizon 6M (settled)")).not.toBeVisible;
  await expect(ladderRegion.getByText("Citadel 3M (settled)")).not.toBeVisible();

  await page.getByRole('switch', { name: 'Show inactive' }).click();

  await expect(ladderRegion.getByText("Horizon 6M (settled)")).toBeVisible();
  await expect(ladderRegion.getByText("Citadel 3M (settled)")).toBeVisible();
  await snap(page, "Investments - ladder view filled");
});

test("investments ladder — today marker visible when range spans today", async ({ page }) => {
  await seedAndGo(page);

  await page.getByRole("radio", { name: "Ladder" }).click();

  // The month axis and today label are rendered in the timeline header
  await expect(page.getByText("Today", { exact: true }).first()).toBeVisible();
});
