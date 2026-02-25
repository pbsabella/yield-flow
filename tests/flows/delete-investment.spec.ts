import { test, expect } from "@playwright/test";
import type { TimeDeposit } from "../../src/types";

const seedDeposits: TimeDeposit[] = [
  {
    id: "delete-test-dep-1",
    bankId: "Axiom Bank",
    name: "Axiom 3M TD",
    principal: 50000,
    startDate: "2025-11-01",
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
  },
  {
    id: "delete-test-dep-2",
    bankId: "Bastion Bank",
    name: "Bastion 6M TD",
    principal: 75000,
    startDate: "2025-10-15",
    termMonths: 6,
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
];

test("delete an investment — row is removed from the portfolio", async ({ page }) => {
  await page.addInitScript((deposits) => {
    localStorage.setItem("yf:deposits", JSON.stringify(deposits));
  }, seedDeposits);

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Yield Overview" })).toBeVisible();
  await expect(page.getByText("Axiom Bank")).toBeVisible();
  await expect(page.getByText("Bastion Bank")).toBeVisible();

  // Open kebab for the first deposit
  const moreOptionsBtn = page.getByRole("button", { name: /more options/i }).first();
  await moreOptionsBtn.click();
  await page.getByRole("menuitem", { name: /delete/i }).click();

  // Delete confirmation dialog
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await page.getByRole("button", { name: /delete/i }).last().click();

  // Axiom should be gone; Bastion should remain
  await expect(page.getByText("Axiom Bank")).not.toBeVisible();
  await expect(page.getByText("Bastion Bank")).toBeVisible();
});

test("cancelling a delete dialog leaves the deposit intact", async ({ page }) => {
  await page.addInitScript((deposits) => {
    localStorage.setItem("yf:deposits", JSON.stringify(deposits));
  }, seedDeposits);

  await page.goto("/");
  await expect(page.getByText("Axiom Bank")).toBeVisible();

  const moreOptionsBtn = page.getByRole("button", { name: /more options/i }).first();
  await moreOptionsBtn.click();
  await page.getByRole("menuitem", { name: /delete/i }).click();

  await expect(page.getByRole("alertdialog")).toBeVisible();
  await page.getByRole("button", { name: /cancel/i }).click();

  // All deposits still visible
  await expect(page.getByText("Axiom Bank")).toBeVisible();
  await expect(page.getByText("Bastion Bank")).toBeVisible();
});
