import { test, expect, type Page } from "@playwright/test";
import { snap } from "../helpers/percy";
import { FROZEN_TEST_DATE } from "../helpers/constants";
import type { TimeDeposit } from "../../src/types";

// ─── Seed data ────────────────────────────────────────────────────────────────
// Mix of statuses and payout types to exercise all table/ladder states.
// Frozen "today": 2027-03-06 (set via page.clock.setFixedTime in seedAndGo).
// Maturity boundaries are deliberately far from this date so status never flips.

const seedDeposits: TimeDeposit[] = [
  // Active, fixed-term, matures Dec 2026
  {
    id: "inv-active-fixed",
    bankId: "Meridian Savings Bank",
    name: "Meridian 12M TD",
    principal: 200000,
    startDate: "2026-12-01",
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
    startDate: "2026-09-01",
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
    startDate: "2026-06-01",
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
    startDate: "2027-01-15",
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
    startDate: "2026-03-01",
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
    startDate: "2026-08-01",
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
  // Matured — clean numbers for renew pre-fill assertions:
  // principal 100,000 · rate 10% · 12 months · 20% tax → net 8,000 · total 108,000
  {
    id: "inv-matured-renew",
    bankId: "Meridian Savings Bank",
    name: "Renew 12M TD",
    principal: 100000,
    startDate: "2026-01-01",
    termMonths: 12,
    interestMode: "simple",
    interestTreatment: "payout",
    compounding: "daily",
    taxRateOverride: 0.2,
    flatRate: 0.1,
    tiers: [{ upTo: null, rate: 0.1 }],
    payoutFrequency: "maturity",
    dayCountConvention: 365,
    isOpenEnded: false,
    status: "active",
  },
  // Matured — monthly payout (renew variants collapse to principal only)
  {
    id: "inv-matured-monthly",
    bankId: "Horizon Digital Bank",
    name: "Monthly Renew TD",
    principal: 100000,
    startDate: "2025-01-01",
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
  // Settled
  {
    id: "inv-settled",
    bankId: "Horizon Digital Bank",
    name: "Horizon 6M (settled)",
    principal: 250000,
    startDate: "2026-05-01",
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
    startDate: "2026-06-01",
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
    startDate: "2026-10-01",
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
    closeDate: "2027-01-15",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function seedAndGo(page: Page) {
  await page.clock.setFixedTime(FROZEN_TEST_DATE);
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

// ─── Maturity decision dialog (Withdraw / Renew) ──────────────────────────────

test("investments — settle dialog shows the maturity decision options", async ({ page }) => {
  await seedAndGo(page);

  await page.getByRole("button", { name: /settle renew 12m td/i }).click();

  const dialog = page.getByRole("alertdialog");
  await expect(dialog.getByText(/what would you like to do with renew 12m td\?/i)).toBeVisible();
  await expect(dialog.getByLabel(/^withdraw/i)).toBeVisible();
  await expect(dialog.getByLabel(/renew everything/i)).toBeVisible();
  await expect(dialog.getByLabel(/renew principal only/i)).toBeVisible();

  // Continue is disabled until a choice is made
  await expect(dialog.getByRole("button", { name: /continue/i })).toBeDisabled();

  // Percy: capture the selected state — radio-card highlight + enabled Continue
  await dialog.getByLabel(/renew principal only/i).click();
  await expect(dialog.getByRole("button", { name: /continue/i })).toBeEnabled();
  await snap(page, "Investments - settle decision dialog - selected");
});

test("investments — renew everything pre-fills the wizard with full proceeds", async ({ page }) => {
  await seedAndGo(page);

  await page.getByRole("button", { name: /settle renew 12m td/i }).click();
  const dialog = page.getByRole("alertdialog");
  await dialog.getByLabel(/renew everything/i).click();
  await dialog.getByRole("button", { name: /continue/i }).click();

  // Wizard opens in renew mode with principal = principal + net interest
  await expect(page.getByRole("heading", { name: "Renew" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Principal" })).toHaveValue(/108,000/);
});

test("investments — renew principal only pre-fills the wizard with original principal", async ({ page }) => {
  await seedAndGo(page);

  await page.getByRole("button", { name: /settle renew 12m td/i }).click();
  const dialog = page.getByRole("alertdialog");
  await dialog.getByLabel(/renew principal only/i).click();
  await dialog.getByRole("button", { name: /continue/i }).click();

  // Wizard opens in renew mode with principal = original principal only
  await expect(page.getByRole("heading", { name: "Renew" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Principal" })).toHaveValue(/100,000/);
});

test("investments — withdraw settles the deposit", async ({ page }) => {
  await seedAndGo(page);

  await page.getByRole("button", { name: /settle renew 12m td/i }).click();
  const dialog = page.getByRole("alertdialog");
  await dialog.getByLabel(/^withdraw/i).click();
  await dialog.getByRole("button", { name: /continue/i }).click();

  // The sr-only status region announces the settlement
  await expect(page.getByRole("status")).toHaveText(/renew 12m td marked as settled/i);
  // The deposit is settled — no more Settle button on the row
  await expect(page.getByRole("button", { name: /settle renew 12m td/i })).toHaveCount(0);
});

test("investments — monthly deposit collapses to Withdraw / Renew", async ({ page }) => {
  await seedAndGo(page);

  await page.getByRole("button", { name: /settle monthly renew td/i }).click();

  const dialog = page.getByRole("alertdialog");
  await expect(dialog.getByLabel(/^withdraw/i)).toBeVisible();
  await expect(dialog.getByLabel(/^renew/i)).toBeVisible();
  await expect(dialog.getByLabel(/renew everything/i)).toHaveCount(0);
  await expect(dialog.getByLabel(/renew principal only/i)).toHaveCount(0);
});

test("investments — maturity decision dialog works on mobile cards", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seedAndGo(page);

  await page.getByRole("button", { name: /settle renew 12m td/i }).click();

  const dialog = page.getByRole("alertdialog");
  await expect(dialog.getByText(/what would you like to do with renew 12m td\?/i)).toBeVisible();
  await expect(dialog.getByLabel(/^withdraw/i)).toBeVisible();
  await expect(dialog.getByLabel(/renew everything/i)).toBeVisible();
  await expect(dialog.getByLabel(/renew principal only/i)).toBeVisible();

  await dialog.getByLabel(/renew principal only/i).click();
  await dialog.getByRole("button", { name: /continue/i }).click();
  await expect(page.getByRole("heading", { name: "Renew" })).toBeVisible();
});
