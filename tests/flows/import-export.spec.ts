import { test, expect, type Page } from "@playwright/test";
import path from "path";
import { readFileSync } from "fs";
import percySnapshot from "@percy/playwright";
import type { TimeDeposit } from "../../src/types";

const FIXTURE_PATH = path.resolve(__dirname, "../fixtures/portfolio.json");
const BAD_FIXTURE_PATH = path.resolve(__dirname, "../fixtures/bad-version.json");

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

/**
 * Simulate a file import on the hidden <input type="file" aria-label="Import backup file">.
 *
 * Playwright's setInputFiles uses CDP which does not reliably fire React 19's
 * delegated change event on hidden inputs. This helper bypasses that by:
 *  1. Reading the file content in Node.js (no browser API constraints)
 *  2. Creating a File object in the browser via DataTransfer
 *  3. Attaching it to the input's files property
 *  4. Calling React's onChange handler directly via the React fiber tree
 */
async function simulateFileImport(page: Page, filePath: string, fileName: string) {
  const content = readFileSync(filePath, "utf-8");

  await page.evaluate(
    ({ content, fileName }: { content: string; fileName: string }) => {
      return new Promise<void>((resolve, reject) => {
        const input = document.querySelector(
          'input[aria-label="Import backup file"]',
        ) as HTMLInputElement | null;
        if (!input) return reject(new Error("Import file input not found"));

        // Locate the React 19 fiber key (e.g. __reactFiber$abc123)
        const fiberKey = Object.keys(input).find((k) => /^__reactFiber/.test(k));
        if (!fiberKey) return reject(new Error("React fiber key not found on input"));

        // Walk the fiber return chain to find the node that owns the onChange prop
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let fiber: any = (input as unknown as Record<string, unknown>)[fiberKey];
        while (fiber && fiber.memoizedProps?.onChange == null) {
          fiber = fiber.return;
        }

        const onChange: ((e: { target: HTMLInputElement }) => void) | undefined =
          fiber?.memoizedProps?.onChange;
        if (typeof onChange !== "function")
          return reject(new Error("onChange handler not found in React fiber"));

        // Build an in-memory File and attach it to the input so e.target.files[0] works
        const file = new File([content], fileName, { type: "application/json" });
        const dt = new DataTransfer();
        dt.items.add(file);
        Object.defineProperty(input, "files", { value: dt.files, configurable: true });

        // Invoke the React handler — handleFileChange only reads e.target.files?.[0]
        try {
          onChange({ target: input });
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    },
    { content, fileName },
  );
}

// TODO: Fix flakey test
test.skip("import JSON backup — deposits load and page redirects to dashboard", async ({ page }) => {
  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

  await simulateFileImport(page, FIXTURE_PATH, "portfolio.json");

  // Confirmation dialog should appear
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await expect(page.getByText(/Replace all data?/)).toBeVisible();

  await percySnapshot(page, "Import Confirm Dialog");

  // Confirm the import
  await page.getByRole("button", { name: /Replace/i }).click();

  // Should redirect to dashboard with the imported deposits
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { name: "Portfolio" })).toBeVisible();
  await expect(page.getByText("Meridian Savings Bank", { exact: true })).toBeVisible();
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

// TODO: Fix me
test.skip("import validation — shows error for malformed file", async ({ page }) => {
  await page.goto("/settings");

  await simulateFileImport(page, BAD_FIXTURE_PATH, "bad.json");

  // Should show an error message (unsupported version)
  await expect(page.getByText(/Unsupported backup version/i)).toBeVisible();
  // Confirm dialog should NOT open
  await expect(page.getByRole("alertdialog")).not.toBeVisible();
});
