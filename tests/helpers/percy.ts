import percySnapshot from "@percy/playwright";
import type { Page } from "@playwright/test";

/**
 * Drop-in replacement for percySnapshot that waits for all CSS fonts to finish
 * loading before handing off to Percy. Prevents the fallback system font from
 * appearing in snapshots when Geist hasn't loaded yet (display: swap).
 */
export async function snap(page: Page, name: string): Promise<void> {
  await page.evaluate(() => document.fonts.ready);
  await percySnapshot(page, name);
}
