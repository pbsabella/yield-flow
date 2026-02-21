import { defineConfig, devices } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:4173";
const rootDir = path.dirname(fileURLToPath(import.meta.url));
const useWebServer =
  process.env.PLAYWRIGHT_WEB_SERVER === "1" ||
  (!process.env.PLAYWRIGHT_BASE_URL && process.env.PLAYWRIGHT_WEB_SERVER !== "0");

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL,
  },
  webServer: useWebServer
    ? {
        command: "npm run dev -- --hostname 127.0.0.1 --port 4173",
        cwd: rootDir,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
      }
    : undefined,
  projects: [
    {
      name: "e2e",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /.*\.spec\.ts/,
    },
    {
      name: "a11y",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /.*\.a11y\.spec\.ts/,
    },
  ],
});
