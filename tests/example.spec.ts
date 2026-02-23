import { test, expect } from "@playwright/test";
import percySnapshot from "@percy/playwright";

// Basic smoke test. Add your real flows here.
test("home loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "YieldFlow" })).toBeVisible();

  await percySnapshot(page, "Dashboard");

  await page.getByRole("button", { name: "Add investment" }).click();
  await expect(page.getByRole("heading", { name: /add an investment/i })).toBeVisible();
  await percySnapshot(page, "Deposit Modal");
});
