import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import type { TimeDeposit } from "../../src/types";
import { makeActiveTimeDeposit, makeClosedTimeDeposit } from "../fixtures/deposits";

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

test("dashboard page has no critical a11y issues", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter(
    (v) => v.impact === "critical" || v.impact === "serious",
  );
  expect(blocking).toEqual([]);
});

test("dashboard page with data has no critical a11y issues", async ({ page }) => {
  await page.addInitScript((deposit) => {
    localStorage.setItem("yf:deposits", JSON.stringify([deposit]));
  }, seedDeposit);

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Portfolio" })).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter(
    (v) => v.impact === "critical" || v.impact === "serious",
  );
  expect(blocking).toEqual([]);
});

test("add investment dialog has no critical a11y issues", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Add my first investment" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();

  // Scope to the dialog only — the background LandingAnimation is decorative
  // (aria-hidden) and should not be checked for color contrast.
  const results = await new AxeBuilder({ page }).include('[role="dialog"]').analyze();
  const blocking = results.violations.filter(
    (v) => v.impact === "critical" || v.impact === "serious",
  );
  expect(blocking).toEqual([]);
});

test("investment page has no critical a11y issues", async ({ page }) => {
  await page.addInitScript((deposit) => {
    localStorage.setItem("yf:deposits", JSON.stringify([deposit]));
  }, seedDeposit);

  await page.goto("/investments");
  await expect(page.getByRole("heading", { level: 1, name: "Investments" })).toBeVisible();
  await expect(page.getByText("Beacon Bank", { exact: true })).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter(
    (v) => v.impact === "critical" || v.impact === "serious",
  );
  expect(blocking).toEqual([]);
});

test("edit investment dialog has no critical a11y issues", async ({ page }) => {
  await page.addInitScript((deposit) => {
    localStorage.setItem("yf:deposits", JSON.stringify([deposit]));
  }, seedDeposit);

  await page.goto("/investments");
  await expect(page.getByRole("heading", { level: 1, name: "Investments" })).toBeVisible();
  await expect(page.getByText("Beacon Bank", { exact: true })).toBeVisible();

  const moreOptionsBtn = page.getByRole("button", { name: /more options/i }).first();
  await moreOptionsBtn.click();
  await page.getByRole("menuitem", { name: /edit/i }).click();
  await expect(page.getByRole("dialog")).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter(
    (v) => v.impact === "critical" || v.impact === "serious",
  );
  expect(blocking).toEqual([]);
});

test("cash flow page has no critical a11y issues", async ({ page }) => {
  await page.addInitScript((deposit) => {
    localStorage.setItem("yf:deposits", JSON.stringify([deposit]));
  }, seedDeposit);

  await page.goto("/cashflow");

  await expect(page.getByRole("heading", { level: 1, name: "Cash Flow" })).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter(
    (v) => v.impact === "critical" || v.impact === "serious",
  );
  expect(blocking).toEqual([]);
});

test("cash flow page with data has no critical a11y issues", async ({ page }) => {
  await page.addInitScript((deposit) => {
    localStorage.setItem("yf:deposits", JSON.stringify([deposit]));
  }, seedDeposit);

  await page.goto("/cashflow");
  await expect(page.getByRole("heading", { level: 1, name: "Cash Flow" })).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter(
    (v) => v.impact === "critical" || v.impact === "serious",
  );
  expect(blocking).toEqual([]);
});

test("close early dialog has no critical/serious a11y issues", async ({ page }) => {
  const activeDeposit = makeActiveTimeDeposit({ id: "a11y-close-td" });

  await page.clock.setFixedTime(new Date(2026, 2, 6));
  await page.addInitScript((deposit: TimeDeposit) => {
    localStorage.setItem("yf:deposits", JSON.stringify([deposit]));
  }, activeDeposit);

  await page.goto("/investments");
  await expect(page.getByText("Beacon 6M TD")).toBeVisible();

  await page.getByRole("button", { name: /more options for beacon 6m td/i }).click();
  await page.getByRole("menuitem", { name: /close early/i }).click();
  await expect(page.getByRole("alertdialog")).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter(
    (v) => v.impact === "critical" || v.impact === "serious",
  );
  expect(blocking).toEqual([]);
});

test("investments page with closed deposit has no critical/serious a11y issues", async ({ page }) => {
  const closedDeposit = makeClosedTimeDeposit({ id: "a11y-closed-dep" });

  await page.addInitScript((deposit: TimeDeposit) => {
    localStorage.setItem("yf:deposits", JSON.stringify([deposit]));
  }, closedDeposit);

  await page.goto("/investments");
  await page.getByRole("switch", { name: "Show inactive" }).click();
  await expect(page.getByText("Beacon 3M (closed)")).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter(
    (v) => v.impact === "critical" || v.impact === "serious",
  );
  expect(blocking).toEqual([]);
});

test("reopen menu item on closed deposit has no critical/serious a11y issues", async ({ page }) => {
  const closedDeposit = makeClosedTimeDeposit({ id: "a11y-reopen-dep" });

  await page.addInitScript((deposit: TimeDeposit) => {
    localStorage.setItem("yf:deposits", JSON.stringify([deposit]));
  }, closedDeposit);

  await page.goto("/investments");
  await page.getByRole("switch", { name: "Show inactive" }).click();
  await expect(page.getByText("Beacon 3M (closed)")).toBeVisible();

  await page.getByRole("button", { name: /more options for beacon 3m \(closed\)/i }).click();
  await expect(page.getByRole("menuitem", { name: /reopen/i })).toBeVisible();

  // Scope to the open menu — the Base UI dropdown sets aria-hidden on the
  // background (sidebar, toolbar) which causes aria-hidden-focus false positives
  // for elements the user can't reach while the menu is open.
  const results = await new AxeBuilder({ page }).include('[role="menu"]').analyze();
  const blocking = results.violations.filter(
    (v) => v.impact === "critical" || v.impact === "serious",
  );
  expect(blocking).toEqual([]);
});

test("settings page has no critical a11y issues", async ({ page }) => {
  await page.addInitScript((deposit) => {
    localStorage.setItem("yf:deposits", JSON.stringify([deposit]));
  }, seedDeposit);

  await page.goto("/settings");
  await expect(page.getByRole("heading", { level: 1, name: "Settings" })).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter(
    (v) => v.impact === "critical" || v.impact === "serious",
  );
  expect(blocking).toEqual([]);
});
