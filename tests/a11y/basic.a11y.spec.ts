import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import type { TimeDeposit } from "../../src/types";

const seedDeposit: TimeDeposit = {
  id: "a11y-test-dep",
  bankId: "Beacon Bank",
  name: "Beacon 6M TD",
  principal: 200000,
  startDate: "2025-09-01",
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
};

test("home has no critical a11y issues", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).analyze();
  const critical = results.violations.filter((v) => v.impact === "critical");
  expect(critical).toEqual([]);
});

test("settings page has no critical a11y issues", async ({ page }) => {
  await page.goto("/settings");
  const results = await new AxeBuilder({ page }).analyze();
  const critical = results.violations.filter((v) => v.impact === "critical");
  expect(critical).toEqual([]);
});

test("dashboard with data has no critical a11y issues", async ({ page }) => {
  await page.addInitScript((deposit) => {
    localStorage.setItem("yf:deposits", JSON.stringify([deposit]));
  }, seedDeposit);

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Yield Overview" })).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  const critical = results.violations.filter((v) => v.impact === "critical");
  expect(critical).toEqual([]);
});

test("add investment dialog has no critical a11y issues", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Add my first investment" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  const critical = results.violations.filter((v) => v.impact === "critical");
  expect(critical).toEqual([]);
});

test("edit investment dialog has no critical a11y issues", async ({ page }) => {
  await page.addInitScript((deposit) => {
    localStorage.setItem("yf:deposits", JSON.stringify([deposit]));
  }, seedDeposit);

  await page.goto("/");
  await expect(page.getByText("Beacon Bank")).toBeVisible();

  const moreOptionsBtn = page.getByRole("button", { name: /more options/i }).first();
  await moreOptionsBtn.click();
  await page.getByRole("menuitem", { name: /edit/i }).click();
  await expect(page.getByRole("dialog")).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  const critical = results.violations.filter((v) => v.impact === "critical");
  expect(critical).toEqual([]);
});
