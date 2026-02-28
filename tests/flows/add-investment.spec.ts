import { test, expect } from "@playwright/test";
import percySnapshot from "@percy/playwright";

test("add an investment via wizard — empty state → portfolio visible", async ({ page }) => {
  // Empty users land on the EmptyLanding hero at "/"
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Welcome to YieldFlow" })).toBeVisible();

  // Open wizard from empty landing CTA
  await page.getByRole("button", { name: "Add my first investment" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Add investment" })).toBeVisible();

  await percySnapshot(page, "Add Investment Dialog - empty");

  // Fill required fields
  await page.getByLabel("Bank").fill("Meridian Savings Bank");
  await page.getByRole('textbox', { name: 'Principal' }).fill("200000");
  // Interest rate — the input group renders an input next to the % addon
  await page.locator("#inv-rate").fill("6.5");
  // Select product type: Time Deposit (fixed term, maturity payout)
  await page.getByRole("radio", { name: /Time Deposit/ }).click();
  // Enter a 6-month term in the term input (presets were replaced with a number field)
  await page.locator("#inv-term").fill("6");

  // Wait for the live calc preview to load - this will change over time in Percy screenshot
  await expect(page.getByText("Net interest", { exact: true })).toBeVisible()
  await percySnapshot(page, "Add Investment Dialog - filled");

  // Submit
  await page.getByRole("button", { name: "Add investment" }).last().click();

  // Dialog should close and portfolio view should be visible
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.getByRole("heading", { name: "Portfolio" })).toBeVisible();

  // The new investment should appear in the bank exposure section on the dashboard
  await expect(page.getByText("Meridian Savings Bank", { exact: true })).toBeVisible();
});
