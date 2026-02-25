import { test, expect } from "@playwright/test";
import path from "path";
import percySnapshot from "@percy/playwright";
import type { TimeDeposit } from "../../src/types";

const FIXTURE_PATH = path.resolve(__dirname, "../fixtures/portfolio.json");

const seedDeposit: TimeDeposit = {
  id: "export-test-dep",
  bankId: "Export Bank",
  name: "Export Bank 12M TD",
  principal: 200000,
  startDate: "2025-06-01",
  termMonths: 12,
  interestMode: "simple",
  interestTreatment: "payout",
  compounding: "daily",
  taxRateOverride: 0.2,
  flatRate: 0.058,
  tiers: [{ upTo: null, rate: 0.058 }],
  payoutFrequency: "maturity",
  dayCountConvention: 365,
  isOpenEnded: false,
  status: "active",
};

test("import JSON backup — deposits load and page redirects to dashboard", async ({ page }) => {
  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

  await percySnapshot(page, "Settings Page — empty");

  // Upload the fixture file
  await page.getByLabel("Import backup file").setInputFiles(FIXTURE_PATH);

  // Confirmation dialog should appear
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await expect(page.getByText(/Replace/)).toBeVisible();

  await percySnapshot(page, "Import Confirm Dialog");

  // Confirm the import
  await page.getByRole("button", { name: /Replace/i }).click();

  // Should redirect to dashboard with the imported deposits
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { name: "Yield Overview" })).toBeVisible();
  await expect(page.getByText("Meridian Savings Bank")).toBeVisible();
});

test("export JSON — triggers a file download", async ({ page }) => {
  await page.addInitScript((deposit) => {
    localStorage.setItem("yf:deposits", JSON.stringify([deposit]));
  }, seedDeposit);

  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

  // Set up download listener before clicking
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Export JSON" }).click(),
  ]);

  expect(download.suggestedFilename()).toMatch(/^yieldflow-export-\d{4}-\d{2}-\d{2}\.json$/);
});

test("import validation — shows error for malformed file", async ({ page }) => {
  await page.goto("/settings");

  // Create an in-memory bad JSON file using a buffer
  await page.getByLabel("Import backup file").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"version": 99, "deposits": []}'),
  });

  // Should show an error message (unsupported version)
  await expect(page.getByText(/Unsupported backup version/i)).toBeVisible();
  // Confirm dialog should NOT open
  await expect(page.getByRole("alertdialog")).not.toBeVisible();
});
