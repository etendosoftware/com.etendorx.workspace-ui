import { defineConfig, devices } from "@playwright/test";
import { resolve } from "path";
import { readFileSync } from "fs";

// Load .env from cypress-tests (same env vars)
// NOTE: disabled — cypress-tests/.env may have stale credentials that differ
// from the current backend. Values are set via PLAYWRIGHT_BASE_URL /
// CYPRESS_BASE_URL / CYPRESS_IFRAME_URL env vars or use the defaults below.
const loadEnv = () => {
  try {
    const envFile = resolve(process.cwd(), "../cypress-tests/.env");
    const content = readFileSync(envFile, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...rest] = trimmed.split("=");
        // Only load non-credential env vars to avoid stale password overrides
        if (key && !process.env[key] && key !== "CYPRESS_PASSWORD" && key !== "CYPRESS_USER") {
          process.env[key] = rest.join("=");
        }
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
  workers: 2,
  fullyParallel: false,

  // Retry transient failures. On CI the Chromium launch can SIGSEGV in the
  // container (see --no-zygote note below), and it lands on a random spec each
  // run — a retry clears it. Real regressions fail all attempts. 0 locally so
  // flakes surface during development.
  retries: process.env.CI ? 2 : 0,

  use: {
    baseURL: BASE_URL,
    headless: true,
    viewport: { width: 1280, height: 720 },
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure",
    ignoreHTTPSErrors: true,
    // --no-zygote prevents Chromium from using the zygote process model for
    // spawning renderers. In container/CI environments with restricted namespaces
    // the zygote fork can produce a SIGSEGV (General Protection Fault) during
    // browser launch, particularly after prolonged test runs.
    launchOptions: {
      args: ["--disable-web-security", "--disable-site-isolation-trials", "--no-zygote"],
    },
  },

  projects: [
    // Group 1 — Performance (runs first, alone — stress tests can saturate the server)
    {
      name: "suite-00-performance",
      testMatch: ["**/performance/**"],
      use: { ...devices["Desktop Chrome"] },
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
      timeout: 360_000,
      use: { ...devices["Desktop Chrome"] },
    },

    // Group 3 — Sales (starts only after Group 2 finishes)
    {
      name: "suite-02-sales",
      testMatch: ["**/01_Sales/**"],
      dependencies: ["suite-01-base"],
      timeout: 720_000,
      use: { ...devices["Desktop Chrome"] },
    },

    // Group 4 — Procurement (starts only after Sales finishes)
    {
      name: "suite-03-procurement",
      testMatch: ["**/03_Procurement/**"],
      dependencies: ["suite-02-sales"],
      timeout: 360_000,
      use: { ...devices["Desktop Chrome"] },
    },

    // Group 5 — Financial (most fragile — runs last, alone)
    {
      name: "suite-04-financial",
      testMatch: ["**/05_Financial/**"],
      dependencies: ["suite-03-procurement"],
      timeout: 360_000,
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Global test timeout for suite-00-performance. Smoke suites set their own
  // higher timeouts at the project level above.
  timeout: 120_000,
  expect: { timeout: 15_000 },
});

export { BASE_URL, IFRAME_URL, DEFAULT_USER, DEFAULT_PASSWORD };
