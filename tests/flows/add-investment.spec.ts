import { test, expect } from "@playwright/test";
import percySnapshot from "@percy/playwright";

test("add an investment via wizard — empty state → portfolio visible", async ({ page }) => {
  await page.goto("/");

  // Empty landing is shown on a fresh session
  await expect(page.getByRole("heading", { name: "Track your yield ladder" })).toBeVisible();
  await percySnapshot(page, "Empty Landing");

  // Open wizard from empty landing CTA
  await page.getByRole("button", { name: "Add my first investment" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Add investment" })).toBeVisible();

  await percySnapshot(page, "Add Investment Dialog — empty");

  // Fill required fields
  await page.getByLabel("Bank").fill("Meridian Savings Bank");
  await page.getByRole('textbox', { name: 'Principal' }).fill("200000");
  // Interest rate — the input group renders an input next to the % addon
  await page.locator("#inv-rate").fill("6.5");
  // Select a 6-month term preset
  await page.getByRole("radio", { name: /Time Deposit/ }).click();
  await page.getByRole("radio", { name: "6 mo" }).click();

  // Wait for the live calc preview to load - this will change over time in Percy screenshot
  await expect(page.getByText("Net interest", { exact: true })).toBeVisible()
  await percySnapshot(page, "Add Investment Dialog — filled");

  // Submit
  await page.getByRole("button", { name: "Add investment" }).last().click();

  // Dialog should close and portfolio view should be visible
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.getByRole("heading", { name: "Yield Overview" })).toBeVisible();

  // The new investment should appear
  await expect(page.getByText("Meridian Savings Bank", { exact: true })).toBeVisible();
});
