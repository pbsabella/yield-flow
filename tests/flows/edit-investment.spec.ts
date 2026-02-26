import { test, expect } from "@playwright/test";
import percySnapshot from "@percy/playwright";
import type { TimeDeposit } from "../../src/types";

const seedDeposit: TimeDeposit = {
  id: "edit-test-dep-1",
  bankId: "Original Bank",
  name: "Original 6M TD",
  principal: 100000,
  startDate: "2025-09-01",
  termMonths: 6,
  interestMode: "simple",
  interestTreatment: "payout",
  compounding: "daily",
  taxRateOverride: 0.2,
  flatRate: 0.055,
  tiers: [{ upTo: null, rate: 0.055 }],
  payoutFrequency: "maturity",
  dayCountConvention: 365,
  isOpenEnded: false,
  status: "active",
};

test("edit an investment — values persist after save", async ({ page }) => {
  // Seed localStorage before navigation
  await page.addInitScript((deposit) => {
    localStorage.setItem("yf:deposits", JSON.stringify([deposit]));
  }, seedDeposit);

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Yield Overview" })).toBeVisible();
  await expect(page.getByText("Original Bank", { exact: true })).toBeVisible();

  // Open kebab menu for the deposit (mobile card or desktop table)
  // The aria-label includes the deposit name
  const moreOptionsBtn = page
    .getByRole("button", { name: /more options/i })
    .first();
  await moreOptionsBtn.click();

  // Click Edit in the dropdown
  await page.getByRole("menuitem", { name: /edit/i }).click();

  // Dialog should open in edit mode
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Edit investment" })).toBeVisible();

  // Wait for the live calc preview to load - this will change over time in Percy screenshot
  await expect(page.getByText("Estimate only")).toBeVisible()
  await percySnapshot(page, "Edit Investment Dialog");

  // Change the bank name
  await page.getByRole("combobox", { name: "Bank" }).clear();
  await page.getByRole("combobox", { name: "Bank" }).fill("Updated Bank");

  // Save
  await page.getByRole("button", { name: "Save changes" }).click();

  // Dialog closes and updated name appears
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.getByText("Updated Bank", { exact: true })).toBeVisible();
});

test("closing an unmodified edit dialog does not prompt for discard", async ({ page }) => {
  await page.addInitScript((deposit) => {
    localStorage.setItem("yf:deposits", JSON.stringify([deposit]));
  }, seedDeposit);

  await page.goto("/");
  await expect(page.getByText("Original Bank", { exact: true })).toBeVisible();

  const moreOptionsBtn = page.getByRole("button", { name: /more options/i }).first();
  await moreOptionsBtn.click();
  await page.getByRole("menuitem", { name: /edit/i }).click();
  await expect(page.getByRole("dialog")).toBeVisible();

  // Close without making changes — should close directly, no discard dialog
  await page.keyboard.press("Escape");

  // The discard confirm dialog should NOT appear
  await expect(page.getByRole("alertdialog")).not.toBeVisible();
  await expect(page.getByRole("dialog")).not.toBeVisible();
});
