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

  // All tests share a single Etendo instance. Suites run group-by-group via
  // project dependencies so no two groups overlap. Within each group, up to 3
  // workers run spec files in parallel.
  workers: 3,
  fullyParallel: false,

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
    // ── Shared browser options ───────────────────────────────────────────────
    // Each suite group below spreads via this use block.
    // (Playwright requires each project to declare its own browser.)

    // Group 1 — Performance (runs first, alone — stress tests can saturate the server)
    {
      name: "suite-00-performance",
      testMatch: ["**/performance/**"],
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: { args: ["--disable-web-security", "--disable-site-isolation-trials"] },
      },
    },

    // Group 2 — Login, Masterdata, Filters, LinkedItems (no shared financial state)
    {
      name: "suite-01-base",
      testMatch: [
        "**/00_Login/**",
        "**/04_Masterdata/**",
        "**/06_filters/**",
        "**/07_LinkedItems/**",
        "**/PurchaseOrderDisplayLogicTest*",
      ],
      dependencies: ["suite-00-performance"],
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: { args: ["--disable-web-security", "--disable-site-isolation-trials"] },
      },
    },

    // Group 3 — Sales (starts only after Group 2 finishes)
    {
      name: "suite-02-sales",
      testMatch: ["**/01_Sales/**"],
      dependencies: ["suite-01-base"],
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: { args: ["--disable-web-security", "--disable-site-isolation-trials"] },
      },
    },

    // Group 4 — Procurement (starts only after Sales finishes)
    {
      name: "suite-03-procurement",
      testMatch: ["**/03_Procurement/**"],
      dependencies: ["suite-02-sales"],
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: { args: ["--disable-web-security", "--disable-site-isolation-trials"] },
      },
    },

    // Group 5 — Financial (most fragile — runs last, alone)
    {
      name: "suite-04-financial",
      testMatch: ["**/05_Financial/**"],
      dependencies: ["suite-03-procurement"],
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: { args: ["--disable-web-security", "--disable-site-isolation-trials"] },
      },
    },
  ],

  // Global test timeout — when tests run sequentially the server is slower due
  // to accumulated data. Individual tests can override with test.setTimeout().
  timeout: 120_000,
  expect: { timeout: 15_000 },
});

export { BASE_URL, IFRAME_URL, DEFAULT_USER, DEFAULT_PASSWORD };
