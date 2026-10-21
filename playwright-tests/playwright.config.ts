import { defineConfig, devices } from "@playwright/test";

/**
 * First environment variable set among `names`, otherwise `fallback`. The CYPRESS_* names are kept
 * as fallbacks for environments that still export them.
 */
const envOr = (names: string[], fallback: string): string =>
  names.map((name) => process.env[name]).find((value) => value) ?? fallback;

const BASE_URL = envOr(["PLAYWRIGHT_BASE_URL", "CYPRESS_BASE_URL"], "http://localhost:3000");
const IFRAME_URL = envOr(["PLAYWRIGHT_IFRAME_URL", "CYPRESS_IFRAME_URL"], "localhost:8080");
const DEFAULT_USER = envOr(["PLAYWRIGHT_USER", "CYPRESS_USER"], "admin");
const DEFAULT_PASSWORD = envOr(["PLAYWRIGHT_PASSWORD", "CYPRESS_PASSWORD"], "admin");

const DESKTOP_CHROME = { ...devices["Desktop Chrome"] };
/** Last project of the smoke chain: the regression and mocked projects run after it. */
const LAST_SMOKE_PROJECT = "suite-04-financial";

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./test-results",
  // flaky-summary lists the tests that passed only after a retry (test-results/flaky-tests.json).
  reporter: [["html", { outputFolder: "playwright-report" }], ["list"], ["./reporters/flaky-summary.mjs"]],

  // All tests share a single Etendo instance. Suites run group-by-group via
  // project dependencies so no two groups overlap. Within each group, the
  // project's `workers` sets how many spec files run in parallel: only specs
  // that never touch each other's data share a group. This is the total limit.
  workers: 3,
  fullyParallel: false,
  // Retry transient failures on CI. Jenkins shares the CI box across jobs: under
  // load, API responses that are normally instant can exceed a helper's timeout
  // once, and the Chromium launch can SIGSEGV in the container (see --no-zygote
  // note below) on a random spec. A retry clears both; real regressions fail all
  // attempts. 0 locally so flakes surface during development. Tests that pass
  // only after a retry are listed by the flaky-summary reporter.
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
    // Unit tests of the support layer (registries and pure helpers): no browser, run first
    {
      name: "support-unit",
      testMatch: ["**/support/__tests__/**"],
    },

    // Group 1 — Performance (runs first, alone — stress tests can saturate the server)
    {
      name: "suite-00-performance",
      testMatch: ["**/performance/**"],
      dependencies: ["support-unit"],
      workers: 2,
      use: DESKTOP_CHROME,
    },

    // Group 2 — Login, Masterdata, Filters, LinkedItems (no shared financial state) and the feature
    // probes that only read sample data or change records they created themselves.
    // Read-only specs or records with unique names: safe in parallel.
    {
      name: "suite-01-base",
      testMatch: [
        "**/00_Login/**",
        "**/04_Masterdata/**",
        "**/06_filters/**",
        "**/07_LinkedItems/**",
        "**/PurchaseOrderDisplayLogicTest*",
        // PRCb never executes the payment: its onProcess aborts and the request is blocked
        "**/smoke/08_Process/PRCb*",
        "**/smoke/09_Form/**",
        "**/smoke/10_Grid/**",
        "**/smoke/11_Navigation/**",
        // SESa never ticks "Save as default": the defaults other specs start from stay as they are
        "**/smoke/12_Session/**",
      ],
      dependencies: ["suite-00-performance"],
      timeout: 360_000,
      workers: 3,
      use: DESKTOP_CHROME,
    },

    // Group 3 — Sales (starts only after Group 2 finishes). Each spec selects only its own documents:
    // SALc ships only its orders, SALa invoices only its shipment.
    {
      name: "suite-02-sales",
      testMatch: ["**/01_Sales/**"],
      dependencies: ["suite-01-base"],
      timeout: 720_000,
      workers: 3,
      use: DESKTOP_CHROME,
    },

    // Group 4 — Procurement (starts only after Sales finishes). Each spec filters by its own
    // document numbers; PROe runs the client-wide costing process, harmless to the others.
    {
      name: "suite-03-procurement",
      testMatch: ["**/03_Procurement/**"],
      dependencies: ["suite-02-sales"],
      timeout: 360_000,
      workers: 3,
      use: DESKTOP_CHROME,
    },

    // Group 5 — Financial (runs last). Each spec selects only its own invoices and payments.
    {
      name: LAST_SMOKE_PROJECT,
      testMatch: ["**/05_Financial/**"],
      dependencies: ["suite-03-procurement"],
      timeout: 360_000,
      workers: 3,
      use: DESKTOP_CHROME,
    },

    // Group 6 — Regression probes (@regression): slower or rarer feature checks. A leaf of the chain (no
    // project depends on it), so `--grep-invert @regression` leaves them out, e.g. on PRs: Playwright
    // ignores --grep in the projects others depend on. Each spec changes only records it created.
    {
      name: "suite-05-regression",
      testMatch: ["**/regression/**/*.spec.ts"],
      dependencies: [LAST_SMOKE_PROJECT],
      timeout: 360_000,
      workers: 3,
      use: DESKTOP_CHROME,
    },

    // Mocked-backend specs: the UI against recorded `/api/**` responses, no ERP needed. Last in the
    // chain so it does not compete with the timed suites; run it alone with
    // `--project=mocked --no-deps` (recordings: `pnpm pw:record`).
    {
      name: "mocked",
      testMatch: ["**/mocked/**/*.spec.ts"],
      dependencies: [LAST_SMOKE_PROJECT],
      fullyParallel: true,
      use: DESKTOP_CHROME,
    },
  ],

  // Global test timeout for suite-00-performance. Smoke suites set their own
  // higher timeouts at the project level above.
  timeout: 120_000,
  expect: { timeout: 15_000 },
});

export { BASE_URL, IFRAME_URL, DEFAULT_USER, DEFAULT_PASSWORD };
