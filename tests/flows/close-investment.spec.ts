import { test, expect, type Page } from "@playwright/test";
import type { TimeDeposit } from "../../src/types";

// ─── Seed data ────────────────────────────────────────────────────────────────
// Frozen "today": 2026-03-06.
// td-active: matures 2026-09-01 (6 months away — clearly before maturity).
// savings-active: open-ended, no maturity date.
// td-closed: already closed, closeDate in the past.

const tdActive: TimeDeposit = {
  id: "close-td-active",
  bankId: "Meridian Savings Bank",
  name: "Meridian 6M TD",
  principal: 200000,
  startDate: "2026-03-01",
  termMonths: 6,
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
};

const savingsActive: TimeDeposit = {
  id: "close-savings-active",
  bankId: "Apex Rural Bank",
  name: "Apex Savings Account",
  principal: 100000,
  startDate: "2025-09-01",
  termMonths: 12,
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
};

const tdClosed: TimeDeposit = {
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
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function seedAndGo(page: Page, deposits: TimeDeposit[]) {
  await page.clock.setFixedTime(new Date(2026, 2, 6)); // Mar 6 2026
  await page.addInitScript((deps) => {
    localStorage.setItem("yf:deposits", JSON.stringify(deps));
  }, deposits);
  await page.goto("/investments");
}

// ─── Close early (time deposit) ───────────────────────────────────────────────

test("close early — dialog opens from action menu with maturity warning", async ({ page }) => {
  await seedAndGo(page, [tdActive]);

  await page.getByRole("button", { name: /more options for meridian 6m td/i }).click();
  await page.getByRole("menuitem", { name: /close early/i }).click();

  await expect(page.getByRole("alertdialog")).toBeVisible();
  await expect(page.getByText(/closing before maturity/i)).toBeVisible();
  await expect(page.getByText(/close account/i).last()).toBeVisible();
});

test("close early — cancel dismisses dialog without changing status", async ({ page }) => {
  await seedAndGo(page, [tdActive]);

  await page.getByRole("button", { name: /more options for meridian 6m td/i }).click();
  await page.getByRole("menuitem", { name: /close early/i }).click();
  await expect(page.getByRole("alertdialog")).toBeVisible();

  await page.getByRole("button", { name: /cancel/i }).click();
  await expect(page.getByRole("alertdialog")).not.toBeVisible();

  // Deposit still active — no "Closed" badge
  await expect(page.getByText("Active", { exact: true })).toBeVisible();
  await expect(page.getByText("Closed", { exact: true })).not.toBeVisible();
});

test("close early — confirm transitions deposit to Closed and hides it", async ({ page }) => {
  await seedAndGo(page, [tdActive]);

  await page.getByRole("button", { name: /more options for meridian 6m td/i }).click();
  await page.getByRole("menuitem", { name: /close early/i }).click();
  await expect(page.getByRole("alertdialog")).toBeVisible();

  await page.getByRole("alertdialog").getByRole("button", { name: /close account/i }).click();
  await expect(page.getByRole("alertdialog")).not.toBeVisible();

  // Closed deposit is hidden by default — row should be gone
  await expect(page.getByText("Meridian 6M TD", { exact: true })).not.toBeVisible();
});

test("close early — closed deposit visible after toggling 'Show inactive'", async ({ page }) => {
  await seedAndGo(page, [tdActive]);

  await page.getByRole("button", { name: /more options for meridian 6m td/i }).click();
  await page.getByRole("menuitem", { name: /close early/i }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: /close account/i }).click();

  // Toggle on
  await page.getByRole("switch", { name: "Show inactive" }).click();

  await expect(page.getByText("Meridian 6M TD", { exact: true })).toBeVisible();
  // Scope the Closed badge to the deposit's row
  const depositRow = page.getByRole("row").filter({ hasText: "Meridian 6M TD" });
  await expect(depositRow.getByText("Closed")).toBeVisible();
});

// ─── Close account (open-ended savings) ───────────────────────────────────────

test("close account (savings) — dialog has no maturity warning", async ({ page }) => {
  await seedAndGo(page, [savingsActive]);

  await page.getByRole("button", { name: /more options for apex savings account/i }).click();
  // Open-ended deposits show "Withdraw & close" in the menu
  await page.getByRole("menuitem", { name: /withdraw & close/i }).click();

  await expect(page.getByRole("alertdialog")).toBeVisible();
  await expect(page.getByText(/closing before maturity/i)).not.toBeVisible();
  await expect(page.getByText(/accrued net interest/i)).toBeVisible();
});

test("close account (savings) — confirm hides the savings deposit", async ({ page }) => {
  await seedAndGo(page, [savingsActive]);

  await page.getByRole("button", { name: /more options for apex savings account/i }).click();
  await page.getByRole("menuitem", { name: /withdraw & close/i }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: /close account/i }).click();

  await expect(page.getByText("Apex Savings Account", { exact: true })).not.toBeVisible();
});

// ─── Pre-existing closed deposit ──────────────────────────────────────────────

test("closed deposit hidden by default, shown after toggle", async ({ page }) => {
  await seedAndGo(page, [tdClosed]);

  await expect(page.getByText("Horizon 3M (closed)")).not.toBeVisible();

  await page.getByRole("switch", { name: "Show inactive" }).click();

  await expect(page.getByText("Horizon 3M (closed)")).toBeVisible();
  const closedRow = page.getByRole("row").filter({ hasText: "Horizon 3M (closed)" });
  await expect(closedRow.getByText("Closed", { exact: true })).toBeVisible();
});

// ─── Reopen ───────────────────────────────────────────────────────────────────

test("reopen — closed deposit reverts to active after reopening", async ({ page }) => {
  await seedAndGo(page, [tdClosed]);

  // Show closed deposits first
  await page.getByRole("switch", { name: "Show inactive" }).click();
  await expect(page.getByText("Horizon 3M (closed)")).toBeVisible();

  await page.getByRole("button", { name: /more options for horizon 3m \(closed\)/i }).click();
  await page.getByRole("menuitem", { name: /reopen/i }).click();

  // After reopening, toggle back off — deposit should be visible (active)
  await page.getByRole("switch", { name: "Show inactive" }).click();
  await expect(page.getByText("Horizon 3M (closed)")).toBeVisible();
  const activeRow = page.getByRole("row").filter({ hasText: "Horizon 3M (closed)" });
  await expect(activeRow.getByText("Active")).toBeVisible();
});

// ─── Undo close via toast ─────────────────────────────────────────────────────

test("close early — undo via toast reverts deposit to active", async ({ page }) => {
  await seedAndGo(page, [tdActive]);

  await page.getByRole("button", { name: /more options for meridian 6m td/i }).click();
  await page.getByRole("menuitem", { name: /close early/i }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: /close account/i }).click();

  // Toast appears — click Undo
  await page.getByRole("button", { name: /undo/i }).click();

  // Deposit is active again — visible without the toggle
  await expect(page.getByText("Meridian 6M TD", { exact: true })).toBeVisible();
  const reopenedRow = page.getByRole("row").filter({ hasText: "Meridian 6M TD" });
  await expect(reopenedRow.getByText("Active")).toBeVisible();
});
