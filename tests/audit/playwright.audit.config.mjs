import { defineConfig, devices } from "@playwright/test";

// Standalone config for the usage/UI/UX audit suite.
// It is deliberately kept out of `playwright.config.mjs` so that the Phase 9
// certification gate in CI stays independent of this exploratory suite.
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined;
const launchOptions = executablePath ? { executablePath } : undefined;

export default defineConfig({
  testDir: ".",
  testMatch: "ux-audit.spec.mjs",
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  retries: 0,
  timeout: 45_000,
  reporter: [["list"], ["html", { open: "never", outputFolder: "../../playwright-report-audit" }]],
  use: { baseURL, trace: "retain-on-failure", screenshot: "only-on-failure", launchOptions },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"], launchOptions } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"], launchOptions } },
  ],
});
