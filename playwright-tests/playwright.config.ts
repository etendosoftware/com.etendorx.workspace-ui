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
const IS_CI = Boolean(process.env.CI);
/**
 * Longest a single action (click, fill, waitFor…) or navigation may take, unless the call gives its own timeout.
 * Without it a stuck step (a click on an element that never becomes actionable) burned the whole test timeout,
 * 360–720 s, before the retry recovered it in ~20 s. The slowest passing steps in CI were a 14 s click, a 22 s
 * typed text and a 6 s navigation (Jenkins builds 2227–2242, ETP-6295): 60 s leaves a slow pod 3–10 times that.
 */
const ACTION_TIMEOUT_MS = 60_000;
const NAVIGATION_TIMEOUT_MS = 60_000;
/**
 * In CI the browsers share 4 CPUs with the UI, Tomcat and the database: recording the video and the trace of
 * every test only to delete them when it passes costs CPU every test pays. There, record them on the first
 * retry: a failure still leaves a video and a trace to read. Locally keep them for every failure.
 */
const FAILURE_EVIDENCE = IS_CI ? "on-first-retry" : "retain-on-failure";

/**
 * Specs that take much longer than the rest of their group, each in a project of its own that starts with the
 * group: in one project the files start in alphabetical order, so they used to start last and run alone at the
 * end (PROe ~2 min, FINe ~4 min in CI, ETP-6295). The rest of the group is limited to GROUP_WORKERS so the third
 * worker is always free for the long spec, whatever order Playwright queues the projects of a phase in.
 */
const LANDED_COST_SPEC = "**/03_Procurement/PROeOrderToLandedCostTest*";
const MATCH_STATEMENT_SPEC = "**/05_Financial/FINeMatchStatementTest*";
const GROUP_WORKERS = 2;
const PROCUREMENT_PROJECTS = ["suite-03-procurement-landed-cost", "suite-03-procurement"];
/** Last projects of the smoke chain: the regression and mocked projects run after them. */
const LAST_SMOKE_PROJECTS = ["suite-04-financial-match-statement", "suite-04-financial"];

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
  retries: IS_CI ? 2 : 0,

  use: {
    baseURL: BASE_URL,
    headless: true,
    viewport: { width: 1280, height: 720 },
    screenshot: "only-on-failure",
    video: FAILURE_EVIDENCE,
    trace: FAILURE_EVIDENCE,
    actionTimeout: ACTION_TIMEOUT_MS,
    navigationTimeout: NAVIGATION_TIMEOUT_MS,
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
        // PRCf only opens the process menu: nothing is run
        "**/smoke/08_Process/PRCf*",
        // PRCg rejects the file before anything is sent
        "**/smoke/08_Process/PRCg*",
        // PRCh opens processes from the menu: grid full screen, a file request and a multi-selector request; nothing is run
        "**/smoke/08_Process/PRCh*",
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
    // document numbers; PROe runs the client-wide costing process, harmless to the others. PROe, the longest,
    // has a project of its own that starts with the group (see LANDED_COST_SPEC).
    {
      name: PROCUREMENT_PROJECTS[0],
      testMatch: [LANDED_COST_SPEC],
      dependencies: ["suite-02-sales"],
      timeout: 360_000,
      use: DESKTOP_CHROME,
    },
    {
      name: PROCUREMENT_PROJECTS[1],
      testMatch: ["**/03_Procurement/**"],
      // Read-only, it already runs in suite-01-base
      testIgnore: ["**/PurchaseOrderDisplayLogicTest*", LANDED_COST_SPEC],
      dependencies: ["suite-02-sales"],
      timeout: 360_000,
      workers: GROUP_WORKERS,
      use: DESKTOP_CHROME,
    },

    // Group 5 — Financial (runs last). Each spec selects only its own invoices and payments. FINe, the
    // longest, has a project of its own that starts with the group (see MATCH_STATEMENT_SPEC).
    {
      name: LAST_SMOKE_PROJECTS[0],
      testMatch: [MATCH_STATEMENT_SPEC],
      dependencies: PROCUREMENT_PROJECTS,
      timeout: 360_000,
      use: DESKTOP_CHROME,
    },
    {
      name: LAST_SMOKE_PROJECTS[1],
      testMatch: ["**/05_Financial/**"],
      testIgnore: [MATCH_STATEMENT_SPEC],
      dependencies: PROCUREMENT_PROJECTS,
      timeout: 360_000,
      workers: GROUP_WORKERS,
      use: DESKTOP_CHROME,
    },

    // Group 6 — Regression probes (@regression): slower or rarer feature checks. A leaf of the chain (no
    // project depends on it), so `--grep-invert @regression` leaves them out, e.g. on PRs: Playwright
    // ignores --grep in the projects others depend on. Each spec changes only records it created.
    {
      name: "suite-05-regression",
      testMatch: ["**/regression/**/*.spec.ts"],
      dependencies: LAST_SMOKE_PROJECTS,
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
      dependencies: LAST_SMOKE_PROJECTS,
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
