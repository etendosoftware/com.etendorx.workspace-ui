import { defineConfig, devices } from "@playwright/test";
import { resolve } from "path";
import { readFileSync } from "fs";

// Load .env from cypress-tests (same env vars)
const loadEnv = () => {
  try {
    const envFile = resolve(process.cwd(), "../cypress-tests/.env");
    const content = readFileSync(envFile, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...rest] = trimmed.split("=");
        if (key && !process.env[key]) process.env[key] = rest.join("=");
      }
    }
  } catch {
    // no .env file
  }
};

loadEnv();

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || process.env.CYPRESS_BASE_URL || "http://localhost:3000";
const IFRAME_URL = process.env.CYPRESS_IFRAME_URL || "localhost:8080";
const DEFAULT_USER = process.env.CYPRESS_USER || "admin";
const DEFAULT_PASSWORD = process.env.CYPRESS_PASSWORD || "admin";

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./test-results",
  reporter: [["html", { outputFolder: "playwright-report" }], ["list"]],

  use: {
    baseURL: BASE_URL,
    headless: true,
    viewport: { width: 1280, height: 720 },
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure",
    // Allow cross-origin iframes (equivalent to chromeWebSecurity: false)
    ignoreHTTPSErrors: true,
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Required for cross-origin iframe access (equivalent to Cypress chromeWebSecurity: false)
        launchOptions: {
          args: ["--disable-web-security", "--disable-site-isolation-trials"],
        },
      },
    },
  ],

  // Global test timeout (process-heavy flows need more time)
  timeout: 180_000,
  expect: { timeout: 15_000 },
});

export { BASE_URL, IFRAME_URL, DEFAULT_USER, DEFAULT_PASSWORD };
