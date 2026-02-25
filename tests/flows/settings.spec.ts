import { test, expect } from "@playwright/test";
import percySnapshot from "@percy/playwright";
import type { TimeDeposit } from "../../src/types";

const seedDeposit: TimeDeposit = {
  id: "settings-test-dep",
  bankId: "Clearance Bank",
  name: "Clearance 3M TD",
  principal: 50000,
  startDate: "2025-12-01",
  termMonths: 3,
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

test("settings page renders correctly", async ({ page }) => {
  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  await expect(page.getByText("Data management")).toBeVisible();
  await percySnapshot(page, "Settings Page");
});

test("settings — export and clear buttons disabled with no deposits", async ({ page }) => {
  await page.goto("/settings");
  await expect(page.getByRole("button", { name: "Export JSON" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Clear all" })).toBeDisabled();
});

test("settings — export and clear buttons enabled with deposits", async ({ page }) => {
  await page.addInitScript((deposit) => {
    localStorage.setItem("yf:deposits", JSON.stringify([deposit]));
  }, seedDeposit);

  await page.goto("/settings");
  await expect(page.getByRole("button", { name: "Export JSON" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Clear all" })).toBeEnabled();
  await percySnapshot(page, "Settings Page — with data");
});

test("settings — clear all data removes deposits and redirects home", async ({ page }) => {
  await page.addInitScript((deposit) => {
    localStorage.setItem("yf:deposits", JSON.stringify([deposit]));
  }, seedDeposit);

  await page.goto("/settings");
  await page.getByRole("button", { name: "Clear all" }).click();

  // Destructive confirmation dialog
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await expect(page.getByRole("heading", { name: /Clear all data?/ })).toBeVisible();
  await percySnapshot(page, "Clear Data Confirm Dialog");

  await page.getByRole("button", { name: "Clear all data" }).click();

  // Should redirect to dashboard and show empty landing
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { name: "Track your yield ladder" })).toBeVisible();
});

test("settings — cancelling clear all leaves data intact", async ({ page }) => {
  await page.addInitScript((deposit) => {
    localStorage.setItem("yf:deposits", JSON.stringify([deposit]));
  }, seedDeposit);

  await page.goto("/settings");
  await page.getByRole("button", { name: "Clear all" }).click();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();

  // Still on settings page, deposits still exist
  await expect(page).toHaveURL("/settings");
  await expect(page.getByRole("button", { name: "Clear all" })).toBeEnabled();
});

test("settings — back link returns to dashboard", async ({ page }) => {
  await page.goto("/settings");
  await page.getByRole("link", { name: /Dashboard/ }).click();
  await expect(page).toHaveURL("/");
});

test("settings — caveats section expands on click", async ({ page }) => {
  await page.goto("/settings");
  const trigger = page.getByRole("button", { name: /What you should know/i });
  await expect(trigger).toBeVisible();
  await trigger.click();
  await expect(page.getByText(/unencrypted/i)).toBeVisible();
});
